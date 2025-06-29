import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationStatus } from './enums/notification-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import * as nodemailer from 'nodemailer';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
import { emailTemplates, EmailTemplateData } from './templates/email-templates';

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
   * Generate a PDF order document and return the file path
   */
  private async generateOrderPDF(orderNumber: string, customerEmail: string, totalAmount: number): Promise<string> {
    const doc = new PDFDocument();
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }
    const filePath = path.join(uploadsDir, `${orderNumber}_order.pdf`);
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text('Order Approval', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order Number: ${orderNumber}`);
    doc.text(`Customer Email: ${customerEmail}`);
    doc.text(`Total Amount: TZS ${totalAmount.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`);
    doc.moveDown();
    doc.text('Payment Options:', { underline: true });
    doc.text('Mobile Transfer:');
    doc.text('  Tigo Pesa - Lipa Number: 123456, Name: Spade');
    doc.text('  Vodacom M-Pesa - Lipa Number: 123456, Name: Spade');
    doc.moveDown();
    doc.text('Bank Transfer:');
    doc.text('  CRDB Bank - Account Number: 123456, Account Name: Spade');
    doc.text('  NMB Bank - Account Number: 123456, Account Name: Spade');
    doc.moveDown();
    doc.text('Once payment is completed, please share the confirmation via reply to this email or through our official contact.');
    doc.moveDown();
    doc.text('Thank you for choosing us!');
    doc.text('Best regards,');
    doc.text('Spade Team');

    doc.end();

    // Wait for the file to finish writing
    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
    return filePath;
  }

  async sendCustomerOrderApprovalNotification(
    customerEmail: string,
    orderNumber: string,
    totalAmount: number,
    customerName?: string
  ): Promise<void> {
    const templateData: EmailTemplateData = {
      orderNumber,
      customerName,
      totalAmount,
      customerEmail
    };

    const subject = emailTemplates.orderApproval.subject(templateData);
    const htmlContent = emailTemplates.orderApproval.html(templateData);
    const textContent = emailTemplates.orderApproval.text(templateData);

    // Generate PDF and get file path
    let attachmentPath: string | undefined = undefined;
    try {
      attachmentPath = await this.generateOrderPDF(orderNumber, customerEmail, totalAmount);
    } catch (err) {
      console.error('Failed to generate order PDF:', err);
    }

    // Set up Nodemailer transporter using Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions: any = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: customerEmail,
      subject,
      text: textContent,
      html: htmlContent,
    };
    
    if (attachmentPath) {
      mailOptions.attachments = [
        {
          filename: attachmentPath.split('/').pop(),
          path: attachmentPath,
        },
      ];
    }

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Order approval email sent to ${customerEmail}: ${info.messageId}`);
    } catch (error) {
      console.error(`Failed to send order approval email to ${customerEmail}:`, error);
    }
  }
} 