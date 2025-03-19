import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Sale } from '../sales/entities/sale.entity';
import { PaymentType } from '../sales/enums/payment-type.enum';
import { UserRole } from '../users/enums/user-role.enum';
import { CustomerCenter } from './enums/customer-center.enum';
import { UpdateBatchTrackingDto } from './dto/update-batch-tracking.dto';
import { AddFarmVisitDto } from './dto/add-farm-visit.dto';
import { UpdateChickOrderTrackingDto } from './dto/update-chick-order-tracking.dto';
import { ChickenTrackingEntity } from './entities/chicken-tracking.entity';
import { User } from '../users/entities/user.entity';
import { ChickenOrder } from './entities/chicken-order.entity';
import { FeedOrder } from './entities/feed-order.entity';
import { CreateCustomerWithOrderDto } from './dto/create-customer-with-order.dto';
import { PaymentStatus } from './enums/payment-status.enum';
import { Brackets } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderStatus } from '../orders/enums/order-status.enum';

@Injectable()
export class CustomersService {
  private readonly ALL_CENTERS = [CustomerCenter.KAHAMA, CustomerCenter.SHINYANGA, CustomerCenter.MAGANZO];
  private readonly ADMIN_ROLES = [UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER];

  constructor(
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(ChickenTrackingEntity)
    private readonly chickenTrackingRepository: Repository<ChickenTrackingEntity>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(ChickenOrder)
    private readonly chickenOrdersRepository: Repository<ChickenOrder>,
    @InjectRepository(FeedOrder)
    private readonly feedOrdersRepository: Repository<FeedOrder>,
    @InjectRepository(Order)
    private readonly ordersRepository: Repository<Order>
  ) {}

  async create(createCustomerDto: CreateCustomerDto, userId: string): Promise<Customer> {
    // Get the user who is creating the customer
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // For ADMIN, CEO, and MANAGER roles, they must specify the center when creating a customer
    if (this.ADMIN_ROLES.includes(user.role)) {
      if (!createCustomerDto.center) {
        throw new BadRequestException('Center must be specified for admin roles');
      }
    } else {
      // For other roles like ORDER_MANAGER, they must have a center assigned
      if (!user.center) {
        throw new BadRequestException('User does not have a center assigned');
      }
      // Use the user's assigned center
      createCustomerDto.center = user.center;
    }

    const customer = this.customersRepository.create({
      ...createCustomerDto,
      createdBy: { id: userId }
    });
    
    const savedCustomer = await this.customersRepository.save(customer);
    
    return this.customersRepository.findOne({
      where: { id: savedCustomer.id },
      relations: {
        sales: true,
        createdBy: true,
        chickenOrders: {
          feedOrders: true
        },
        chickenTrackings: true
      },
      order: {
        createdAt: 'DESC',
        chickenOrders: {
          createdAt: 'DESC',
          feedOrders: {
            createdAt: 'DESC'
          }
        },
        chickenTrackings: {
          createdAt: 'DESC'
        }
      }
    });
  }

