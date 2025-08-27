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
import { PermissionService } from '../permissions/permission.service';

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  departmentId?: string;
  organizationId?: string;
  propertyId?: string;
  permissions?: string[]; // Array of permission strings
  // Standard JWT claims
  iat?: number;
  exp?: number;
  nbf?: number;
  aud?: string | string[];
  iss?: string;
  jti?: string;
}

export interface AuthResponse {
  user: Omit<User, 'deletedAt' | 'password'>;
  accessToken: string;
  organization?: any;
  property?: any;
  availableProperties?: any[];
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
    private readonly permissionService: PermissionService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email, deletedAt: null },
      include: { department: true },
    });

    if (!user || !password) {
      return null;
    }

    // Check if user has a password (for backward compatibility with magic-link users)
    if (!user.password) {
      // Allow magic-link users to login without password validation
      // In production, you might want to enforce password creation for all users
      return user;
    }

    // Validate password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  async login(loginDto: LoginDto, ipAddress?: string, userAgent?: string): Promise<AuthResponse> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user permissions
    let permissions: string[] = [];
    try {
      const userPermissions = await this.permissionService.getUserPermissions(user.id);
      permissions = userPermissions.map(p => `${p.resource}.${p.action}.${p.scope}`);
    } catch (error) {
      // Permission system not available, continue without permissions
      console.warn('Permission system not available:', error.message);
    }

    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
      organizationId: user.organizationId,
      propertyId: user.propertyId,
      permissions,
    };

    const accessToken = this.jwtService.sign(payload);

    // Fetch organization and property details
    let organization = null;
    let property = null;
    let availableProperties = [];

    if (user.organizationId) {
      organization = await this.prisma.organization.findUnique({
        where: { id: user.organizationId },
        select: {
          id: true,
          name: true,
          branding: true,
        },
      });
    }

    if (user.propertyId) {
      property = await this.prisma.property.findUnique({
        where: { id: user.propertyId },
        select: {
          id: true,
          name: true,
          address: true,
          organizationId: true,
          branding: true,
        },
      });
    }

    // Fetch available properties for the user's organization
    if (user.organizationId) {
      availableProperties = await this.prisma.property.findMany({
        where: { organizationId: user.organizationId },
        select: {
          id: true,
          name: true,
          address: true,
          organizationId: true,
          branding: true,
        },
      });
    }

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
      organization,
      property,
      availableProperties,
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

      // Fetch organization and property details
      let organization = null;
      let property = null;
      let availableProperties = [];

      if (user.organizationId) {
        organization = await this.prisma.organization.findUnique({
          where: { id: user.organizationId },
          select: {
            id: true,
            name: true,
            branding: true,
          },
        });
      }

      if (user.propertyId) {
        property = await this.prisma.property.findUnique({
          where: { id: user.propertyId },
          select: {
            id: true,
            name: true,
            address: true,
            organizationId: true,
            branding: true,
          },
        });
      }

      // Fetch available properties for the user's organization
      if (user.organizationId) {
        availableProperties = await this.prisma.property.findMany({
          where: { organizationId: user.organizationId },
          select: {
            id: true,
            name: true,
            address: true,
            organizationId: true,
            branding: true,
          },
        });
      }

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
        organization,
        property,
        availableProperties,
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