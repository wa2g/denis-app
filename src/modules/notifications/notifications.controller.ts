import { Controller, Get, Post, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiOperation, ApiBody, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMyNotifications(@Request() req) {
    return this.notificationsService.findMyNotifications(req.user.id);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  // Admin only endpoint to create notifications manually if needed
  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Post('test-email')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Send test order approval email to customer', description: 'Sends a test order approval email to the specified customer email address.' })
  @ApiBody({ schema: { properties: { email: { type: 'string', example: 'customer@example.com' }, orderNumber: { type: 'string', example: 'ORD123456' }, totalAmount: { type: 'number', example: 100000 } }, required: ['email', 'orderNumber', 'totalAmount'] } })
  @ApiResponse({ status: 200, description: 'Test email sent successfully', schema: { example: { message: 'Test email sent to customer@example.com' } } })
  async sendTestEmail(@Body() body: { email: string; orderNumber: string; totalAmount: number }) {
    const { email, orderNumber, totalAmount } = body;
    await this.notificationsService.sendCustomerOrderApprovalNotification(email, orderNumber, totalAmount);
    return { message: `Test email sent to ${email}` };
  }
} 