  async findByCenter(center: CustomerCenter, userId: string, userRole: UserRole): Promise<Customer[]> {
    try {
      // First get the base customer data
      const query = this.customersRepository
        .createQueryBuilder('customer')
        .leftJoinAndSelect('customer.createdBy', 'createdBy')
        .leftJoinAndSelect('customer.chickenOrders', 'chickenOrders', 'chickenOrders.customerId = customer.id')
        .leftJoinAndSelect('chickenOrders.feedOrders', 'feedOrders', 'feedOrders.chickenOrderId = chickenOrders.id')
        .leftJoinAndSelect('customer.chickenTrackings', 'chickenTrackings', 'chickenTrackings.customerId = customer.id');

      // Admin roles can see customers from any center
      if (this.ADMIN_ROLES.includes(userRole)) {
        if (center) {
          query.where('customer.center = :center', { center });
        }
      } else if (userRole === UserRole.ORDER_MANAGER) {
        // Order managers can only see their own customers from their assigned center
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user?.center) {
          throw new BadRequestException('User does not have a center assigned');
        }

        // Only allow access to their assigned center
        if (center !== user.center) {
          throw new ForbiddenException('You can only access customers from your assigned center');
        }

        query
          .where('customer.center = :center', { center })
          .andWhere('customer.createdById = :userId', { userId });
      }

      const customers = await query
        .orderBy({
          'customer.createdAt': 'DESC',
          'chickenOrders.createdAt': 'DESC',
          'feedOrders.createdAt': 'DESC',
          'chickenTrackings.createdAt': 'DESC'
        })
        .getMany();

      // Now load the relations for each customer
      const customersWithRelations = await Promise.all(
        customers.map(async (customer) => {
          return await this.customersRepository.findOne({
            where: { id: customer.id },
            relations: {
              sales: true,
              createdBy: true,
              chickenOrders: {
                feedOrders: true
              },
              chickenTrackings: true
            }
          });
        })
      );

      return customersWithRelations.filter(customer => customer !== null) as Customer[];
    } catch (error) {
      console.error('Error in findByCenter:', error);
      throw error;
    }
  }

  async findAll(userId: string, userRole: UserRole, center?: CustomerCenter): Promise<Customer[]> {
    try {
      // First get the base customer data
      const query = this.customersRepository
        .createQueryBuilder('customer')
        .leftJoinAndSelect('customer.createdBy', 'createdBy')
        .leftJoinAndSelect('customer.chickenOrders', 'chickenOrders', 'chickenOrders.customerId = customer.id')
        .leftJoinAndSelect('chickenOrders.feedOrders', 'feedOrders', 'feedOrders.chickenOrderId = chickenOrders.id')
        .leftJoinAndSelect('customer.chickenTrackings', 'chickenTrackings', 'chickenTrackings.customerId = customer.id');

      // Admin roles can see all customers or filter by center
      if (this.ADMIN_ROLES.includes(userRole)) {
        if (center) {
          query.where('customer.center = :center', { center });
        }
      } else if (userRole === UserRole.ORDER_MANAGER) {
        // Order managers can only see their own customers from their assigned center
        const user = await this.usersRepository.findOne({ where: { id: userId } });
        if (!user?.center) {
          throw new BadRequestException('User does not have a center assigned');
        }

        // If center is specified, ensure it matches their assigned center
        if (center && center !== user.center) {
          throw new ForbiddenException('You can only access customers from your assigned center');
        }

        query
          .where('customer.center = :center', { center: user.center })
          .andWhere('customer.createdById = :userId', { userId });
      }

      const customers = await query
        .orderBy({
          'customer.createdAt': 'DESC',
          'chickenOrders.createdAt': 'DESC',
          'feedOrders.createdAt': 'DESC',
          'chickenTrackings.createdAt': 'DESC'
        })
        .getMany();

      // Now load the relations for each customer
      const customersWithRelations = await Promise.all(
        customers.map(async (customer) => {
          return await this.customersRepository.findOne({
            where: { id: customer.id },
            relations: {
              sales: true,
              createdBy: true,
              chickenOrders: {
                feedOrders: true
              },
              chickenTrackings: true
            },
            select: {
              chickenTrackings: {
                id: true,
                customerId: true,
                totalOrdered: true,
                totalReceived: true,
                lastDeliveryDate: true,
                pendingDeliveries: true,
                currentBatch: {
                  initialCount: true,
                  currentCount: true,
                  startDate: true,
                  bandaCondition: true,
                  lastInspectionDate: true,
                  progressHistory: true
                },
                healthStatus: {
                  sickCount: true,
                  deadCount: true,
                  soldCount: true,
                  averageWeight: true,
                  averageAge: true
                },
                farmVisits: true,
                batchHistory: true,
                createdAt: true,
                updatedAt: true
              }
            },
            order: {
              createdAt: 'DESC',
              chickenOrders: {
                createdAt: 'DESC',
                feedOrders: {
                  createdAt: 'DESC'
                }
              },
              chickenTrackings: {
                createdAt: 'DESC'
              }
            }
          });
        })
      );

      return customersWithRelations.filter(customer => customer !== null) as Customer[];
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Customer> {
    const customer = await this.customersRepository.findOne({
      where: { id },
      relations: {
        sales: true,
        createdBy: true,
        chickenOrders: {
          feedOrders: true
        },
        chickenTrackings: true
      },
      select: {
        chickenTrackings: {
          id: true,
          customerId: true,
          totalOrdered: true,
          totalReceived: true,
          lastDeliveryDate: true,
          pendingDeliveries: true,
          currentBatch: {
            initialCount: true,
            currentCount: true,
            startDate: true,
            bandaCondition: true,
            lastInspectionDate: true,
            progressHistory: true
          },
          healthStatus: {
            sickCount: true,
            deadCount: true,
            soldCount: true,
            averageWeight: true,
            averageAge: true
          },
          farmVisits: true,
          batchHistory: true,
          createdAt: true,
          updatedAt: true
        }
      },
      order: {
        createdAt: 'DESC',
        chickenOrders: {
          createdAt: 'DESC',
          feedOrders: {
            createdAt: 'DESC'
          }
        },
        chickenTrackings: {
          createdAt: 'DESC'
        }
      }
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    // Admin, CEO, Manager and Accountant can view all customers
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
      return customer;
    }

    // Order Managers can only view their own customers
    if (userRole === UserRole.ORDER_MANAGER && customer.createdBy.id !== userId) {
      throw new ForbiddenException('You do not have permission to view this customer');
    }

    return customer;
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto, userId: string, userRole: UserRole): Promise<Customer> {
    const customer = await this.findOne(id, userId, userRole);
    Object.assign(customer, updateCustomerDto);
    await this.customersRepository.save(customer);
    
    // Fetch and return the updated customer with all relations
    return this.findOne(id, userId, userRole);
  }

  async getCustomerSales(id: string, userId: string, userRole: UserRole): Promise<Sale[]> {
    const customer = await this.findOne(id, userId, userRole);
    
    // Admin, CEO, Manager and Accountant can see all sales
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
      return this.salesRepository.find({
        where: { customer: { id: customer.id } },
        relations: ['createdBy'],
        select: {
          createdBy: {
            id: true,
            name: true,
            email: true
          }
        },
        order: { createdAt: 'DESC' }
      });
    }

    // Order managers can only see their own sales
    return this.salesRepository.find({
      where: { 
        customer: { id: customer.id },
        createdById: userId
      },
      relations: ['createdBy'],
      select: {
        createdBy: {
          id: true,
          name: true,
          email: true
        }
      },
      order: { createdAt: 'DESC' }
    });
  }

  async getCustomerSalesStats(id: string, userId: string, userRole: UserRole) {
    const customer = await this.findOne(id, userId, userRole);
    let sales: Sale[];

    // Admin, CEO, Manager and Accountant can see all sales stats
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
      sales = await this.salesRepository.find({
        where: { customer: { id: customer.id } }
      });
    } else {
      // Order managers can only see their own sales stats
      sales = await this.salesRepository.find({
        where: { 
          customer: { id: customer.id },
          createdById: userId
        }
      });
    }

    const cashSales = sales.filter(sale => sale.paymentType === PaymentType.CASH);
    const loanSales = sales.filter(sale => sale.paymentType === PaymentType.LOAN);

    return {
      totalSales: sales.length,
      totalAmount: sales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
      totalPaid: sales.reduce((sum, sale) => sum + Number(sale.amountPaid), 0),
      totalRemaining: sales.reduce((sum, sale) => sum + Number(sale.remainingAmount), 0),
      cashSales: {
        count: cashSales.length,
        totalAmount: cashSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0)
      },
      loanSales: {
        count: loanSales.length,
        totalAmount: loanSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0),
        totalPaid: loanSales.reduce((sum, sale) => sum + Number(sale.amountPaid), 0),
        totalRemaining: loanSales.reduce((sum, sale) => sum + Number(sale.remainingAmount), 0)
      },
      lastPurchaseDate: sales.length > 0 ? sales[0].createdAt : null,
      purchaseHistory: sales.map(sale => ({
        id: sale.id,
        date: sale.createdAt,
        paymentType: sale.paymentType,
        totalAmount: sale.totalAmount,
        amountPaid: sale.amountPaid,
        remainingAmount: sale.remainingAmount,
        items: sale.items
      }))
    };
  }

  async updateBatchTracking(
    id: string,
    updateBatchTrackingDto: UpdateBatchTrackingDto,
    userId: string,
    userRole: UserRole
  ): Promise<Customer> {
    const customer = await this.findOne(id, userId, userRole);

    // Find existing tracking or create new one
    let tracking = await this.chickenTrackingRepository.findOne({
      where: { customerId: id },
      order: { createdAt: 'DESC' }
    });

    if (!tracking) {
      tracking = this.chickenTrackingRepository.create({
        customerId: id,
        totalOrdered: 0,
        totalReceived: 0,
        lastDeliveryDate: null,
        pendingDeliveries: [],
        currentBatch: null,
        healthStatus: null,
        farmVisits: [],
        batchHistory: []
      });
    }

    // If this is a new batch
    if (updateBatchTrackingDto.initialCount && updateBatchTrackingDto.startDate) {
      // If there's an existing batch, move it to history first
      if (tracking.currentBatch) {
        const currentBatchWithHealth = {
          ...tracking.currentBatch,
          endDate: new Date(),
          healthStatus: {
            ...tracking.healthStatus,
            mortalityRate: tracking.healthStatus 
              ? (tracking.healthStatus.deadCount / tracking.currentBatch.initialCount) * 100
              : 0,
            survivalRate: tracking.healthStatus
              ? 100 - ((tracking.healthStatus.deadCount / tracking.currentBatch.initialCount) * 100)
              : 100
          },
          progressHistory: tracking.currentBatch.progressHistory || []
        };

        if (!tracking.batchHistory) {
          tracking.batchHistory = [];
        }
        tracking.batchHistory.unshift(currentBatchWithHealth);
      }

      // Create new batch
      tracking.currentBatch = {
        initialCount: updateBatchTrackingDto.initialCount,
        currentCount: updateBatchTrackingDto.initialCount,
        startDate: updateBatchTrackingDto.startDate,
        bandaCondition: updateBatchTrackingDto.bandaCondition,
        lastInspectionDate: updateBatchTrackingDto.lastInspectionDate,
        progressHistory: [{
          date: new Date(),
          currentCount: updateBatchTrackingDto.initialCount,
          sickCount: 0,
          deadCount: 0,
          soldCount: 0,
          averageWeight: 0,
          averageAge: 0,
          bandaCondition: updateBatchTrackingDto.bandaCondition,
          notes: 'Initial batch setup'
        }]
      };

      tracking.healthStatus = {
        sickCount: 0,
        deadCount: 0,
        soldCount: 0,
        averageWeight: 0,
        averageAge: 0
      };
    }

    // If completing current batch without starting a new one
    if (updateBatchTrackingDto.completeBatch && tracking.currentBatch && !updateBatchTrackingDto.initialCount) {
      // Add final progress entry
      const finalProgressEntry = {
        date: new Date(),
        currentCount: updateBatchTrackingDto.currentCount,
        sickCount: updateBatchTrackingDto.sickCount,
        deadCount: updateBatchTrackingDto.deadCount,
        soldCount: updateBatchTrackingDto.soldCount,
        averageWeight: updateBatchTrackingDto.averageWeight,
        averageAge: updateBatchTrackingDto.averageAge,
        bandaCondition: updateBatchTrackingDto.bandaCondition,
        notes: updateBatchTrackingDto.notes || 'Final batch status'
      };

      if (!tracking.currentBatch.progressHistory) {
        tracking.currentBatch.progressHistory = [];
      }
      tracking.currentBatch.progressHistory.unshift(finalProgressEntry);

      const currentBatchWithHealth = {
        ...tracking.currentBatch,
        endDate: updateBatchTrackingDto.endDate || new Date(),
        healthStatus: {
          ...tracking.healthStatus,
          mortalityRate: tracking.healthStatus 
            ? (tracking.healthStatus.deadCount / tracking.currentBatch.initialCount) * 100
            : 0,
          survivalRate: tracking.healthStatus
            ? 100 - ((tracking.healthStatus.deadCount / tracking.currentBatch.initialCount) * 100)
            : 100
        },
        progressHistory: tracking.currentBatch.progressHistory
      };

      if (!tracking.batchHistory) {
        tracking.batchHistory = [];
      }
      tracking.batchHistory.unshift(currentBatchWithHealth);
      tracking.currentBatch = null;
      tracking.healthStatus = null;
    }

    // Update progress for existing batch
    if (tracking.currentBatch && !updateBatchTrackingDto.initialCount && !updateBatchTrackingDto.completeBatch) {
      // Create progress entry
      const progressEntry = {
        date: new Date(),
        currentCount: updateBatchTrackingDto.currentCount,
        sickCount: updateBatchTrackingDto.sickCount,
        deadCount: updateBatchTrackingDto.deadCount,
        soldCount: updateBatchTrackingDto.soldCount,
        averageWeight: updateBatchTrackingDto.averageWeight,
        averageAge: updateBatchTrackingDto.averageAge,
        bandaCondition: updateBatchTrackingDto.bandaCondition,
        notes: updateBatchTrackingDto.notes
      };

      // Initialize progressHistory if it doesn't exist
      if (!tracking.currentBatch.progressHistory) {
        tracking.currentBatch.progressHistory = [];
      }

      // Add to progress history
      tracking.currentBatch.progressHistory.unshift(progressEntry);

      // Update current batch status
      tracking.currentBatch.currentCount = updateBatchTrackingDto.currentCount;
      tracking.currentBatch.bandaCondition = updateBatchTrackingDto.bandaCondition;
      tracking.currentBatch.lastInspectionDate = updateBatchTrackingDto.lastInspectionDate;

      // Update health status
      tracking.healthStatus = {
        sickCount: updateBatchTrackingDto.sickCount,
        deadCount: updateBatchTrackingDto.deadCount,
        soldCount: updateBatchTrackingDto.soldCount,
        averageWeight: updateBatchTrackingDto.averageWeight,
        averageAge: updateBatchTrackingDto.averageAge
      };
    }

    // Add new farm visits if provided
    if (updateBatchTrackingDto.farmVisits && updateBatchTrackingDto.farmVisits.length > 0) {
      if (!tracking.farmVisits) {
        tracking.farmVisits = [];
      }
      tracking.farmVisits.unshift(...updateBatchTrackingDto.farmVisits);

      // Update last inspection date in current batch if it exists
      if (tracking.currentBatch) {
        tracking.currentBatch.lastInspectionDate = 
          updateBatchTrackingDto.farmVisits[0].date;
      }
    }

    await this.chickenTrackingRepository.save(tracking);
    
    // Return the updated customer with all relations
    return this.findOne(id, userId, userRole);
  }

  async addFarmVisit(
    id: string,
    addFarmVisitDto: AddFarmVisitDto,
    userId: string,
    userRole: UserRole
  ): Promise<Customer> {
    const customer = await this.findOne(id, userId, userRole);

    // Find existing tracking or create new one
    let tracking = await this.chickenTrackingRepository.findOne({
      where: { customerId: id },
      order: { createdAt: 'DESC' }
    });

    if (!tracking) {
      tracking = this.chickenTrackingRepository.create({
        customerId: id,
        totalOrdered: 0,
        totalReceived: 0,
        lastDeliveryDate: null,
        pendingDeliveries: [],
        currentBatch: null,
        healthStatus: null,
        farmVisits: []
      });
    }

    // Initialize farmVisits array if it doesn't exist
    if (!tracking.farmVisits) {
      tracking.farmVisits = [];
    }

    // Add new farm visit
    tracking.farmVisits.push({
      date: addFarmVisitDto.date,
      purpose: addFarmVisitDto.purpose,
      findings: addFarmVisitDto.findings,
      recommendations: addFarmVisitDto.recommendations
    });

    // Update last inspection date in current batch if it exists
    if (tracking.currentBatch) {
      tracking.currentBatch.lastInspectionDate = addFarmVisitDto.date;
    }

    await this.chickenTrackingRepository.save(tracking);
    
    // Return the updated customer with all relations
    return this.findOne(id, userId, userRole);
  }

  async updateChickOrderTracking(
    id: string,
    updateChickOrderTrackingDto: UpdateChickOrderTrackingDto,
    userId: string,
    userRole: UserRole
  ): Promise<Customer> {
    const customer = await this.findOne(id, userId, userRole);

    // Create new tracking record
    const tracking = this.chickenTrackingRepository.create({
      customerId: id,
      totalOrdered: updateChickOrderTrackingDto.totalOrdered,
      totalReceived: updateChickOrderTrackingDto.totalReceived,
      lastDeliveryDate: updateChickOrderTrackingDto.lastDeliveryDate,
      pendingDeliveries: updateChickOrderTrackingDto.pendingDeliveries || [],
      currentBatch: updateChickOrderTrackingDto.currentBatch,
      healthStatus: updateChickOrderTrackingDto.healthStatus,
      farmVisits: updateChickOrderTrackingDto.farmVisits || []
    });

    await this.chickenTrackingRepository.save(tracking);
    
    // Return the updated customer with all relations
    return this.findOne(id, userId, userRole);
  }

  async getChickenTrackingData(
    id: string,
    userId: string,
    userRole: UserRole
  ): Promise<{
    currentBatch: ChickenTrackingEntity['currentBatch'] & {
      totalChickenCount?: number;
      remainingChickenCount?: number;
      batchProgress?: {
        totalDays: number;
        currentDay: number;
        percentageComplete: number;
      };
      progressHistory?: ChickenTrackingEntity['currentBatch']['progressHistory'];
    };
    healthStatus: ChickenTrackingEntity['healthStatus'] & {
      mortalityRate?: number;
      survivalRate?: number;
    };
    farmVisits: ChickenTrackingEntity['farmVisits'];
    batchHistory?: ChickenTrackingEntity['batchHistory'];
  }> {
    const customer = await this.findOne(id, userId, userRole);
    const tracking = await this.chickenTrackingRepository.findOne({
      where: { customerId: id },
      order: { createdAt: 'DESC' }
    }) || {
      currentBatch: null,
      healthStatus: null,
      farmVisits: [],
      batchHistory: []
    };

    // Calculate additional batch information
    let enhancedCurrentBatch = null;
    if (tracking.currentBatch) {
      const startDate = new Date(tracking.currentBatch.startDate);
      const currentDate = new Date();
      const totalDays = 45; // Assuming standard 45-day cycle for chickens
      const daysDiff = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      
      enhancedCurrentBatch = {
        ...tracking.currentBatch,
        totalChickenCount: tracking.currentBatch.initialCount,
        remainingChickenCount: tracking.currentBatch.currentCount,
        batchProgress: {
          totalDays,
          currentDay: Math.min(daysDiff, totalDays),
          percentageComplete: Math.min((daysDiff / totalDays) * 100, 100)
        },
        progressHistory: tracking.currentBatch.progressHistory || []
      };
    }

    // Calculate additional health metrics
    let enhancedHealthStatus = null;
    if (tracking.healthStatus && tracking.currentBatch) {
      const initialCount = tracking.currentBatch.initialCount;
      const deadCount = tracking.healthStatus.deadCount || 0;
      const mortalityRate = (deadCount / initialCount) * 100;
      const survivalRate = 100 - mortalityRate;

      enhancedHealthStatus = {
        ...tracking.healthStatus,
        mortalityRate: parseFloat(mortalityRate.toFixed(2)),
        survivalRate: parseFloat(survivalRate.toFixed(2))
      };
    }

    return {
      currentBatch: enhancedCurrentBatch,
      healthStatus: enhancedHealthStatus,
      farmVisits: tracking.farmVisits || [],
      batchHistory: tracking.batchHistory || []
    };
  }

  async createCustomerWithOrder(
    dto: CreateCustomerWithOrderDto,
    userId: string
  ): Promise<Customer> {
    // Start a transaction
    return await this.customersRepository.manager.transaction(async (transactionalEntityManager) => {
      // Get the user who is creating the customer
      const user = await transactionalEntityManager.findOne(User, {
        where: { id: userId }
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // For ADMIN, CEO, and MANAGER roles, they must specify the center
      if (this.ADMIN_ROLES.includes(user.role)) {
        if (!dto.center) {
          throw new BadRequestException('Center must be specified for admin roles');
        }
      } else {
        // For other roles like ORDER_MANAGER, they must have a center assigned
        if (!user.center) {
          throw new BadRequestException('User does not have a center assigned');
        }
        // Use the user's assigned center
        dto.center = user.center;
      }

      // 1. Create the customer
      const customer = new Customer();
      Object.assign(customer, {
        name: dto.name,
        phone: dto.phone,
        sex: dto.sex,
        farmingPlace: dto.farmingPlace,
        village: dto.village,
        street: dto.street,
        district: dto.district,
        region: dto.region,
        state: dto.state,
        center: dto.center,
        createdById: userId
      });

      const savedCustomer = await transactionalEntityManager.save(Customer, customer);

      // 2. Create the chicken order
      const chickenOrder = new ChickenOrder();
      const totalChicken = dto.order.chickenPaid + dto.order.chickenLoan;
      const pricePerChicken = dto.order.pricePerChicken;
      const totalChickenPrice = totalChicken * pricePerChicken;
      
      Object.assign(chickenOrder, {
        chickenPaid: dto.order.chickenPaid,
        chickenLoan: dto.order.chickenLoan,
        totalChicken,
        typeOfChicken: dto.order.typeOfChicken,
        paymentStatus: dto.order.chickenLoan > 0 ? PaymentStatus.PARTIAL : PaymentStatus.PAID,
        pricePerChicken,
        totalChickenPrice,
        amountPaid: dto.order.chickenPaid * pricePerChicken,
        deliveryDate: dto.order.deliveryDate,
        receivingStatus: 'PENDING',
        ward: dto.street,
        village: dto.village,
        phone: dto.phone,
        round: 1,
        batch: 1,
        orderDate: new Date(),
        customerId: savedCustomer.id
      });

      const savedChickenOrder = await transactionalEntityManager.save(ChickenOrder, chickenOrder);

      // 3. Create feed orders
      const feedOrders = dto.order.feedOrders.map(feedOrderDto => {
        const feedOrder = new FeedOrder();
        Object.assign(feedOrder, {
          ...feedOrderDto,
          totalPrice: feedOrderDto.quantity * feedOrderDto.pricePerUnit,
          chickenOrderId: savedChickenOrder.id
        });
        return feedOrder;
      });

      await transactionalEntityManager.save(FeedOrder, feedOrders);

      // Return the customer with the created order
      return await transactionalEntityManager.findOne(Customer, {
        where: { id: savedCustomer.id },
        relations: ['chickenOrders', 'chickenOrders.feedOrders']
      });
    });
  }

  async getAccumulatedOrders(startDate: Date, endDate: Date, userId: string, center?: CustomerCenter): Promise<{
    orderDate: Date;
    companyOrders: {
      silverland: {
        companyName: string;
        orders: {
          chickens: {
            type: string;
            quantity: number;
          };
          feeds: Array<{
            type: string;
            quantity: number;
          }>;
        };
        status?: OrderStatus;
      };
      ivrine: {
        companyName: string;
        orders: {
          chickens: {
            type: string;
            quantity: number;
          };
          feeds: Array<{
            type: string;
            quantity: number;
          }>;
        };
        status?: OrderStatus;
      };
    };
    customerDetails: Array<{
      name: string;
      phone: string;
      chickenOrder: {
        type: string;
        quantity: number;
      };
      feedOrders: Array<{
        type: string;
        quantity: number;
      }>;
    }>;
    weeklyBreakdown: Array<{
      weekStart: Date;
      weekEnd: Date;
      status: OrderStatus;
      orders: Array<{
        date: Date;
        orders: Array<{
          customerName: string;
          chickenType: string;
          quantity: number;
          feeds: Array<{
            type: string;
            quantity: number;
          }>;
        }>;
      }>;
    }>;
  }> {
    console.log('Getting accumulated orders for date range:', { startDate, endDate });
    
    // Get the user's center and role
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Build the query for chicken orders
    const query = this.chickenOrdersRepository
      .createQueryBuilder('chickenOrder')
      .leftJoinAndSelect('chickenOrder.customer', 'customer')
      .leftJoinAndSelect('chickenOrder.feedOrders', 'feedOrders')
      .where('DATE(chickenOrder.order_date) BETWEEN DATE(:startDate) AND DATE(:endDate)', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })
      .andWhere('customer.id IS NOT NULL');

    // For admin roles (ADMIN, CEO, MANAGER), apply center filter if provided
    if (this.ADMIN_ROLES.includes(user.role)) {
      if (center) {
        query.andWhere('customer.center = :center', { center });
      }
    } else {
      // For non-admin roles, always filter by their assigned center
      if (!user.center) {
        throw new BadRequestException('User does not have a center assigned');
      }
      query.andWhere('customer.center = :center', { center: user.center });
    }

    query.orderBy('chickenOrder.order_date', 'ASC');

    const orders = await query.getMany();

    // Get existing purchase orders for the date range
    const purchaseOrders = await this.ordersRepository
      .createQueryBuilder('order')
      .where('DATE(order.date) BETWEEN DATE(:startDate) AND DATE(:endDate)', {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      })
      .getMany();

    // Initialize result structure
    const result = {
      orderDate: new Date(),
      companyOrders: {
        silverland: {
          companyName: 'SILVERLAND',
          orders: {
            chickens: {
              type: 'SASSO',
              quantity: 0
            },
            feeds: []
          },
          status: OrderStatus.PENDING
        },
        ivrine: {
          companyName: 'IVRINE',
          orders: {
            chickens: {
              type: 'BROILER',
              quantity: 0
            },
            feeds: []
          },
          status: OrderStatus.PENDING
        }
      },
      customerDetails: [],
      weeklyBreakdown: []
    };

    // Group orders by week
    const weeklyOrders = new Map<string, {
      weekStart: Date;
      weekEnd: Date;
      status: OrderStatus;
      orders: Map<string, Array<any>>;
    }>();

    // Process each order
    for (const order of orders) {
      const company = order.typeOfChicken === 'SASSO' ? 'silverland' : 'ivrine';
      
      // Add to chicken orders
      result.companyOrders[company].orders.chickens.quantity += order.totalChicken;

      // Process feed orders and group by type
      for (const feedOrder of order.feedOrders) {
        const feedCompany = company;
        const existingFeedType = result.companyOrders[feedCompany].orders.feeds.find(
          feed => feed.type === feedOrder.feedType
        );

        if (existingFeedType) {
          existingFeedType.quantity += Number(feedOrder.quantity);
        } else {
          result.companyOrders[feedCompany].orders.feeds.push({
            type: feedOrder.feedType,
            quantity: Number(feedOrder.quantity)
          });
        }
      }

      // Add customer details
      result.customerDetails.push({
        name: order.customer.name,
        phone: order.customer.phone,
        chickenOrder: {
          type: order.typeOfChicken,
          quantity: order.totalChicken
        },
        feedOrders: order.feedOrders.map(feed => ({
          type: feed.feedType,
          quantity: Number(feed.quantity)
        }))
      });

      // Group by week
      const orderDate = new Date(order.orderDate);
      const weekStart = new Date(orderDate);
      weekStart.setDate(orderDate.getDate() - orderDate.getDay() + 1); // Monday
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6); // Sunday
      weekEnd.setHours(23, 59, 59, 999);

      const weekKey = weekStart.toISOString();
      
      if (!weeklyOrders.has(weekKey)) {
        weeklyOrders.set(weekKey, {
          weekStart,
          weekEnd,
          status: OrderStatus.PENDING,
          orders: new Map()
        });
      }

      const dateKey = orderDate.toISOString().split('T')[0];
      const weekData = weeklyOrders.get(weekKey);
      
      if (!weekData.orders.has(dateKey)) {
        weekData.orders.set(dateKey, []);
      }

      weekData.orders.get(dateKey).push({
        customerName: order.customer.name,
        chickenType: order.typeOfChicken,
        quantity: order.totalChicken,
        feeds: order.feedOrders.map(feed => ({
          type: feed.feedType,
          quantity: Number(feed.quantity)
        }))
      });
    }

    // Update statuses based on purchase orders
    for (const purchaseOrder of purchaseOrders) {
      const orderDate = new Date(purchaseOrder.date);
      const weekStart = new Date(orderDate);
      weekStart.setDate(orderDate.getDate() - orderDate.getDay() + 1);
      weekStart.setHours(0, 0, 0, 0);
      const weekKey = weekStart.toISOString();

      const weekData = weeklyOrders.get(weekKey);
      if (weekData) {
        // Update week status based on purchase order status
        if (purchaseOrder.status === OrderStatus.CANCELLED) {
          weekData.status = OrderStatus.CANCELLED;
        } else if (purchaseOrder.status === OrderStatus.APPROVED) {
          weekData.status = OrderStatus.APPROVED;
        } else if (purchaseOrder.status === OrderStatus.IN_PROGRESS) {
          weekData.status = OrderStatus.IN_PROGRESS;
        } else {
          weekData.status = OrderStatus.PENDING;
        }

        // Update company order status
        const company = purchaseOrder.companyName.toLowerCase() as 'silverland' | 'ivrine';
        if (result.companyOrders[company]) {
          result.companyOrders[company].status = purchaseOrder.status;
        }
      }
    }

    // Set default status for weeks without purchase orders
    for (const weekData of weeklyOrders.values()) {
      if (!weekData.status) {
        weekData.status = OrderStatus.PENDING;
      }
    }

    // Set default status for company orders
    if (!result.companyOrders.silverland.status) {
      result.companyOrders.silverland.status = OrderStatus.PENDING;
    }
    if (!result.companyOrders.ivrine.status) {
      result.companyOrders.ivrine.status = OrderStatus.PENDING;
    }

    // Convert weekly breakdown to array format
    result.weeklyBreakdown = Array.from(weeklyOrders.values()).map(week => ({
      weekStart: week.weekStart,
      weekEnd: week.weekEnd,
      status: week.status,
      orders: Array.from(week.orders.entries()).map(([date, orders]) => ({
        date: new Date(date),
        orders
      }))
    }));

    return result;
  }

  async getWeeklyAccumulatedOrders(startDate?: string, endDate?: string, userId?: string, center?: CustomerCenter): Promise<{
    weekStartDate: Date;
    weekEndDate: Date;
    consolidatedOrder: any;
  }> {
    let start: Date;
    let end: Date;

    if (startDate && endDate) {
      // Use provided dates
      start = new Date(startDate);
      end = new Date(endDate);
      
      // Set time to start of day for start date and end of day for end date
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        throw new BadRequestException('Invalid date format. Please use YYYY-MM-DD format');
      }

      if (end < start) {
        throw new BadRequestException('End date must be after start date');
      }

      // Limit range to 31 days to prevent performance issues
      const daysDiff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
      if (daysDiff > 31) {
        throw new BadRequestException('Date range cannot exceed 31 days');
      }
    } else {
      // Default to current week (Monday to Friday)
      const currentDate = new Date();
      start = new Date(currentDate);
      start.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 4); // Friday
      end.setHours(23, 59, 59, 999);
    }

    // Get the user's role
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    // For non-admin roles, ensure they have a center assigned
    if (!this.ADMIN_ROLES.includes(user.role)) {
      if (!user.center) {
        throw new BadRequestException('User does not have a center assigned');
      }
      // Override any provided center with the user's assigned center
      center = user.center;
    }

    // Get accumulated orders for the date range
    const consolidatedOrder = await this.getAccumulatedOrders(start, end, userId, center);

    return {
      weekStartDate: start,
      weekEndDate: end,
      consolidatedOrder,
    };
  }

  async submitWeeklyOrdersForPurchase(userId: string): Promise<any> {
    // Get the current week's start and end dates
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - today.getDay() + 1); // Monday
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(today);
    endDate.setHours(23, 59, 59, 999);

    // Get accumulated orders for the week
    const weeklyOrders = await this.getAccumulatedOrders(startDate, endDate, userId);

    // Create orders for each company
    const orders = [];
    const customerDetails = [];

    // Process Silverland orders
    if (weeklyOrders.companyOrders.silverland.orders.chickens.quantity > 0) {
      const order = await this.ordersRepository.save({
        companyName: 'SILVERLAND',
        farmName: 'SILVERLAND FARM',
        farmNumber: 'SL001',
        villageName: 'SILVERLAND VILLAGE',
        contactName: 'SILVERLAND CONTACT',
        phoneNumber: '+255123456789',
        items: [
          {
            quantity: weeklyOrders.companyOrders.silverland.orders.chickens.quantity,
            description: `${weeklyOrders.companyOrders.silverland.orders.chickens.type} CHICKS`,
            unitPrice: 1000, // Replace with actual price
            totalPrice: weeklyOrders.companyOrders.silverland.orders.chickens.quantity * 1000
          },
          ...weeklyOrders.companyOrders.silverland.orders.feeds.map(feed => ({
            quantity: feed.quantity,
            description: `${feed.type} FEED`,
            unitPrice: 50000, // Replace with actual price
            totalPrice: feed.quantity * 50000
          }))
        ],
        totalAmount: (
          weeklyOrders.companyOrders.silverland.orders.chickens.quantity * 1000 +
          weeklyOrders.companyOrders.silverland.orders.feeds.reduce((acc, feed) => acc + feed.quantity * 50000, 0)
        ),
        status: OrderStatus.IN_PROGRESS, // Set initial status to IN_PROGRESS
        orderNumber: `SL-${Date.now()}`,
        date: new Date(),
        region: 'SHINYANGA',
        pobox: 'P.O. BOX 123',
        orderManagerId: userId
      });
      orders.push(order);
    }

    // Process Ivrine orders
    if (weeklyOrders.companyOrders.ivrine.orders.chickens.quantity > 0) {
      const order = await this.ordersRepository.save({
        companyName: 'IVRINE',
        farmName: 'IVRINE FARM',
        farmNumber: 'IV001',
        villageName: 'IVRINE VILLAGE',
        contactName: 'IVRINE CONTACT',
        phoneNumber: '+255987654321',
        items: [
          {
            quantity: weeklyOrders.companyOrders.ivrine.orders.chickens.quantity,
            description: `${weeklyOrders.companyOrders.ivrine.orders.chickens.type} CHICKS`,
            unitPrice: 1000, // Replace with actual price
            totalPrice: weeklyOrders.companyOrders.ivrine.orders.chickens.quantity * 1000
          },
          ...weeklyOrders.companyOrders.ivrine.orders.feeds.map(feed => ({
            quantity: feed.quantity,
            description: `${feed.type} FEED`,
            unitPrice: 50000, // Replace with actual price
            totalPrice: feed.quantity * 50000
          }))
        ],
        totalAmount: (
          weeklyOrders.companyOrders.ivrine.orders.chickens.quantity * 1000 +
          weeklyOrders.companyOrders.ivrine.orders.feeds.reduce((acc, feed) => acc + feed.quantity * 50000, 0)
        ),
        status: OrderStatus.IN_PROGRESS, // Set initial status to IN_PROGRESS
        orderNumber: `IV-${Date.now()}`,
        date: new Date(),
        region: 'SHINYANGA',
        pobox: 'P.O. BOX 456',
        orderManagerId: userId
      });
      orders.push(order);
    }

    // Update weekly orders status to IN_PROGRESS
    const weekStart = new Date(startDate);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // Update all chicken orders for this week to mark them as weekly orders and in progress
    await this.chickenOrdersRepository
      .createQueryBuilder()
      .update(ChickenOrder)
      .set({ 
        isWeeklyOrder: true,
        receivingStatus: OrderStatus.IN_PROGRESS 
      })
      .where('DATE(order_date) BETWEEN DATE(:startDate) AND DATE(:endDate)', {
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      })
      .execute();

    // Add customer details
    customerDetails.push(...weeklyOrders.customerDetails);

    return {
      message: 'Weekly orders have been submitted for review',
      orders,
      customerDetails
    };
  }
} 