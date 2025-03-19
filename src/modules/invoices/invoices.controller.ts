import { Controller, Post, Body, UseGuards, Get, Request, Patch, Param } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesService } from './invoices.service';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiBody, ApiUnauthorizedResponse, ApiForbiddenResponse, ApiNotFoundResponse, ApiBadRequestResponse } from '@nestjs/swagger';
import { GenerateInvoiceDto } from './dto/generate-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { UpdateInvoiceStatusDto } from './dto/update-invoice-status.dto';
import { CreateRequestInvoiceDto } from './dto/create-request-invoice.dto';

@ApiTags('Invoices')
@ApiBearerAuth()
@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiResponse({
  status: 401,
  description: 'Unauthorized - User is not authenticated'
})
@ApiResponse({
  status: 403,
  description: 'Forbidden - User does not have required permissions'
})
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post()
  @Roles(UserRole.ACCOUNTANT)
  @ApiOperation({ summary: 'Create a new invoice' })
  @ApiResponse({
    status: 201,
    description: 'Invoice created successfully',
    type: Invoice
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - Only accountants can create invoices'
  })
  create(@Request() req, @Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoicesService.create(createInvoiceDto, req.user.id);
  }

  @Get()
  @Roles(UserRole.ACCOUNTANT, UserRole.MANAGER, UserRole.CEO, UserRole.ADMIN, UserRole.ORDER_MANAGER)
  @ApiOperation({ 
    summary: 'Get all invoices', 
    description: 'Admin, CEO, and Managers see all invoices. Order managers and accountants only see their own invoices.'
  })
  @ApiResponse({
    status: 200,
    description: 'List of invoices based on user role',
    type: [Invoice]
  })
  findAll(@Request() req) {
    return this.invoicesService.findAll(req.user.id, req.user.role);
  }

  @Post('generate')
  @Roles(UserRole.ACCOUNTANT, UserRole.MANAGER)
  @ApiOperation({ summary: 'Generate invoice for an approved order' })
  @ApiResponse({
    status: 201,
    description: 'Invoice generated successfully',
    type: Invoice
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Order not approved or invoice already exists'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role'
  })
  async generateInvoice(
    @Body() generateInvoiceDto: GenerateInvoiceDto,
    @Request() req
  ): Promise<Invoice> {
    return await this.invoicesService.generateInvoice(
      generateInvoiceDto,
      req.user.id
    );
  }

  @Patch(':id/status')
  @Roles(UserRole.MANAGER, UserRole.CEO)
  @ApiOperation({ 
    summary: 'Update invoice status (Approve/Cancel)',
    description: `
      Approval flow:
      1. Manager can approve from PENDING to MANAGER_APPROVED
      2. CEO can approve from MANAGER_APPROVED to APPROVED
      3. Both can cancel at their respective stages (requires reason)
    `
  })
  @ApiParam({
    name: 'id',
    description: 'Invoice ID',
    example: 'f358e5e9-27a8-4705-a5ef-91fc5b86aa3f'
  })
  @ApiResponse({
    status: 200,
    description: 'Invoice status updated successfully',
    type: Invoice
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid status transition or missing reason for cancellation'
  })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have required role'
  })
  @ApiResponse({
    status: 404,
    description: 'Invoice not found'
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateInvoiceStatusDto,
    @Request() req
  ): Promise<Invoice> {
    return await this.invoicesService.updateInvoiceStatus(
      id,
      updateStatusDto,
      req.user.id,
      req.user.role
    );
  }

  @Post('request')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  @ApiOperation({ 
    summary: 'Generate invoice from request',
    description: `Creates a new invoice from an approved request form.
    - Automatically calculates tax based on provided tax percentage
    - Sets invoice date to current date and due date to 30 days later
    - Updates request status to INVOICED
    - Only works with APPROVED requests`
  })
  @ApiBody({ 
    type: CreateRequestInvoiceDto,
    examples: {
      basic: {
        summary: 'Basic invoice generation',
        value: {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          taxPercentage: 18,
          notes: 'Payment due within 30 days'
        }
      },
      noTax: {
        summary: 'Generate invoice without tax',
        value: {
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          notes: 'Tax exempt invoice'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: 'Invoice has been successfully generated.',
    type: Invoice,
    content: {
      'application/json': {
        example: {
          id: '123e4567-e89b-12d3-a456-426614174000',
          invoiceNumber: 'INV-20240129-001',
          invoiceDate: '2024-01-29',
          dueDate: '2024-02-28',
          type: 'REQUEST',
          items: [{
            description: 'Item description',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100
          }],
          subtotal: 100,
          tax: 18,
          total: 118,
          status: 'PENDING',
          notes: 'Payment due within 30 days',
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          createdById: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: '2024-01-29T12:00:00Z',
          updatedAt: '2024-01-29T12:00:00Z'
        }
      }
    }
  })
  @ApiBadRequestResponse({ 
    description: 'Request is not in approved status or invalid data provided.',
    content: {
      'application/json': {
        examples: {
          notApproved: {
            summary: 'Request not approved',
            value: {
              statusCode: 400,
              message: 'Can only generate invoice for approved requests',
              error: 'Bad Request'
            }
          },
          invalidTax: {
            summary: 'Invalid tax percentage',
            value: {
              statusCode: 400,
              message: 'Tax percentage must be between 0 and 100',
              error: 'Bad Request'
            }
          }
        }
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'Request not found.',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'Request with ID 123e4567-e89b-12d3-a456-426614174000 not found',
          error: 'Not Found'
        }
      }
    }
  })
  async createFromRequest(@Body() createRequestInvoiceDto: CreateRequestInvoiceDto, @Request() req) {
    return this.invoicesService.createFromRequest(createRequestInvoiceDto, req.user.id);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT, UserRole.CEO, UserRole.ORDER_MANAGER)
  @ApiOperation({ 
    summary: 'Get invoice by ID',
    description: 'Retrieves a specific invoice by its ID. Admin, CEO, and Managers can view any invoice. Order managers and accountants can only view their own invoices.'
  })
  @ApiParam({ 
    name: 'id', 
    description: 'The UUID of the invoice'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'The invoice has been found.',
    type: Invoice
  })
  @ApiNotFoundResponse({ description: 'Invoice not found.' })
  @ApiForbiddenResponse({ description: 'You do not have permission to view this invoice.' })
  async findOne(@Param('id') id: string, @Request() req) {
    return this.invoicesService.findOne(id, req.user.id, req.user.role);
  }

  @Get('request/:requestId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  @ApiOperation({ 
    summary: 'Get invoices by request ID',
    description: 'Retrieves all invoices that have been generated for a specific request.'
  })
  @ApiParam({ 
    name: 'requestId', 
    description: 'The UUID of the request',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of invoices for the request.',
    type: [Invoice],
    content: {
      'application/json': {
        example: [{
          id: '123e4567-e89b-12d3-a456-426614174000',
          invoiceNumber: 'INV-20240129-001',
          invoiceDate: '2024-01-29',
          dueDate: '2024-02-28',
          type: 'REQUEST',
          items: [{
            description: 'Item description',
            quantity: 1,
            unitPrice: 100,
            totalPrice: 100
          }],
          subtotal: 100,
          tax: 18,
          total: 118,
          status: 'PENDING',
          notes: 'Payment due within 30 days',
          requestId: '123e4567-e89b-12d3-a456-426614174000',
          createdById: '123e4567-e89b-12d3-a456-426614174000',
          createdAt: '2024-01-29T12:00:00Z',
          updatedAt: '2024-01-29T12:00:00Z'
        }]
      }
    }
  })
  @ApiNotFoundResponse({ 
    description: 'No invoices found for the request.',
    content: {
      'application/json': {
        example: {
          statusCode: 404,
          message: 'No invoices found for request ID 123e4567-e89b-12d3-a456-426614174000',
          error: 'Not Found'
        }
      }
    }
  })
  async findByRequest(@Param('requestId') requestId: string) {
    return this.invoicesService.findByRequest(requestId);
  }
} 