import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Sale } from './entities/sale.entity';
import { Product } from '../products/entities/product.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CreateSaleDto } from './dto/create-sale.dto';
import { PaymentType } from './enums/payment-type.enum';
import { LoanTrackingDto } from './dto/loan-tracking.dto';
import { UpdateLoanPaymentDto } from './dto/update-loan-payment.dto';
import { UserRole } from '../users/enums/user-role.enum';

@Injectable()
export class SalesService {
  constructor(
    @InjectRepository(Sale)
    private readonly salesRepository: Repository<Sale>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    private readonly dataSource: DataSource
  ) {}

  async create(createSaleDto: CreateSaleDto, userId: string): Promise<Sale> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Find or validate customer
      const customer = await this.customersRepository.findOne({
        where: { id: createSaleDto.customerId }
      });

      if (!customer) {
        throw new NotFoundException(`Customer with ID ${createSaleDto.customerId} not found`);
      }

      // Calculate total amount and validate products
      let totalAmount = 0;
      const saleItems = [];

      for (const item of createSaleDto.items) {
        const product = await this.productsRepository.findOne({
          where: { id: item.productId }
        });

        if (!product) {
          throw new NotFoundException(`Product with ID ${item.productId} not found`);
        }

        if (product.remainingQty < item.quantity) {
          throw new BadRequestException(
            `Insufficient quantity for product ${product.productName}. Available: ${product.remainingQty}`
          );
        }

        const totalPrice = product.sellingPrice * item.quantity;
        totalAmount += totalPrice;

        saleItems.push({
          productId: item.productId,
          productName: product.productName,
          quantity: item.quantity,
          unitPrice: product.sellingPrice,
          totalPrice
        });

        // Update product inventory
        const updatedProduct = {
          ...product,
          remainingQty: product.remainingQty - item.quantity
        };

        if (createSaleDto.paymentType === PaymentType.CASH) {
          updatedProduct.totalSoldQtyCash = product.totalSoldQtyCash + item.quantity;
          updatedProduct.totalSalesCash = product.totalSalesCash + totalPrice;
        } else {
          updatedProduct.totalSoldQtyLoan = product.totalSoldQtyLoan + item.quantity;
          updatedProduct.totalSalesLoan = product.totalSalesLoan + totalPrice;
        }

        updatedProduct.remainingBuying = updatedProduct.remainingQty * product.buyingPrice;
        updatedProduct.remainingSales = updatedProduct.remainingQty * product.sellingPrice;

        await queryRunner.manager.save(Product, updatedProduct);
      }

      // Create sale record
      const sale = this.salesRepository.create({
        ...createSaleDto,
        items: saleItems,
        totalAmount,
        remainingAmount: createSaleDto.paymentType === PaymentType.LOAN ? totalAmount : 0,
        amountPaid: createSaleDto.paymentType === PaymentType.CASH ? totalAmount : 0,
        paymentHistory: createSaleDto.paymentType === PaymentType.LOAN ? [] : null,
        createdById: userId,
        customerId: customer.id
      });

      const savedSale = await queryRunner.manager.save(Sale, sale);
      await queryRunner.commitTransaction();

      return savedSale;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(userId: string, userRole: UserRole): Promise<Sale[]> {
    // Admin, CEO, Manager and Accountant can see all sales
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
      return this.salesRepository.find({
        relations: ['createdBy', 'customer'],
        select: {
          createdBy: {
            id: true,
            name: true,
            email: true
          },
          customer: {
            id: true,
            name: true,
            village: true,
            center: true
          }
        },
        order: {
          createdAt: 'ASC'
        }
      });
    }

    // Order managers can only see their own sales
    if (userRole === UserRole.ORDER_MANAGER) {
      return this.salesRepository.find({
        where: {
          createdBy: { id: userId }
        },
        relations: ['createdBy', 'customer'],
        select: {
          createdBy: {
            id: true,
            name: true,
            email: true
          },
          customer: {
            id: true,
            name: true,
            village: true,
            center: true
          }
        },
        order: {
          createdAt: 'ASC'
        }
      });
    }

