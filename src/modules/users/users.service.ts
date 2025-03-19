import { Injectable, ConflictException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserRole } from './enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    console.log('Attempting to create user with email:', createUserDto.email);
    const existingUser = await this.findByEmail(createUserDto.email);
    console.log('Existing user check result:', existingUser);
    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    
    // Exclude password from response
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async findAll(role?: UserRole): Promise<User[]> {
    const users = await this.usersRepository.find({ 
      where: role ? { role } : undefined
    });

    // Remove password from each user
    return users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword as User;
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({ 
      where: { id }
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword as User;
  }

  async findByEmail(email: string): Promise<User> {
    return this.usersRepository.findOne({ 
      where: { email }
    });
  }

  async findByEmailDebug(email: string): Promise<any> {
    const result = await this.usersRepository.query(
      'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
      [email]
    );
    console.log('Direct DB query result:', result);
    return result;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updateUserDto);
    const savedUser = await this.usersRepository.save(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }

  async updateActivationStatus(id: string, isActive: boolean): Promise<User> {
    const user = await this.findOne(id);
    console.log('Updating user activation status:', { userId: id, currentStatus: user.isActive, newStatus: isActive });
    
    // Explicitly set the isActive property
    const savedUser = await this.usersRepository.save({
      ...user,
      isActive: isActive
    });
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    console.log('Updated user result:', userWithoutPassword);
    return userWithoutPassword as User;
  }

  async remove(id: string): Promise<void> {
    const result = await this.usersRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException('User not found');
    }
  }

  async updateProfile(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(userId);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // Remove role and center from profile updates for security
    const { role, center, ...allowedUpdates } = updateUserDto;

    Object.assign(user, allowedUpdates);
    const savedUser = await this.usersRepository.save(user);
    
    // Return user without password
    const { password: _, ...userWithoutPassword } = savedUser;
    return userWithoutPassword as User;
  }
} 