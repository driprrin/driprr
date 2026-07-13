import {
  Injectable, NotFoundException, BadRequestException, InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SupabaseService } from '../auth/supabase.service';
import { UserRole } from '@prisma/client';

function generatePassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  const specials = '!@#$';
  let pwd = '';
  for (let i = 0; i < 8; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  pwd += Math.floor(Math.random() * 10);
  return pwd;
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

@Injectable()
export class ApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  // ── List all store applications ─────────────────────────────────────────────
  findAllStore(status?: string) {
    return this.prisma.storeApplication.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Approve store application ───────────────────────────────────────────────
  async approveStore(id: string, reviewedBy: string) {
    const app = await this.prisma.storeApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== 'PENDING') throw new BadRequestException('Application is not pending');

    const adminClient = this.supabase.getAdminClient();
    // Use the applicant's chosen password if valid, otherwise generate one
    const tempPassword = (app as any).password && (app as any).password.length >= 6
      ? (app as any).password
      : generatePassword();

    // 1. Create Supabase auth user (or fetch existing)
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: app.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name:      app.ownerName,
        role:      'STORE_OWNER',
        storeName: app.storeName,
      },
    });

    let userId: string;

    if (authError) {
      if (authError.message.toLowerCase().includes('already registered') || authError.message.toLowerCase().includes('already been registered')) {
        // User exists — fetch their ID
        const { data: listData, error: listError } = await adminClient.auth.admin.listUsers();
        if (listError) throw new InternalServerErrorException(`Could not fetch existing user: ${listError.message}`);
        const existingUser = listData.users.find((u) => u.email === app.email);
        if (!existingUser) throw new InternalServerErrorException('User exists but could not be found');
        userId = existingUser.id;
        // Update their metadata to STORE_OWNER and confirm email
        await adminClient.auth.admin.updateUserById(userId, {
          email_confirm: true,
          user_metadata: { name: app.ownerName, role: 'STORE_OWNER', storeName: app.storeName },
        });
      } else {
        throw new InternalServerErrorException(`Failed to create auth user: ${authError.message}`);
      }
    } else {
      userId = authData?.user?.id;
      if (!userId) throw new InternalServerErrorException('Could not get user ID after creation');
    }

    // 2. Ensure User row in DB
    await this.prisma.user.upsert({
      where: { id: userId },
      create: {
        id:    userId,
        email: app.email,
        name:  app.ownerName,
        phone: app.phone || null,
        role:  UserRole.STORE_OWNER,
      },
      update: { role: UserRole.STORE_OWNER },
    });

    // 3. Create Store row
    const slug = `${slugify(app.storeName)}-${Date.now().toString(36)}`;
    const store = await this.prisma.store.create({
      data: {
        ownerId:    userId,
        name:       app.storeName,
        slug,
        address:    app.storeAddress,
        city:       app.city,
        pincode:    app.pincode,
        location:   `${app.storeAddress}, ${app.city} - ${app.pincode}`, // legacy field
        categories: app.categories,
        isOpen:     false,
        status:     'active',
      },
    });

    // 4. Update application → APPROVED
    await this.prisma.storeApplication.update({
      where: { id },
      data: {
        status:        'APPROVED',
        reviewedAt:    new Date(),
        reviewedBy,
        createdUserId:  userId,
        createdStoreId: store.id,
      },
    });

    // 5. TODO: Send email with credentials (integrate SendGrid / Resend later)
    // For now return the credentials so admin can share manually
    return {
      success: true,
      message: `Store owner account created for ${app.ownerName}`,
      credentials: {
        email:    app.email,
        password: tempPassword,
        storeId:  store.id,
        slug,
      },
    };
  }

  // ── Reject store application ────────────────────────────────────────────────
  async rejectStore(id: string, reviewedBy: string, reason: string) {
    const app = await this.prisma.storeApplication.findUnique({ where: { id } });
    if (!app) throw new NotFoundException('Application not found');
    if (app.status !== 'PENDING') throw new BadRequestException('Application is not pending');

    await this.prisma.storeApplication.update({
      where: { id },
      data: { status: 'REJECTED', rejectReason: reason, reviewedAt: new Date(), reviewedBy },
    });

    return { success: true, message: 'Application rejected' };
  }

  // ── Approve rider application ───────────────────────────────────────────────
  async approveRider(id: string, reviewedBy: string) {
    const app = await this.prisma.$queryRaw<any[]>`
      SELECT * FROM "RiderApplication" WHERE id = ${id} LIMIT 1
    `;
    const rider = app[0];
    if (!rider) throw new NotFoundException('Rider application not found');
    if (rider.status !== 'PENDING') throw new BadRequestException('Application is not pending');

    const adminClient = this.supabase.getAdminClient();
    const tempPassword = rider.password && rider.password.length >= 6
      ? rider.password
      : generatePassword();

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: rider.email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        name:        rider.fullName,
        role:        'RIDER',
        phone:       rider.phone,
        zone:        rider.preferredZone,
        vehicleType: rider.vehicleType,
      },
    });

    if (authError && !authError.message.includes('already registered')) {
      throw new InternalServerErrorException(`Failed to create auth user: ${authError.message}`);
    }

    const userId = authData?.user?.id;
    if (!userId) throw new InternalServerErrorException('Could not get user ID');

    // 2. Create User row
    await this.prisma.user.upsert({
      where: { id: userId },
      create: { id: userId, email: rider.email, name: rider.fullName, phone: rider.phone || null, role: UserRole.RIDER },
      update: { role: UserRole.RIDER },
    });

    // 3. Create Rider row
    await this.prisma.rider.upsert({
      where: { userId },
      create: { userId, zone: rider.preferredZone, vehicleType: rider.vehicleType, isActive: false },
      update: { zone: rider.preferredZone, vehicleType: rider.vehicleType },
    });

    // 4. Update application → APPROVED
    await this.prisma.$executeRaw`
      UPDATE "RiderApplication"
      SET status = 'APPROVED', "reviewedAt" = NOW(), "reviewedBy" = ${reviewedBy}
      WHERE id = ${id}
    `;

    return {
      success: true,
      message: `Rider account created for ${rider.fullName}`,
      credentials: { email: rider.email, password: tempPassword },
    };
  }

  // ── Reject rider application ────────────────────────────────────────────────
  async rejectRider(id: string, reviewedBy: string, reason: string) {
    const exists = await this.prisma.$queryRaw<any[]>`SELECT id FROM "RiderApplication" WHERE id = ${id}`;
    if (!exists.length) throw new NotFoundException('Rider application not found');

    await this.prisma.$executeRaw`
      UPDATE "RiderApplication"
      SET status = 'REJECTED', "rejectReason" = ${reason}, "reviewedAt" = NOW(), "reviewedBy" = ${reviewedBy}
      WHERE id = ${id}
    `;
    return { success: true, message: 'Rider application rejected' };
  }
}
