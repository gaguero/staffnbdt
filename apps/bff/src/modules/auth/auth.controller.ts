import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Public } from '../../shared/decorators/public.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { LoginDto, MagicLinkDto, RegisterDto, ResetPasswordDto } from './dto';
import { User } from '@prisma/client';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}