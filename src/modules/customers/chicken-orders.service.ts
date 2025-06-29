import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChickenOrder } from './entities/chicken-order.entity';
import { CreateChickenOrderDto } from './dto/create-chicken-order.dto';
import { UpdateChickenOrderDto } from './dto/update-chicken-order.dto';
import { Customer } from './entities/customer.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { ChickenStockService } from './chicken-stock.service';
import { FeedOrder } from './entities/feed-order.entity';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ChickenOrdersService {
  constructor(
    @InjectRepository(ChickenOrder)
    private readonly chickenOrdersRepository: Repository<ChickenOrder>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(FeedOrder)
    private readonly feedOrdersRepository: Repository<FeedOrder>,
    private readonly chickenStockService: ChickenStockService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async create(createChickenOrderDto: CreateChickenOrderDto, userId: string): Promise<ChickenOrder> {
    const { customerId, feedOrders, pricePerChicken, ...orderData } = createChickenOrderDto;

    // Find or create customer
    let customer: Customer;
    if (customerId) {
      customer = await this.customersRepository.findOne({ where: { id: customerId } });
      if (!customer) {
        throw new NotFoundException(`Customer with ID ${customerId} not found`);
      }
    }

    // Check stock availability and get price
    const stock = await this.chickenStockService.getStock(orderData.typeOfChicken);
    if (!stock) {
      throw new NotFoundException(`Stock not found for chicken type ${orderData.typeOfChicken}`);
    }
    
    if (stock.currentQuantity < orderData.totalChicken) {
      throw new Error(`Insufficient stock for ${orderData.typeOfChicken}. Available: ${stock.currentQuantity}, Requested: ${orderData.totalChicken}`);
    }

    if (!stock.sellingPricePerChicken) {
      throw new BadRequestException(`Selling price not set for chicken type ${orderData.typeOfChicken}`);
    }

    // Start a transaction
    return await this.chickenOrdersRepository.manager.transaction(async (transactionalEntityManager) => {
      // Use provided price or selling price from stock
      const finalPricePerChicken = pricePerChicken ?? stock.sellingPricePerChicken;
      const totalChickenPrice = orderData.totalChicken * finalPricePerChicken;

      // Create the chicken order
      const order = this.chickenOrdersRepository.create({
        ...orderData,
        customerId,
        pricePerChicken: finalPricePerChicken,
        totalChickenPrice
      });

      // Save the chicken order
      const savedOrder = await transactionalEntityManager.save(ChickenOrder, order);

      // Create and save feed orders if provided
      if (feedOrders && feedOrders.length > 0) {
        const feedOrderEntities = feedOrders.map(feedOrderDto => {
          const feedOrder = this.feedOrdersRepository.create({
            ...feedOrderDto,
            totalPrice: feedOrderDto.quantity * feedOrderDto.pricePerUnit,
            chickenOrderId: savedOrder.id
          });
          return feedOrder;
        });

        await transactionalEntityManager.save(FeedOrder, feedOrderEntities);
      }

      // Reduce chicken stock
      await this.chickenStockService.reduceStock(orderData.typeOfChicken, orderData.totalChicken);

      // Return the order with feed orders
      return await transactionalEntityManager.findOne(ChickenOrder, {
        where: { id: savedOrder.id },
        relations: ['feedOrders']
      });
    });
  }

  async findAll(userId: string, userRole: UserRole): Promise<ChickenOrder[]> {
    return this.chickenOrdersRepository.find({
      relations: ['customer'],
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<ChickenOrder> {
    const order = await this.chickenOrdersRepository.findOne({
      where: { id },
      relations: ['customer'],
    });

    if (!order) {
      throw new NotFoundException(`Chicken order with ID ${id} not found`);
    }

    return order;
  }

  async update(id: string, updateChickenOrderDto: UpdateChickenOrderDto, userId: string, userRole: UserRole): Promise<ChickenOrder> {
    const order = await this.findOne(id, userId, userRole);
    const { typeOfChicken, totalChicken } = updateChickenOrderDto;

    // If changing quantity, check stock availability
    if (totalChicken && totalChicken !== order.totalChicken) {
      const difference = totalChicken - order.totalChicken;
      
      if (difference > 0) {
        // Check if additional stock is available
        const stock = await this.chickenStockService.getStock(typeOfChicken || order.typeOfChicken);
        if (stock.currentQuantity < difference) {
          throw new Error(`Insufficient stock for ${typeOfChicken || order.typeOfChicken}. Available: ${stock.currentQuantity}, Additional requested: ${difference}`);
        }
      }

      // Update stock
      if (difference > 0) {
        await this.chickenStockService.reduceStock(typeOfChicken || order.typeOfChicken, difference);
      } else {
        // Return stock if reducing order quantity
        await this.chickenStockService.addStock(
          typeOfChicken || order.typeOfChicken,
          { quantity: Math.abs(difference) }
        );
      }
    }

    // Update the order
    Object.assign(order, updateChickenOrderDto);
    return this.chickenOrdersRepository.save(order);
  }

  async findByCustomer(customerId: string, userId: string, userRole: UserRole): Promise<ChickenOrder[]> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }

    return this.chickenOrdersRepository.find({
      where: { customerId },
      order: {
        orderDate: 'DESC',
      },
    });
  }

  async updateReceivingStatus(id: string, receivingStatus: string, userId: string, userRole: UserRole): Promise<ChickenOrder> {
    const order = await this.findOne(id, userId, userRole);

    // Validate status transition
    if (order.receivingStatus === 'PENDING' && receivingStatus !== 'IN_PROGRESS') {
      throw new BadRequestException('Pending orders can only be moved to IN_PROGRESS status');
    }

    if (order.receivingStatus === 'IN_PROGRESS' && receivingStatus !== 'APPROVED') {
      throw new BadRequestException('IN_PROGRESS orders can only be moved to APPROVED status');
    }

    if (['APPROVED', 'CANCELLED'].includes(order.receivingStatus)) {
      throw new BadRequestException(`Cannot update status of ${order.receivingStatus.toLowerCase()} orders`);
    }

    // Update the receiving status
    order.receivingStatus = receivingStatus;

    const savedOrder = await this.chickenOrdersRepository.save(order);

    // Send notifications based on the new status
    await this.sendReceivingStatusNotifications(savedOrder);

    return savedOrder;
  }

  private async sendReceivingStatusNotifications(order: ChickenOrder): Promise<void> {
    switch (order.receivingStatus) {
      case 'IN_PROGRESS':
        // Notify managers that the order is ready for approval
        await this.notificationsService.notifyRole(
          UserRole.MANAGER,
          `Chicken order ${order.id} is ready for approval`
        );
        break;
      case 'APPROVED':
        // Send email notification to customer when order is approved
        if (order.customer?.email) {
          const totalAmount = order.totalChickenPrice;
          await this.notificationsService.sendCustomerOrderApprovalNotification(
            order.customer.email,
            `CHK-${order.id.slice(0, 8)}`, // Create a simple order number
            totalAmount,
            order.customer.name
          );
        } else {
          console.log(`No email address found for customer ${order.customerId}. Email notification skipped.`);
        }
        break;
    }
  }
} 