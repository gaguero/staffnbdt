import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { PayrollService } from './payroll.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../shared/guards/roles.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { Roles } from '../../shared/decorators/roles.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { User, Role } from '@prisma/client';

@ApiTags('Payroll')
@Controller('payroll')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PayrollController {
  constructor(private readonly payrollService: PayrollService) {}

  @Get('users/:userId/payslips')
  @ApiOperation({ summary: 'Get user payslips' })
  async getUserPayslips(
    @Param('userId') userId: string,
    @Query('limit') limit: number,
    @Query('offset') offset: number,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.payrollService.getUserPayslips(userId, currentUser, limit, offset);
    return CustomApiResponse.success(result, 'Payslips retrieved successfully');
  }

  @Get('payslips/:id')
  @ApiOperation({ summary: 'Get payslip by ID' })
  async getPayslip(
    @Param('id') id: string,
    @CurrentUser() currentUser: User,
  ) {
    const payslip = await this.payrollService.getPayslip(id, currentUser);
    return CustomApiResponse.success(payslip, 'Payslip retrieved successfully');
  }

  @Post('import')
  @Roles(Role.PLATFORM_ADMIN)
  @ApiOperation({ summary: 'Import payroll from CSV (Superadmin only)' })
  async importCsv(
    @Body('csvData') csvData: string,
    @CurrentUser() currentUser: User,
  ) {
    const result = await this.payrollService.importCsvPayroll(csvData, currentUser);
    return CustomApiResponse.success(result, 'CSV import completed');
  }

  @Get('stats')
  @Roles(Role.PLATFORM_ADMIN, Role.DEPARTMENT_ADMIN)
  @ApiOperation({ summary: 'Get payroll statistics' })
  async getStats(
    @Query('period') period: string,
    @CurrentUser() currentUser: User,
  ) {
    const stats = await this.payrollService.getPayrollStats(currentUser, period);
    return CustomApiResponse.success(stats, 'Payroll statistics retrieved successfully');
  }
}