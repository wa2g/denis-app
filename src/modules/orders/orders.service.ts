import { Injectable, NotFoundException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderStatus } from './enums/order-status.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { NotificationsService } from '../notifications/notifications.service';
import { OrderDetailsDto } from './dto/order-details.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private ordersRepository: Repository<Order>,
    private notificationsService: NotificationsService,
  ) {}

  async findOne(orderNumber: string, userId: string, userRole: UserRole): Promise<Order> {
    try {
      console.log(`Finding order with order number: ${orderNumber}`);
      
      if (!orderNumber) {
        throw new Error('Order number is required');
      }

      const queryBuilder = this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderManager', 'orderManager')
        .leftJoinAndSelect('order.approvedBy', 'approvedBy')
        .leftJoinAndSelect('order.invoices', 'invoice')
        .leftJoinAndSelect('invoice.approvedBy', 'invoiceApprovedBy')
        .where('order.orderNumber = :orderNumber', { orderNumber });

      const order = await queryBuilder.getOne();

      console.log('Query result:', JSON.stringify(order, null, 2));

      if (!order) {
        throw new NotFoundException(`Order with number "${orderNumber}" not found`);
      }

      // Admin, CEO, Manager and Accountant can view all orders
      if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
        return order;
      }

      // Order Managers and Customers can only view their own orders
      if ([UserRole.ORDER_MANAGER, UserRole.CUSTOMER].includes(userRole)) {
        if (!order.orderManager || order.orderManager.id !== userId) {
          throw new ForbiddenException('You do not have permission to view this order');
        }
      }

      return order;
    } catch (error) {
      console.error('Error finding order:', error);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      if (error.name === 'QueryFailedError') {
        console.error('Database query error:', error);
        throw new InternalServerErrorException('Database query failed');
      }
      
      throw new InternalServerErrorException(
        `Failed to retrieve order: ${error.message}`
      );
    }
  }

  async updateOrderStatus(
    orderNumber: string,
    updateStatusDto: UpdateOrderStatusDto,
    userId: string,
    userRole: UserRole
  ): Promise<Order> {
    try {
      const order = await this.findOne(orderNumber, userId, userRole);

      // Validate state transition
      this.validateStatusTransition(order.status, updateStatusDto.status, userRole);

      // Update the order status
      order.status = updateStatusDto.status;
      
      // Set approvedBy if the order is being approved
      if (updateStatusDto.status === OrderStatus.APPROVED) {
        order.approvedById = userId;
      }

      const savedOrder = await this.ordersRepository.save(order);

      // Send notifications based on the new status
      await this.sendStatusUpdateNotifications(savedOrder, updateStatusDto.reason);

      return savedOrder;
    } catch (error) {
      console.error('Error updating order status:', error);
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update order status: ${error.message}`
      );
    }
  }

  async getOrderDetails(orderNumber: string, userId: string, userRole: UserRole): Promise<OrderDetailsDto> {
    try {
      console.log(`Getting order details for order number: ${orderNumber}`);
      
      if (!orderNumber) {
        throw new Error('Order number is required');
      }

      const order = await this.ordersRepository.findOne({
        where: { orderNumber },
        relations: {
          orderManager: true,
          approvedBy: true
        }
      });

      console.log('Found order:', JSON.stringify(order, null, 2));

      if (!order) {
        throw new NotFoundException(`Order with number "${orderNumber}" not found`);
      }

      // Admin, CEO, Manager and Accountant can view all orders
      if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
        // Continue with order details
      } else if (userRole === UserRole.ORDER_MANAGER && order.orderManager.id !== userId) {
        // Order Managers can only view their own orders
        throw new ForbiddenException('You do not have permission to view this order');
      }

      const orderDetails: OrderDetailsDto = {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.date,
        companyName: order.companyName,
        farmName: order.farmName,
        farmNumber: order.farmNumber,
        villageName: order.villageName,
        region: order.region,
        pobox: order.pobox,
        contactName: order.contactName,
        phoneNumber: order.phoneNumber,
        items: order.items || [],
        totalAmount: order.totalAmount,
        status: order.status,
        preparedBy: order.orderManager?.name || 'Unknown',
        approvedBy: order.status === OrderStatus.APPROVED ? order.approvedBy?.name : undefined,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt
      };

      console.log('Returning order details:', JSON.stringify(orderDetails, null, 2));
      return orderDetails;
    } catch (error) {
      console.error('Error getting order details:', error);
      
      if (error instanceof NotFoundException || error instanceof ForbiddenException) {
        throw error;
      }
      
      if (error.name === 'QueryFailedError') {
        console.error('Database query error:', error);
        throw new InternalServerErrorException('Database query failed');
      }
      
      throw new InternalServerErrorException(
        `Failed to retrieve order details: ${error.message}`
      );
    }
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
    userRole: UserRole
  ): void {
    // Accountants can only move PENDING orders to IN_PROGRESS
    if (currentStatus === OrderStatus.PENDING) {
      if (userRole !== UserRole.ACCOUNTANT) {
        throw new ForbiddenException('Only accountants can approve pending orders for payment');
      }
      if (newStatus !== OrderStatus.IN_PROGRESS) {
        throw new ForbiddenException('Orders must first be moved to IN_PROGRESS status for payment');
      }
    }

    // Only CEO and Manager can move IN_PROGRESS orders to APPROVED
    if (currentStatus === OrderStatus.IN_PROGRESS) {
      if (![UserRole.CEO, UserRole.MANAGER].includes(userRole)) {
        throw new ForbiddenException('Only CEO and managers can approve orders for delivery');
      }
      if (newStatus !== OrderStatus.APPROVED) {
        throw new ForbiddenException('IN_PROGRESS orders can only be moved to APPROVED status');
      }
    }

    // Anyone with permission can cancel PENDING or IN_PROGRESS orders
    if (newStatus === OrderStatus.CANCELLED) {
      if (![OrderStatus.PENDING, OrderStatus.IN_PROGRESS].includes(currentStatus)) {
        throw new ForbiddenException('Only pending or in-progress orders can be cancelled');
      }
      if (![UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.CEO].includes(userRole)) {
        throw new ForbiddenException('Only accountants, managers, and CEO can cancel orders');
      }
    }

    // Prevent updates to already approved or cancelled orders
    if ([OrderStatus.APPROVED, OrderStatus.CANCELLED].includes(currentStatus)) {
      throw new ForbiddenException(`Cannot update status of ${currentStatus.toLowerCase()} orders`);
    }
  }

  private async sendStatusUpdateNotifications(order: Order, reason?: string): Promise<void> {
    let message = '';
    let targetRole = UserRole.ORDER_MANAGER;

    switch (order.status) {
      case OrderStatus.IN_PROGRESS:
        message = `Order ${order.orderNumber} has been approved for payment and invoice creation`;
        // Notify CEO and managers that the order is ready for final approval
        await this.notificationsService.notifyRole(
          UserRole.CEO,
          `Order ${order.orderNumber} is ready for final approval`
        );
        await this.notificationsService.notifyRole(
          UserRole.MANAGER,
          `Order ${order.orderNumber} is ready for final approval`
        );
        break;
      case OrderStatus.APPROVED:
        message = `Order ${order.orderNumber} has been approved for delivery`;
        // Also notify for delivery preparation
        await this.notificationsService.notifyRole(
          UserRole.ORDER_MANAGER,
          `Order ${order.orderNumber} is approved and ready for delivery`
        );
        break;
      case OrderStatus.CANCELLED:
        message = `Order ${order.orderNumber} has been cancelled${reason ? `: ${reason}` : ''}`;
        break;
    }

    if (message) {
      await this.notificationsService.notifyRole(targetRole, message);
    }
  }

  async create(createOrderDto: CreateOrderDto, userId: string): Promise<Order> {
    try {
      // Calculate total amount from all items
      const calculatedTotalAmount = createOrderDto.items.reduce(
        (sum, item) => sum + item.totalPrice,
        0
      );

      // Validate if the provided totalAmount matches the calculated total
      if (createOrderDto.totalAmount !== calculatedTotalAmount) {
        console.log('Adjusting total amount to match items total');
        createOrderDto.totalAmount = calculatedTotalAmount;
      }

      // Validate each item's totalPrice
      createOrderDto.items = createOrderDto.items.map(item => {
        const calculatedItemTotal = item.quantity * item.unitPrice;
        if (item.totalPrice !== calculatedItemTotal) {
          console.log(`Adjusting item total price for ${item.description}`);
          item.totalPrice = calculatedItemTotal;
        }
        return item;
      });

      const order = this.ordersRepository.create({
        ...createOrderDto,
        orderManager: { id: userId },
        status: OrderStatus.PENDING,
        date: createOrderDto.date ? new Date(createOrderDto.date) : new Date(),
      });

      console.log('Order entity created:', order);

      const savedOrder = await this.ordersRepository.save(order);
      console.log('Order saved successfully:', savedOrder);

      // Notify accountants about new order
      await this.notificationsService.notifyRole(
        UserRole.ACCOUNTANT,
        `New order created with ID: ${savedOrder.id} and Order Number: ${savedOrder.orderNumber}`
      );

      return savedOrder;
    } catch (error) {
      console.error('Error creating order:', error);
      throw new InternalServerErrorException(
        `Failed to create order: ${error.message}`
      );
    }
  }

  async findAll(userId: string, userRole: UserRole): Promise<Order[]> {
    try {
      const queryBuilder = this.ordersRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.orderManager', 'orderManager')
        .leftJoinAndSelect('order.approvedBy', 'approvedBy')
        .orderBy('order.createdAt', 'DESC');

      // Admin, CEO, Manager and Accountant can see all orders
      if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
        return queryBuilder.getMany();
      }

      // Order managers and customers can only see their own orders
      if ([UserRole.ORDER_MANAGER, UserRole.CUSTOMER].includes(userRole)) {
        return queryBuilder
          .where('order.orderManagerId = :userId', { userId })
          .getMany();
      }

      return [];
    } catch (error) {
      console.error('Error finding orders:', error);
      throw new InternalServerErrorException(`Failed to retrieve orders: ${error.message}`);
    }
  }
} 