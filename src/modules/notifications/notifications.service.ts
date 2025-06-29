import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationStatus } from './enums/notification-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      ...createNotificationDto,
      status: NotificationStatus.UNREAD,
    });

    return this.notificationsRepository.save(notification);
  }

  async findMyNotifications(userId: string): Promise<Notification[]> {
    return this.notificationsRepository.find({
      where: { recipient: { id: userId } },
      order: { createdAt: 'DESC' },
    });
  }

  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    notification.status = NotificationStatus.READ;
    return this.notificationsRepository.save(notification);
  }

  async notifyRole(role: UserRole, message: string): Promise<void> {
    // Implementation to notify all users with specific role
    // This would typically involve looking up all users with the given role
    // and creating a notification for each one
  }

  /**
   * Send an order approval email to the customer.
   * @param customerEmail The customer's email address
   * @param orderNumber The order number
   * @param totalAmount The total amount for the order
   */
  async sendCustomerOrderApprovalNotification(customerEmail: string, orderNumber: string, totalAmount: number): Promise<void> {
    const subject = `Your order ${orderNumber} has been approved!`;
    const message = `Dear Customer,\n\nYour order ${orderNumber} has been approved!\nTotal amount: TZS ${totalAmount}.\nYou can now proceed with payment. Thank you for choosing our services.\n\nBest regards,\nSpade Team`;

    // Set up Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    try {
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to: customerEmail,
        subject,
        text: message,
      });
      console.log(`Order approval email sent to ${customerEmail}: ${info.messageId}`);
    } catch (error) {
      console.error(`Failed to send order approval email to ${customerEmail}:`, error);
    }
  }
} 