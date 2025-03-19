import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { CustomerCenter } from '../customers/enums/customer-center.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  private readonly ADMIN_ROLES = [UserRole.ADMIN, UserRole.CEO, UserRole.MANAGER];
  private readonly ALL_CENTERS = [CustomerCenter.KAHAMA, CustomerCenter.SHINYANGA, CustomerCenter.MAGANZO];

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async getUserRoles(userId: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.email', 'user.role'])
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    console.log('User roles found:', user.role);
    return { role: user.role };
  }

  async getAllRoles() {
    return Object.values(UserRole);
  }

  async login(username: string, password: string) {
    console.log('Login attempt for:', username);
    
    const user = await this.userRepository
      .createQueryBuilder('user')
      .select([
        'user.id',
        'user.email',
        'user.password',
        'user.role',
        'user.name',
        'user.center',
        'user.isActive'
      ])
      .where('user.email = :email', { email: username })
      .getOne();

    if (!user) {
      console.log('No user found with email:', username);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    console.log('Found user data:', {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      center: user.center,
      hashedPassword: user.password
    });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('Password validation failed for user:', username);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!Object.values(UserRole).includes(user.role)) {
      console.error('Invalid role found:', user.role);
      throw new UnauthorizedException('Invalid user role');
    }

    const payload = { 
      sub: user.id,
      email: user.email,
      role: user.role,
      center: user.center
    };

    console.log('Creating JWT payload:', payload);

    const token = await this.jwtService.signAsync(payload);
    
    const decoded = await this.jwtService.verifyAsync(token);
    console.log('Verified token payload:', decoded);

    // Determine centers based on role
    let centers = [];
    if (this.ADMIN_ROLES.includes(user.role)) {
      centers = this.ALL_CENTERS;
    } else if (user.center) {
      centers = [user.center];
    }

    const response = {
      access_token: token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
        center: user.center,
        centers: centers
      }
    };

    console.log('Sending response:', response);
    return response;
  }
} 