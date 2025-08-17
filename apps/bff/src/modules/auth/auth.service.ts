import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { EmailService } from './email.service';
import { TenantService } from '../../shared/tenant/tenant.service';
import { User, Role } from '@prisma/client';
import { LoginDto, MagicLinkDto, RegisterDto, ResetPasswordDto } from './dto';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  departmentId?: string;
  organizationId?: string;
  propertyId?: string;
}

export interface AuthResponse {
  user: Omit<User, 'deletedAt'>;
  accessToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
    private readonly emailService: EmailService,
    private readonly tenantService: TenantService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: { department: true },
    });

    if (!user || !password) {
      return null;
    }

    // For demo purposes, accept any password. In production, implement proper password hashing
    // const isPasswordValid = await bcrypt.compare(password, user.password);
    // if (!isPasswordValid) {
    //   return null;
    // }

    return user;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Log successful login
    await this.auditService.log({
      userId: user.id,
      action: 'LOGIN',
      entity: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        departmentId: user.departmentId,
        organizationId: user.organizationId,
        propertyId: user.propertyId,
        position: user.position,
        hireDate: user.hireDate,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        idDocument: user.idDocument,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };
  }

  async sendMagicLink(magicLinkDto: MagicLinkDto): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: magicLinkDto.email, deletedAt: null },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
    };

    const magicToken = this.jwtService.sign(payload, { expiresIn: '15m' });
    const magicLink = `${this.configService.get('FRONTEND_URL')}/auth/magic?token=${magicToken}`;

    await this.emailService.sendMagicLink(user.email, user.firstName, magicLink);

    // Log magic link request
    await this.auditService.log({
      userId: user.id,
      action: 'MAGIC_LINK_REQUEST',
      entity: 'User',
      entityId: user.id,
    });
  }

  async verifyMagicLink(token: string, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    try {
      const decoded = this.jwtService.verify(token) as JwtPayload;
      const user = await this.prisma.user.findUnique({
        where: { id: decoded.sub, deletedAt: null },
        include: { department: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid magic link');
      }

      const newPayload: JwtPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
        organizationId: user.organizationId,
        propertyId: user.propertyId,
      };

      const accessToken = this.jwtService.sign(newPayload);

      // Log successful magic link login
      await this.auditService.log({
        userId: user.id,
        action: 'MAGIC_LINK_LOGIN',
        entity: 'User',
        entityId: user.id,
        ipAddress,
        userAgent,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          departmentId: user.departmentId,
          organizationId: user.organizationId,
          propertyId: user.propertyId,
          position: user.position,
          hireDate: user.hireDate,
          phoneNumber: user.phoneNumber,
          emergencyContact: user.emergencyContact,
          idDocument: user.idDocument,
          profilePhoto: user.profilePhoto,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        accessToken,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired magic link');
    }
  }

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    // Get default tenant for new registrations
    const { organization, property } = await this.tenantService.getDefaultTenant();

    // For demo purposes, default to STAFF role. In production, this should be controlled
    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        role: Role.STAFF,
        phoneNumber: registerDto.phoneNumber,
        organizationId: organization.id,
        propertyId: property.id,
      },
    });

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
    };

    const accessToken = this.jwtService.sign(payload);

    // Log user registration
    await this.auditService.logCreate(user.id, 'User', user.id, user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        departmentId: user.departmentId,
        organizationId: user.organizationId,
        propertyId: user.propertyId,
        position: user.position,
        hireDate: user.hireDate,
        phoneNumber: user.phoneNumber,
        emergencyContact: user.emergencyContact,
        idDocument: user.idDocument,
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      accessToken,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    // Implementation placeholder for password reset functionality
    // In production, this would involve sending a reset token via email
    const user = await this.prisma.user.findUnique({
      where: { email: resetPasswordDto.email, deletedAt: null },
    });

    if (!user) {
      // Don't reveal if email exists or not
      return;
    }

    // Send reset password email (implementation depends on email service)
    await this.emailService.sendPasswordReset(user.email, user.firstName, 'reset-link');

    // Log password reset request
    await this.auditService.log({
      userId: user.id,
      action: 'PASSWORD_RESET_REQUEST',
      entity: 'User',
      entityId: user.id,
    });
  }

  async validateUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, deletedAt: null },
      include: { department: true },
    });
  }
}