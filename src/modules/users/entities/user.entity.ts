import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Order } from '../../orders/entities/order.entity';
import { Invoice } from '../../invoices/entities/invoice.entity';
import { Approval } from '../../approvals/entities/approval.entity';
import { Document } from '../../documents/entities/document.entity';
import { UserRole } from '../enums/user-role.enum';
import { CustomerCenter } from '../../customers/enums/customer-center.enum';
import { Transform } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.ORDER_MANAGER
  })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: CustomerCenter,
    nullable: true
  })
  center: CustomerCenter;

  @Column({ default: true, name: 'isactive' })
  @Transform(({ value }) => Boolean(value))
  isActive: boolean;

  @OneToMany(() => Order, order => order.orderManager)
  orders: Order[];

  @OneToMany(() => Invoice, invoice => invoice.accountant)
  createdInvoices: Invoice[];

  @OneToMany(() => Approval, approval => approval.approver)
  approvals: Approval[];

  @OneToMany(() => Document, document => document.uploadedBy)
  documents: Document[];
} 