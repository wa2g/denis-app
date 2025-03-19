import { Controller, Post, Body, UseGuards, Get, Request, Param, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateSaleDto } from './dto/create-sale.dto';
import { SalesService } from './sales.service';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth,
  ApiBody,
  ApiParam,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiQuery
} from '@nestjs/swagger';
import { Sale } from './entities/sale.entity';
import { LoanTrackingDto } from './dto/loan-tracking.dto';
import { UpdateLoanPaymentDto } from './dto/update-loan-payment.dto';

@ApiTags('sales')
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Create a new sale',
    description: 'Creates a new sale record with the specified items and payment type. Updates inventory accordingly.'
  })
  @ApiBody({ type: CreateSaleDto })
  @ApiResponse({ 
    status: 201, 
    description: 'Sale has been successfully created.',
    type: Sale 
  })
  @ApiUnauthorizedResponse({ 
    description: 'User is not authenticated.' 
  })
  @ApiForbiddenResponse({ 
    description: 'User does not have sufficient permissions.' 
  })
  @ApiBadRequestResponse({ 
    description: 'Invalid input or insufficient inventory.' 
  })
  async create(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    return this.salesService.create(createSaleDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Get all sales' })
  @ApiResponse({ status: 200, description: 'List of all sales records.', type: [Sale] })
  async findAll(@Request() req) {
    return this.salesService.findAll(req.user.id, req.user.role);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Get sale by ID' })
  @ApiParam({ name: 'id', description: 'The UUID of the sale record' })
  @ApiResponse({ status: 200, description: 'The sale record has been found.', type: Sale })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.salesService.findOne(id, req.user.id, req.user.role);
  }

  @Get('loans/all')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Get all loan sales' })
  @ApiResponse({ status: 200, description: 'List of all loan sales.', type: [Sale] })
  async getAllLoans(@Request() req): Promise<Sale[]> {
    return this.salesService.getAllLoans(req.user.id, req.user.role);
  }

  @Get('loans/tracking')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Get all loan sales with tracking information' })
  @ApiResponse({ status: 200, description: 'Returns loan tracking information', type: LoanTrackingDto })
  async getLoanSales(@Request() req): Promise<LoanTrackingDto> {
    return this.salesService.getLoanSales(req.user.id, req.user.role);
  }

  @Get('loans/customer/:customerName')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ summary: 'Get loan sales by customer name' })
  @ApiResponse({ status: 200, description: 'Returns loan sales for a specific customer', type: [Sale] })
  async getLoanSalesByCustomer(
    @Param('customerName') customerName: string,
    @Request() req
  ): Promise<Sale[]> {
    return this.salesService.getLoanSalesByCustomer(customerName, req.user.id, req.user.role);
  }

  @Patch(':id/loan-payment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ORDER_MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Update loan payment',
    description: 'Updates the payment status of a loan sale by recording a payment.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The UUID of the sale record',
    type: 'string' 
  })
  @ApiBody({ type: UpdateLoanPaymentDto })
  @ApiResponse({ 
    status: 200, 
    description: 'The loan payment has been updated.',
    type: Sale 
  })
  @ApiUnauthorizedResponse({ description: 'User is not authenticated.' })
  @ApiForbiddenResponse({ description: 'User does not have sufficient permissions.' })
  @ApiNotFoundResponse({ description: 'Sale record not found.' })
  @ApiBadRequestResponse({ description: 'Invalid payment amount or non-loan sale.' })
  async updateLoanPayment(
    @Param('id') id: string,
    @Body() updateLoanPaymentDto: UpdateLoanPaymentDto,
    @Request() req
  ) {
    return this.salesService.updateLoanPayment(id, updateLoanPaymentDto, req.user.id);
  }
} 