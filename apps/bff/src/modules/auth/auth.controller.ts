import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { LoginDto, MagicLinkDto, RegisterDto, ResetPasswordDto } from './dto';
import { User, Role } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { TenantService } from '../../shared/tenant/tenant.service';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly prisma: PrismaService,
    private readonly tenantService: TenantService,
  ) {}

  @Post('login')
  @Public()
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Successfully logged in' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Req() req: Request) {
    const result = await this.authService.login(
      loginDto,
      req.ip,
      req.headers['user-agent'],
    );
    
    return CustomApiResponse.success(result, 'Successfully logged in');
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 400, description: 'User already exists or invalid data' })
  async register(@Body() registerDto: RegisterDto) {
    const result = await this.authService.register(registerDto);
    return CustomApiResponse.success(result, 'User successfully registered');
  }

  @Post('magic-link')
  @Public()
  @ApiOperation({ summary: 'Send magic link to user email' })
  @ApiResponse({ status: 200, description: 'Magic link sent successfully' })
  async sendMagicLink(@Body() magicLinkDto: MagicLinkDto) {
    await this.authService.sendMagicLink(magicLinkDto);
    return CustomApiResponse.success(null, 'Magic link sent successfully');
  }

  @Get('magic-link/verify')
  @Public()
  @ApiOperation({ summary: 'Verify magic link token' })
  @ApiResponse({ status: 200, description: 'Magic link verified successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or expired magic link' })
  async verifyMagicLink(@Query('token') token: string, @Req() req: Request) {
    const result = await this.authService.verifyMagicLink(
      token,
      req.ip,
      req.headers['user-agent'],
    );
    
    return CustomApiResponse.success(result, 'Magic link verified successfully');
  }

  @Post('reset-password')
  @Public()
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    await this.authService.resetPassword(resetPasswordDto);
    return CustomApiResponse.success(null, 'Password reset email sent');
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User) {
    return CustomApiResponse.success(
      {
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
        profilePhoto: user.profilePhoto,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      'User profile retrieved successfully',
    );
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Successfully logged out' })
  async logout(@CurrentUser() user: User, @Req() req: Request) {
    // In a more sophisticated setup, you might want to blacklist the JWT token
    // For now, we'll just log the logout action
    return CustomApiResponse.success(null, 'Successfully logged out');
  }

  @Public()
  @Post('init-database')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initialize database with test users (development only)' })
  @ApiResponse({ status: 200, description: 'Database initialized' })
  async initializeDatabase() {
    // Check if users already exist
    const userCount = await this.prisma.user.count({
      where: { deletedAt: null }
    });

    if (userCount > 0) {
      return CustomApiResponse.success({
        message: 'Database already has users',
        userCount,
        users: await this.prisma.user.findMany({
          where: { deletedAt: null },
          select: {
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            department: { select: { name: true } }
          }
        })
      }, 'Database already initialized');
    }

    // Get or create default tenant
    const { organization, property } = await this.tenantService.getDefaultTenant();

    // Create test department
    const department = await this.prisma.department.upsert({
      where: { id: 'temp-dept-id' }, // Use ID since name is no longer unique globally
      update: {},
      create: {
        name: 'Test Department',
        description: 'Test department for development',
        location: 'Test Location',
        propertyId: property.id
      }
    });

    // Create test users
    const users = [
      {
        email: 'admin@nayara.com',
        firstName: 'Admin',
        lastName: 'User',
        role: Role.SUPERADMIN,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: department.id
      },
      {
        email: 'hr@nayara.com',
        firstName: 'HR',
        lastName: 'Manager',
        role: Role.DEPARTMENT_ADMIN,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: department.id
      },
      {
        email: 'staff@nayara.com',
        firstName: 'Staff',
        lastName: 'Member',
        role: Role.STAFF,
        organizationId: organization.id,
        propertyId: property.id,
        departmentId: department.id
      }
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = await this.prisma.user.create({
        data: userData,
        select: {
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          department: { select: { name: true } }
        }
      });
      createdUsers.push(user);
    }

    return CustomApiResponse.success({
      message: 'Database initialized successfully',
      createdUsers,
      department: { name: department.name, id: department.id }
    }, 'Test users created successfully');
  }
}