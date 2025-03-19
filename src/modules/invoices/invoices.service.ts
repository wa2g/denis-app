import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Invoice } from './entities/invoice.entity';
import { Request } from '../requests/entities/request.entity';
import { CreateRequestInvoiceDto } from './dto/create-request-invoice.dto';
import { InvoiceStatus } from './enums/invoice-status.enum';
import { InvoiceType } from './enums/invoice-type.enum';
import { RequestStatus } from '../requests/enums/request-status.enum';
import { format, addDays } from 'date-fns';
import { Like } from 'typeorm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { OrdersService } from '../orders/orders.service';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { User } from '../users/entities/user.entity';
import { StockService } from '../inventory/services/stock.service';

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>,
    private ordersService: OrdersService,
    private notificationsService: NotificationsService,
    private stockService: StockService,
  ) {}

  private async generateInvoiceNumber(): Promise<string> {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const datePrefix = `INVOICE-${year}/${month}/${day}`;

    // Get the latest invoice number for today
    const latestInvoice = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('invoice.invoiceNumber LIKE :prefix', { prefix: `${datePrefix}-%` })
      .orderBy('invoice.invoiceNumber', 'DESC')
      .getOne();

    let sequenceNumber = 1;
    if (latestInvoice) {
      // Extract the sequence number from the latest invoice number
      const lastSequence = parseInt(latestInvoice.invoiceNumber.split('-').pop() || '0');
      sequenceNumber = lastSequence + 1;
    }

    // Format the sequence number with leading zeros
    const formattedSequence = String(sequenceNumber).padStart(4, '0');
    return `${datePrefix}-${formattedSequence}`;
  }

  async generateInvoice(generateInvoiceDto: GenerateInvoiceDto, userId: string): Promise<Invoice> {
    try {
      // Get the order and verify it's approved
      const order = await this.ordersService.findOne(
        generateInvoiceDto.orderNumber,
        userId,
        UserRole.MANAGER
      );
      
      if (order.status !== OrderStatus.APPROVED) {
        throw new BadRequestException('Can only generate invoices for approved orders');
      }

      // Check if invoice already exists for this order
      const existingInvoice = await this.invoicesRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.order', 'order')
        .where('order.id = :orderId', { orderId: order.id })
        .getOne();

      if (existingInvoice) {
        throw new BadRequestException(
          `Invoice already exists for order ${order.orderNumber}. Cannot generate duplicate invoices for the same order.`
        );
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Convert order items to ensure proper number types
      const items = order.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }));

      // Create new invoice with correct types
      const invoice = this.invoicesRepository.create({
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: addDays(new Date(), 30),
        type: generateInvoiceDto.type,
        items,
        subtotal: Number(order.totalAmount),
        tax: 0,
        total: Number(order.totalAmount),
        status: InvoiceStatus.PENDING,
        createdById: userId,
        order: { id: order.id }
      });

      const savedInvoice = await this.invoicesRepository.save(invoice);

      // Notify relevant parties
      await this.notificationsService.notifyRole(
        UserRole.MANAGER,
        `New invoice ${invoiceNumber} generated for order ${order.orderNumber}`
      );

      return this.findOne(savedInvoice.id, userId, UserRole.MANAGER);
    } catch (error) {
      console.error('Error generating invoice:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to generate invoice: ${error.message}`
      );
    }
  }

  async create(createInvoiceDto: CreateInvoiceDto, user: User): Promise<Invoice> {
    try {
      // Check if invoice already exists for this order
      const existingInvoice = await this.invoicesRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.order', 'order')
        .where('order.id = :orderId', { orderId: createInvoiceDto.orderId })
        .getOne();

      if (existingInvoice) {
        throw new BadRequestException(
          `Invoice already exists for this order. Cannot create duplicate invoices.`
        );
      }

      // Generate invoice number
      const invoiceNumber = await this.generateInvoiceNumber();

      // Convert items to ensure proper number types
      const items = createInvoiceDto.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }));

      // Create invoice with all required fields
      const invoice = this.invoicesRepository.create({
        invoiceNumber,
        invoiceDate: new Date(),
        dueDate: addDays(new Date(), 30),
        type: createInvoiceDto.type,
        items,
        subtotal: Number(createInvoiceDto.amount),
        tax: 0,
        total: Number(createInvoiceDto.amount),
        status: InvoiceStatus.PENDING,
        createdById: user.id,
        order: { id: createInvoiceDto.orderId }
      });

      const savedInvoice = await this.invoicesRepository.save(invoice);

      // Update order status to APPROVED
      await this.ordersService.updateOrderStatus(
        createInvoiceDto.orderId,
        { status: OrderStatus.APPROVED },
        user.id,
        user.role
      );

      // Notify managers about new invoice
      await this.notificationsService.notifyRole(
        UserRole.MANAGER,
        `New invoice ${invoiceNumber} created for order: ${createInvoiceDto.orderId}`
      );

      return this.findOne(savedInvoice.id, user.id, user.role);
    } catch (error) {
      console.error('Error creating invoice:', error);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create invoice: ${error.message}`
      );
    }
  }

  async findAll(userId: string, userRole: UserRole): Promise<Invoice[]> {
    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.createdBy', 'createdBy')
      .leftJoinAndSelect('invoice.approvedBy', 'approvedBy')
      .leftJoinAndSelect('invoice.order', 'order')
      .leftJoinAndSelect('order.orderManager', 'orderManager')
      .orderBy('invoice.createdAt', 'DESC');

    // Order managers and accountants can only see their own invoices
    if ([UserRole.ORDER_MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
      queryBuilder.where('invoice.createdById = :userId', { userId });
    }
    // Admin, CEO, and Manager can see all invoices
    else if (![UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER].includes(userRole)) {
      return []; // For any other role (shouldn't happen due to guards)
    }

    return queryBuilder.getMany();
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Invoice> {
    const queryBuilder = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.createdBy', 'createdBy')
      .leftJoinAndSelect('invoice.approvedBy', 'approvedBy')
      .leftJoinAndSelect('invoice.order', 'order')
      .where('invoice.id = :id', { id });

    const invoice = await queryBuilder.getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice with ID ${id} not found`);
    }

    // Admin, CEO, and Manager can view all invoices
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER].includes(userRole)) {
      return invoice;
    }

    // Order Managers and Accountants can only view their own invoices
    if (invoice.createdBy.id !== userId) {
      throw new ForbiddenException('You do not have permission to view this invoice');
    }

    return invoice;
  }

  async findByRequest(requestId: string): Promise<Invoice[]> {
    return this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.createdBy', 'createdBy')
      .leftJoinAndSelect('invoice.approvedBy', 'approvedBy')
      .leftJoinAndSelect('invoice.order', 'order')
      .leftJoinAndSelect('order.orderManager', 'orderManager')
      .where('invoice.requestId = :requestId', { requestId })
      .orderBy('invoice.createdAt', 'DESC')
      .getMany();
  }

  async updateStatus(id: string, updateInvoiceStatusDto: UpdateInvoiceStatusDto, user: User): Promise<Invoice> {
    const invoice = await this.findOne(id, user.id, user.role);
    invoice.status = updateInvoiceStatusDto.status;
    return this.invoicesRepository.save(invoice);
  }

  async updateInvoiceStatus(
    id: string,
    updateStatusDto: UpdateInvoiceStatusDto,
    userId: string,
    userRole: UserRole
  ): Promise<Invoice> {
    const invoice = await this.findOne(id, userId, userRole);

    // Validate status transition
    this.validateStatusTransition(invoice.status, updateStatusDto.status, userRole);

    // If invoice is being approved, create stock items
    if (updateStatusDto.status === InvoiceStatus.APPROVED) {
      // Load the full order details if not already loaded
      if (!invoice.order) {
        const fullInvoice = await this.invoicesRepository.findOne({
          where: { id: invoice.id },
          relations: ['order']
        });
        if (!fullInvoice || !fullInvoice.order) {
          throw new BadRequestException('Invoice order not found');
        }
        invoice.order = fullInvoice.order;
      }

      try {
        // Create stock items from the order
        await this.stockService.createStockItemsFromOrder(invoice.order);

        // Send notification to order manager about pending stock
        await this.notificationsService.notifyRole(
          UserRole.ORDER_MANAGER,
          `New stock items created for invoice ${invoice.invoiceNumber}. Please review and receive the stock.`
        );
      } catch (error) {
        console.error('Error creating stock items:', error);
        throw new BadRequestException(`Failed to create stock items: ${error.message}`);
      }
    }

    // Update status
    invoice.status = updateStatusDto.status;
    invoice.approvedById = userId;

    const updatedInvoice = await this.invoicesRepository.save(invoice);

    // Send notifications
    await this.sendStatusUpdateNotifications(updatedInvoice, updateStatusDto.reason);

    return updatedInvoice;
  }

  private validateStatusTransition(
    currentStatus: InvoiceStatus,
    newStatus: InvoiceStatus,
    userRole: UserRole
  ): void {
    // Only MANAGER and CEO can approve/reject invoices
    if (![UserRole.MANAGER, UserRole.CEO].includes(userRole)) {
      throw new BadRequestException('Only managers and CEOs can approve or reject invoices');
    }

    // Cannot update already approved or cancelled invoices
    if ([InvoiceStatus.APPROVED, InvoiceStatus.CANCELLED].includes(currentStatus)) {
      throw new BadRequestException(`Cannot update status of ${currentStatus.toLowerCase()} invoices`);
    }

    // Validate status transitions based on user role
    if (userRole === UserRole.MANAGER) {
      if (currentStatus === InvoiceStatus.PENDING && newStatus !== InvoiceStatus.MANAGER_APPROVED && newStatus !== InvoiceStatus.CANCELLED) {
        throw new BadRequestException('Manager can only approve to MANAGER_APPROVED or cancel from PENDING state');
      }
    } else if (userRole === UserRole.CEO) {
      if (currentStatus === InvoiceStatus.MANAGER_APPROVED && newStatus !== InvoiceStatus.APPROVED && newStatus !== InvoiceStatus.CANCELLED) {
        throw new BadRequestException('CEO can only approve to APPROVED or cancel from MANAGER_APPROVED state');
      }
    }
  }

  private async sendStatusUpdateNotifications(invoice: Invoice, reason?: string): Promise<void> {
    let message = '';
    let targetRole = UserRole.ACCOUNTANT;

    switch (invoice.status) {
      case InvoiceStatus.MANAGER_APPROVED:
        message = `Invoice ${invoice.invoiceNumber} has been approved by manager`;
        targetRole = UserRole.CEO; // Notify CEO for final approval
        break;
      case InvoiceStatus.APPROVED:
        message = `Invoice ${invoice.invoiceNumber} has been approved by CEO`;
        targetRole = UserRole.ORDER_MANAGER; // Notify order manager to handle stock
        break;
      case InvoiceStatus.CANCELLED:
        message = `Invoice ${invoice.invoiceNumber} has been cancelled${reason ? `: ${reason}` : ''}`;
        break;
    }

    if (message) {
      await this.notificationsService.notifyRole(targetRole, message);
    }
  }

  async createFromRequest(createRequestInvoiceDto: CreateRequestInvoiceDto, user: User): Promise<Invoice> {
    try {
      const existingInvoice = await this.findOne(createRequestInvoiceDto.requestId, user.id, user.role);
      const request = await this.requestsRepository.findOne({
        where: { id: createRequestInvoiceDto.requestId },
        relations: ['createdBy']
      });

      if (!request) {
        throw new NotFoundException(`Request with ID ${createRequestInvoiceDto.requestId} not found`);
      }

      if (request.status !== RequestStatus.APPROVED) {
        throw new BadRequestException('Can only generate invoice for approved requests');
      }

      // Generate invoice number using the common method
      const invoiceNumber = await this.generateInvoiceNumber();
      const today = new Date();

      // Convert items to ensure proper number types
      const items = request.items.map(item => ({
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice)
      }));

      // Use subtotal as the total amount without tax
      const subtotal = Number(request.invoiceSubtotal);

      // Create invoice with correct types
      const invoice = this.invoicesRepository.create({
        invoiceNumber,
        invoiceDate: today,
        dueDate: addDays(today, 30),
        type: InvoiceType.REQUEST,
        items,
        subtotal,
        tax: 0,
        total: subtotal,
        status: InvoiceStatus.PENDING,
        notes: createRequestInvoiceDto.notes,
        requestId: request.id,
        createdById: user.id
      });

      const savedInvoice = await this.invoicesRepository.save(invoice);

      // Update request status to INVOICED
      request.status = RequestStatus.INVOICED;
      await this.requestsRepository.save(request);

      // Notify relevant parties
      await this.notificationsService.notifyRole(
        UserRole.MANAGER,
        `New invoice ${invoiceNumber} generated for request ${request.requestNumber}`
      );

      return this.findOne(savedInvoice.id, user.id, user.role);
    } catch (error) {
      console.error('Error creating invoice from request:', error);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to create invoice from request: ${error.message}`
      );
    }
  }
} 