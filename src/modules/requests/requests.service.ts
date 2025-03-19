import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Request } from './entities/request.entity';
import { CreateRequestDto } from './dto/create-request.dto';
import { UpdateRequestStatusDto } from './dto/update-request-status.dto';
import { RequestStatus } from './enums/request-status.enum';
import { format } from 'date-fns';

@Injectable()
export class RequestsService {
  constructor(
    @InjectRepository(Request)
    private readonly requestsRepository: Repository<Request>
  ) {}

  async create(createRequestDto: CreateRequestDto, userId: string): Promise<Request> {
    // Calculate totals
    const invoiceSubtotal = createRequestDto.items.reduce((sum, item) => sum + item.totalPrice, 0);
    const total = invoiceSubtotal + 0; // Add any additional charges here

    // Generate request number (format: YYYYMMDD-XXX)
    const today = new Date();
    const datePrefix = format(today, 'yyyyMMdd');
    const lastRequest = await this.requestsRepository.findOne({
      where: {
        requestNumber: Like(`${datePrefix}-%`)
      },
      order: { requestNumber: 'DESC' }
    });

    let sequenceNumber = 1;
    if (lastRequest) {
      const lastSequence = parseInt(lastRequest.requestNumber.split('-')[1]);
      sequenceNumber = lastSequence + 1;
    }

    const requestNumber = `${datePrefix}-${String(sequenceNumber).padStart(3, '0')}`;

    const request = this.requestsRepository.create({
      ...createRequestDto,
      requestNumber,
      requestDate: today,
      invoiceSubtotal,
      transactionCharges: 0,
      total,
      status: RequestStatus.PENDING,
      createdById: userId
    });

    return this.requestsRepository.save(request);
  }

  async findAll(): Promise<Request[]> {
    return this.requestsRepository.find({
      relations: ['createdBy', 'approvedBy'],
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Request> {
    const request = await this.requestsRepository.findOne({
      where: { id },
      relations: ['createdBy', 'approvedBy']
    });

    if (!request) {
      throw new NotFoundException(`Request with ID ${id} not found`);
    }

    return request;
  }

  async updateStatus(id: string, updateRequestStatusDto: UpdateRequestStatusDto, userId: string): Promise<Request> {
    const request = await this.findOne(id);

    if (request.status === RequestStatus.INVOICED) {
      throw new BadRequestException('Cannot update status of an invoiced request');
    }

    // Only allow specific status transitions
    if (request.status === RequestStatus.PENDING && 
        ![RequestStatus.APPROVED, RequestStatus.REJECTED].includes(updateRequestStatusDto.status)) {
      throw new BadRequestException('Invalid status transition');
    }

    if (request.status === RequestStatus.APPROVED && 
        updateRequestStatusDto.status !== RequestStatus.INVOICED) {
      throw new BadRequestException('Approved requests can only be marked as invoiced');
    }

    request.status = updateRequestStatusDto.status;
    
    if (updateRequestStatusDto.status === RequestStatus.APPROVED || 
        updateRequestStatusDto.status === RequestStatus.REJECTED) {
      request.approvedById = userId;
    }

    return this.requestsRepository.save(request);
  }

  async findPendingRequests(): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { status: RequestStatus.PENDING },
      relations: ['createdBy'],
      order: { createdAt: 'ASC' }
    });
  }

  async findApprovedRequests(): Promise<Request[]> {
    return this.requestsRepository.find({
      where: { status: RequestStatus.APPROVED },
      relations: ['createdBy', 'approvedBy'],
      order: { createdAt: 'ASC' }
    });
  }
} 