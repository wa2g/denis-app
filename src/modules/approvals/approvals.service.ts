import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Approval } from './entities/approval.entity';
import { CreateApprovalDto } from './dto/create-approval.dto';
import { InvoicesService } from '../invoices/invoices.service';
import { UserRole } from '../users/enums/user-role.enum';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { InvoiceStatus } from '../invoices/enums/invoice-status.enum';
import { UsersService } from '../users/users.service';

@Injectable()
export class ApprovalsService {
  constructor(
    @InjectRepository(Approval)
    private approvalsRepository: Repository<Approval>,
    private invoicesService: InvoicesService,
    private notificationsService: NotificationsService,
    private usersService: UsersService,
  ) {}

  async create(createApprovalDto: CreateApprovalDto, approverId: string): Promise<Approval> {
    const user = await this.usersService.findOne(approverId);
    const invoice = await this.invoicesService.findOne(
      createApprovalDto.invoiceId,
      approverId,
      user.role
    );
    
    const approval = this.approvalsRepository.create({
      ...createApprovalDto,
      approver: { id: approverId },
      invoice: { id: invoice.id },
    });

    const savedApproval = await this.approvalsRepository.save(approval);

    // Update invoice status based on approver role
    if (user.role === UserRole.MANAGER) {
      await this.invoicesService.updateStatus(
        invoice.id, 
        { status: InvoiceStatus.MANAGER_APPROVED },
        user
      );
      // Notify CEO
      await this.notificationsService.notifyRole(
        UserRole.CEO,
        `Invoice ${invoice.id} has been approved by manager`
      );
    } else if (user.role === UserRole.CEO) {
      await this.invoicesService.updateStatus(
        invoice.id,
        { status: InvoiceStatus.APPROVED },
        user
      );
      // Notify order manager and accountant
      await this.notificationsService.notifyRole(
        UserRole.ORDER_MANAGER,
        `Invoice ${invoice.id} has been approved by CEO`
      );
      await this.notificationsService.notifyRole(
        UserRole.ACCOUNTANT,
        `Invoice ${invoice.id} has been approved by CEO`
      );
    }

    return savedApproval;
  }
} 