    return [];
  }

  async findOne(id: string, userId: string, userRole: UserRole): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['createdBy', 'customer']
    });

    if (!sale) {
      throw new NotFoundException(`Sale with ID ${id} not found`);
    }

    // Admin, CEO, Manager and Accountant can view all sales
    if ([UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER, UserRole.ACCOUNTANT].includes(userRole)) {
      return sale;
    }

    // Order Managers can only view their own sales
    if (userRole === UserRole.ORDER_MANAGER && sale.createdById !== userId) {
      throw new ForbiddenException('You do not have permission to view this sale');
    }

    return sale;
  }

  async getLoanSales(userId: string, userRole: UserRole): Promise<LoanTrackingDto> {
    let whereClause: any = { paymentType: PaymentType.LOAN };
    
    if (userRole === UserRole.ORDER_MANAGER) {
      whereClause = {
        paymentType: PaymentType.LOAN,
        createdBy: { id: userId }
      };
    }

    const loanSales = await this.salesRepository.find({
      where: whereClause,
      relations: ['createdBy', 'customer'],
      select: {
        createdBy: {
          id: true,
          name: true,
          email: true
        },
        customer: {
          id: true,
          name: true,
          village: true,
          center: true
        }
      },
      order: {
        createdAt: 'ASC'
      }
    });

    const totalLoanAmount = loanSales.reduce((sum, sale) => sum + Number(sale.totalAmount), 0);

    return {
      totalLoanAmount,
      totalLoanSales: loanSales.length,
      loanSales: loanSales.map(sale => ({
        id: sale.id,
        customer: {
          id: sale.customer.id,
          name: sale.customer.name,
          village: sale.customer.village,
          center: sale.customer.center
        },
        totalAmount: Number(sale.totalAmount),
        amountPaid: Number(sale.amountPaid),
        remainingAmount: Number(sale.remainingAmount),
        items: sale.items,
        createdAt: sale.createdAt,
        createdBy: sale.createdBy ? {
          name: sale.createdBy.name,
          email: sale.createdBy.email
        } : null
      }))
    };
  }

  async getLoanSalesByCustomer(customerName: string, userId: string, userRole: UserRole): Promise<Sale[]> {
    let whereClause: any = {
      paymentType: PaymentType.LOAN,
      customer: { name: customerName }
    };

    if (userRole === UserRole.ORDER_MANAGER) {
      whereClause = {
        ...whereClause,
        createdBy: { id: userId }
      };
    }

    return this.salesRepository.find({
      where: whereClause,
      relations: ['createdBy', 'customer'],
      select: {
        createdBy: {
          id: true,
          name: true,
          email: true
        },
        customer: {
          id: true,
          name: true,
          village: true,
          center: true
        }
      },
      order: {
        createdAt: 'ASC'
      }
    });
  }

  async getAllLoans(userId: string, userRole: UserRole): Promise<Sale[]> {
    let whereClause: any = { paymentType: PaymentType.LOAN };

    if (userRole === UserRole.ORDER_MANAGER) {
      whereClause = {
        paymentType: PaymentType.LOAN,
        createdBy: { id: userId }
      };
    }

    return this.salesRepository.find({
      where: whereClause,
      relations: ['createdBy', 'customer'],
      select: {
        createdBy: {
          id: true,
          name: true,
          email: true
        },
        customer: {
          id: true,
          name: true,
          village: true,
          center: true
        }
      },
      order: {
        createdAt: 'ASC'
      }
    });
  }

  async updateLoanPayment(id: string, updateLoanPaymentDto: UpdateLoanPaymentDto, userId: string): Promise<Sale> {
    const sale = await this.salesRepository.findOne({
      where: { id },
      relations: ['customer']
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    if (sale.paymentType !== PaymentType.LOAN) {
      throw new BadRequestException('This sale is not a loan sale');
    }

    if (updateLoanPaymentDto.amountPaid > sale.remainingAmount) {
      throw new BadRequestException('Payment amount exceeds remaining balance');
    }

    // Update payment details
    sale.amountPaid += updateLoanPaymentDto.amountPaid;
    sale.remainingAmount -= updateLoanPaymentDto.amountPaid;

    // Add to payment history
    if (!sale.paymentHistory) {
      sale.paymentHistory = [];
    }

    sale.paymentHistory.push({
      amount: updateLoanPaymentDto.amountPaid,
      date: new Date(),
      updatedBy: userId
    });

    return this.salesRepository.save(sale);
  }
} 