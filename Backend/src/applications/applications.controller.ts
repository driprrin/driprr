import {
  Controller, Get, Post, Patch, Param, Body,
  Query, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApplicationsService } from './applications.service';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { IsString, IsOptional, IsNotEmpty } from 'class-validator';

class ApproveDto {}

class RejectDto {
  @IsString() @IsNotEmpty()
  reason: string;
}

@Controller('applications')
@UseGuards(AuthGuard)
export class ApplicationsController {
  constructor(private readonly applicationsService: ApplicationsService) {}

  // GET /api/applications/stores?status=PENDING
  @Get('stores')
  findAllStore(@Query('status') status?: string) {
    return this.applicationsService.findAllStore(status);
  }

  // POST /api/applications/stores/:id/approve
  @Post('stores/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveStore(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.approveStore(id, user.id);
  }

  // POST /api/applications/stores/:id/reject
  @Post('stores/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectStore(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.rejectStore(id, user.id, dto.reason);
  }

  // POST /api/applications/riders/:id/approve
  @Post('riders/:id/approve')
  @HttpCode(HttpStatus.OK)
  approveRider(@Param('id') id: string, @CurrentUser() user: any) {
    return this.applicationsService.approveRider(id, user.id);
  }

  // POST /api/applications/riders/:id/reject
  @Post('riders/:id/reject')
  @HttpCode(HttpStatus.OK)
  rejectRider(
    @Param('id') id: string,
    @Body() dto: RejectDto,
    @CurrentUser() user: any,
  ) {
    return this.applicationsService.rejectRider(id, user.id, dto.reason);
  }
}
