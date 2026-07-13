import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable, Logger } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { SupabaseService } from '../auth/supabase.service';

@Injectable()
@SkipThrottle()
@WebSocketGateway({
  cors: { origin: '*', credentials: true },
  transports: ['websocket'],
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(EventsGateway.name);

  // Map userId → Set of socketIds (user can have multiple devices)
  private userSockets = new Map<string, Set<string>>();
  // Map socketId → userId
  private socketUser = new Map<string, string>();

  constructor(private readonly supabase: SupabaseService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      if (!token) { client.disconnect(); return; }

      const { data, error } = await this.supabase.getClient().auth.getUser(token);
      if (error || !data.user) { client.disconnect(); return; }

      const userId = data.user.id;
      const role   = data.user.user_metadata?.role || 'CUSTOMER';

      // Store mapping
      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);
      this.socketUser.set(client.id, userId);

      // Join role-based rooms
      client.join(`user:${userId}`);
      client.join(`role:${role}`);

      this.logger.log(`Client connected: ${client.id} — userId: ${userId} role: ${role}`);
    } catch (err) {
      // Network timeout or Supabase unreachable — disconnect gracefully
      this.logger.warn(`Client ${client.id} auth failed (timeout/network): ${err?.message ?? err}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.socketUser.get(client.id);
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
    }
    this.socketUser.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ── Emit helpers (called by other services) ──────────────────────────────

  /** Notify a specific customer about their order status change */
  emitOrderStatus(userId: string, data: {
    orderId: string;
    status:  string;
    eta?:    string;
  }) {
    this.server.to(`user:${userId}`).emit('order:status', data);
  }

  /** Notify store owners about a new order */
  emitNewOrderToStore(storeOwnerId: string, order: any) {
    this.server.to(`user:${storeOwnerId}`).emit('order:new', order);
  }

  /** Broadcast new available delivery to all online riders in a zone */
  emitDeliveryAvailable(delivery: any) {
    this.server.to('role:RIDER').emit('delivery:assigned', delivery);
  }

  /** Notify customer that rider picked up their order */
  emitDeliveryUpdate(userId: string, data: { orderId: string; status: string }) {
    this.server.to(`user:${userId}`).emit('delivery:update', data);
  }

  // ── Client → Server messages ─────────────────────────────────────────────

  /** Rider goes online/offline */
  @SubscribeMessage('rider:online')
  handleRiderOnline(@ConnectedSocket() client: Socket, @MessageBody() data: { zone: string }) {
    client.join(`zone:${data.zone}`);
    this.logger.log(`Rider ${this.socketUser.get(client.id)} is online in zone ${data.zone}`);
    return { status: 'online' };
  }

  @SubscribeMessage('rider:offline')
  handleRiderOffline(@ConnectedSocket() client: Socket) {
    this.logger.log(`Rider ${this.socketUser.get(client.id)} is offline`);
    return { status: 'offline' };
  }

  /** Ping to check connection */
  @SubscribeMessage('ping')
  handlePing() {
    return { pong: true, ts: Date.now() };
  }
}
