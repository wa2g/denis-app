import { 
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Request,
  Query,
  Req,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { UpdateBatchTrackingDto } from './dto/update-batch-tracking.dto';
import { AddFarmVisitDto } from './dto/add-farm-visit.dto';
import { UpdateChickOrderTrackingDto } from './dto/update-chick-order-tracking.dto';
import { CustomerCenter } from './enums/customer-center.enum';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import { Customer } from './entities/customer.entity';
import { CreateCustomerWithOrderDto } from './dto/create-customer-with-order.dto';
import { Request as ExpressRequest } from 'express';

@ApiTags('customers')
@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiBody({ type: CreateCustomerDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Customer has been created successfully.',
  })
  create(@Body() createCustomerDto: CreateCustomerDto, @Request() req) {
    return this.customersService.create(createCustomerDto, req.user.id);
  }

  @Get('orders/weekly')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({
    summary: 'Get weekly accumulated orders',
    description: 
      'Returns accumulated orders for a specified date range, grouped by company. If no dates provided, defaults to current week (Monday-Friday)',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 
      'Start date in YYYY-MM-DD format. Defaults to Monday of current week if not provided',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 
      'End date in YYYY-MM-DD format. Defaults to Friday of current week if not provided',
  })
  @ApiQuery({
    name: 'center',
    required: false,
    enum: CustomerCenter,
    description: 'Filter orders by center (optional, CEO only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Weekly orders retrieved successfully',
    schema: {
      properties: {
        weekStartDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-03-18T00:00:00.000Z',
        },
        weekEndDate: {
          type: 'string',
          format: 'date-time',
          example: '2024-03-22T23:59:59.999Z',
        },
        consolidatedOrder: {
          type: 'object',
          properties: {
            orderDate: {
              type: 'string',
              format: 'date-time',
            },
            companyOrders: {
              type: 'object',
              properties: {
                silverland: {
                  type: 'object',
                  properties: {
                    companyName: { type: 'string' },
                    orders: {
                      type: 'object',
                      properties: {
                        chickens: {
                          type: 'object',
                          properties: {
                            type: { type: 'string' },
                            quantity: { type: 'number' },
                          },
                        },
                        feeds: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              type: { type: 'string' },
                              quantity: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                ivrine: {
                  type: 'object',
                  properties: {
                    companyName: { type: 'string' },
                    orders: {
                      type: 'object',
                      properties: {
                        chickens: {
                          type: 'object',
                          properties: {
                            type: { type: 'string' },
                            quantity: { type: 'number' },
                          },
                        },
                        feeds: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              type: { type: 'string' },
                              quantity: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            customerDetails: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  phone: { type: 'string' },
                  chickenOrder: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      quantity: { type: 'number' },
                    },
                  },
                  feedOrders: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        type: { type: 'string' },
                        quantity: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  getWeeklyAccumulatedOrders(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('center') center?: CustomerCenter,
  ) {
    return this.customersService.getWeeklyAccumulatedOrders(
      startDate,
      endDate,
      req.user.id,
      center,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Get all customers with optional center filter' })
  @ApiQuery({ name: 'center', enum: CustomerCenter, required: false })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all customers', 
    type: [Customer],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findAll(@Request() req, @Query('center') center?: CustomerCenter) {
    return this.customersService.findAll(req.user.id, req.user.role, center);
  }

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ORDER_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CEO,
  )
  @ApiOperation({ summary: 'Get customer by ID' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  findOne(@Param('id') id: string, @Request() req) {
    return this.customersService.findOne(id, req.user.id, req.user.role);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Update customer details' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  @ApiBody({ type: UpdateCustomerDto })
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto,
    @Request() req,
  ) {
    return this.customersService.update(
      id,
      updateCustomerDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/sales')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ORDER_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CEO,
  )
  @ApiOperation({ summary: 'Get all sales for a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  getCustomerSales(@Param('id') id: string, @Request() req) {
    return this.customersService.getCustomerSales(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/sales-stats')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ORDER_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CEO,
  )
  @ApiOperation({ summary: 'Get sales statistics for a customer' })
  @ApiParam({ name: 'id', description: 'Customer ID' })
  getCustomerSalesStats(@Param('id') id: string, @Request() req) {
    return this.customersService.getCustomerSalesStats(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/batch-tracking')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({
    summary: 'Update chicken batch tracking information',
    description: 
      'Updates the current batch information including health status, counts, and metrics.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer ID',
    type: 'string',
  })
  @ApiBody({
    type: UpdateBatchTrackingDto,
    description: 
      'Batch tracking data including counts, health metrics, and dates',
  })
  @ApiResponse({
    status: 200,
    description: 'Batch tracking information has been updated successfully.',
    type: Customer,
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ 
    description: 'User does not have sufficient permissions',
  })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  updateBatchTracking(
    @Param('id') id: string,
    @Body() updateBatchTrackingDto: UpdateBatchTrackingDto,
    @Request() req,
  ) {
    return this.customersService.updateBatchTracking(
      id,
      updateBatchTrackingDto,
      req.user.id,
      req.user.role,
    );
  }

  @Post(':id/farm-visits')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({
    summary: 'Add a new farm visit record',
    description: 'Records a new farm visit with findings and recommendations.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer ID',
    type: 'string',
  })
  @ApiBody({
    type: AddFarmVisitDto,
    description: 
      'Farm visit details including date, purpose, findings, and recommendations',
  })
  @ApiResponse({
    status: 201,
    description: 'Farm visit has been recorded successfully.',
    type: Customer,
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ 
    description: 'User does not have sufficient permissions',
  })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  addFarmVisit(
    @Param('id') id: string,
    @Body() addFarmVisitDto: AddFarmVisitDto,
    @Request() req,
  ) {
    return this.customersService.addFarmVisit(
      id,
      addFarmVisitDto,
      req.user.id,
      req.user.role,
    );
  }

  @Patch(':id/chick-order-tracking')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER)
  @ApiOperation({
    summary: 'Update chick order tracking information',
    description: 
      'Updates information about chick orders, deliveries, and pending orders.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer ID',
    type: 'string',
  })
  @ApiBody({
    type: UpdateChickOrderTrackingDto,
    description: 
      'Chick order tracking data including total ordered, received, and pending deliveries',
  })
  @ApiResponse({
    status: 200,
     
    description: 'Chick order tracking information has been updated successfully.',
    type: Customer,
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ 
    description: 'User does not have sufficient permissions',
  })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  updateChickOrderTracking(
    @Param('id') id: string,
    @Body() updateChickOrderTrackingDto: UpdateChickOrderTrackingDto,
    @Request() req,
  ) {
    return this.customersService.updateChickOrderTracking(
      id,
      updateChickOrderTrackingDto,
      req.user.id,
      req.user.role,
    );
  }

  @Get(':id/chicken-tracking')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.ORDER_MANAGER,
    UserRole.ACCOUNTANT,
    UserRole.CEO,
  )
  @ApiOperation({
    summary: 'Get all chicken tracking data for a customer',
    description: 
      'Retrieves comprehensive chicken tracking information including current batch, health status, farm visits, and order tracking.',
  })
  @ApiParam({
    name: 'id',
    description: 'Customer ID',
    type: 'string',
  })
  @ApiResponse({
    status: 200,
    description: 'Returns all chicken tracking data',
    schema: {
      properties: {
        currentBatch: {
          type: 'object',
          properties: {
            initialCount: { type: 'number', example: 500 },
            currentCount: { type: 'number', example: 480 },
            startDate: { 
              type: 'string',
              format: 'date-time',
              example: '2024-02-06T00:00:00Z',
            },
            bandaCondition: { type: 'string', example: 'GOOD' },
            lastInspectionDate: { 
              type: 'string',
              format: 'date-time',
              example: '2024-02-15T00:00:00Z',
            },
          },
        },
        healthStatus: {
          type: 'object',
          properties: {
            sickCount: { type: 'number', example: 5 },
            deadCount: { type: 'number', example: 15 },
            soldCount: { type: 'number', example: 0 },
            averageWeight: { type: 'number', example: 1.8 },
            averageAge: { type: 'number', example: 45 },
          },
        },
        farmVisits: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              date: { type: 'string', format: 'date-time' },
              purpose: { type: 'string' },
              findings: { type: 'string' },
              recommendations: { type: 'string' },
            },
          },
        },
        chickOrderTracking: {
          type: 'object',
          properties: {
            totalOrdered: { type: 'number', example: 1000 },
            totalReceived: { type: 'number', example: 500 },
            lastDeliveryDate: { type: 'string', format: 'date-time' },
            pendingDeliveries: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  orderDate: { type: 'string', format: 'date-time' },
                  quantity: { type: 'number' },
                  expectedDeliveryDate: { type: 'string', format: 'date-time' },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated' })
  @ApiForbiddenResponse({ 
    description: 'User does not have sufficient permissions',
  })
  @ApiNotFoundResponse({ description: 'Customer not found' })
  getChickenTrackingData(@Param('id') id: string, @Request() req) {
    return this.customersService.getChickenTrackingData(
      id,
      req.user.id,
      req.user.role,
    );
  }

  @Get('center/:center')
  @ApiOperation({ summary: 'Get customers by center' })
  @ApiParam({ name: 'center', enum: CustomerCenter })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns customers from specified center', 
    type: [Customer],
  })
  @ApiUnauthorizedResponse({ description: 'Unauthorized' })
  @ApiForbiddenResponse({ description: 'Forbidden' })
  async findByCenter(@Request() req, @Param('center') center: CustomerCenter) {
    return this.customersService.findByCenter(
      center,
      req.user.id,
      req.user.role,
    );
  }

  @Post('with-order')
  @ApiOperation({ 
    summary: 'Create a new customer with a chicken order and feed orders',
  })
  @ApiResponse({
    status: 201,
    description: 'The customer has been successfully created with the order.',
  })
  async createWithOrder(
    @Body() createCustomerWithOrderDto: CreateCustomerWithOrderDto,
    @Req() request: ExpressRequest,
  ) {
    const userId = request.user['id'];
    return await this.customersService.createCustomerWithOrder(
      createCustomerWithOrderDto,
      userId,
    );
  }

  @Post('orders/weekly/submit')
  @Roles(UserRole.ORDER_MANAGER)
  @ApiOperation({
    summary: 'Submit weekly accumulated orders for review',
    description: 
      'Converts accumulated orders into purchase orders and submits them to the system for review by accountant',
  })
  @ApiResponse({
    status: 201,
    description: 'Orders have been submitted for review',
    schema: {
      example: {
        message: 'Weekly orders have been submitted for review',
        orders: [
          {
            id: 'uuid',
            orderNumber: 'SL-1234567890',
            companyName: 'SILVERLAND',
            farmName: 'SILVERLAND FARM',
            items: [
              {
                quantity: 1000,
                description: 'SASSO CHICKS',
                unitPrice: 1000,
                totalPrice: 1000000,
              },
            ],
            totalAmount: 1000000,
            status: 'PENDING',
          },
        ],
        customerDetails: [
          {
            name: 'Customer Name',
            phone: '+255123456789',
            chickenOrder: {
              type: 'SASSO',
              quantity: 1000,
            },
            feedOrders: [
              {
                type: 'STARTER',
                quantity: 50,
              },
            ],
          },
        ],
      },
    },
  })
  submitWeeklyOrders(@Request() req) {
    return this.customersService.submitWeeklyOrdersForPurchase(req.user.id);
  }
} 