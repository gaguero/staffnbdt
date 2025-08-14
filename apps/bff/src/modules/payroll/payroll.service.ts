import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';
import { AuditService } from '../../shared/audit/audit.service';
import { PaginatedResponse } from '../../shared/dto/pagination.dto';
import { User, Payslip, Role } from '@prisma/client';
import * as csvParser from 'csv-parser';
import { Readable } from 'stream';

interface PayrollCsvRow {
  userId: string;
  period: string;
  grossSalary: number;
  deductions: Record<string, number>;
  netSalary: number;
  currency: string;
}

@Injectable()
export class PayrollService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  async getUserPayslips(
    userId: string,
    currentUser: User,
    limit = 10,
    offset = 0,
  ): Promise<PaginatedResponse<Payslip>> {
    // Staff can only access their own payslips
    if (currentUser.role === Role.STAFF && currentUser.id !== userId) {
      throw new ForbiddenException('Can only access your own payslips');
    }

    // Department admin can only access payslips from their department
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      const targetUser = await this.prisma.user.findUnique({
        where: { id: userId, deletedAt: null },
      });
      
      if (!targetUser || targetUser.departmentId !== currentUser.departmentId) {
        throw new ForbiddenException('Cannot access payslips from other departments');
      }
    }

    const [payslips, total] = await Promise.all([
      this.prisma.payslip.findMany({
        where: { userId },
        orderBy: { period: 'desc' },
        skip: offset,
        take: limit,
      }),
      this.prisma.payslip.count({ where: { userId } }),
    ]);

    return new PaginatedResponse(payslips, total, limit, offset);
  }

  async getPayslip(id: string, currentUser: User): Promise<Payslip> {
    const payslip = await this.prisma.payslip.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            departmentId: true,
          },
        },
      },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    // Check access permissions
    if (currentUser.role === Role.STAFF && payslip.userId !== currentUser.id) {
      throw new ForbiddenException('Can only access your own payslips');
    }

    if (
      currentUser.role === Role.DEPARTMENT_ADMIN &&
      payslip.user.departmentId !== currentUser.departmentId
    ) {
      throw new ForbiddenException('Cannot access payslips from other departments');
    }

    // Mark as viewed if it's the user's own payslip
    if (payslip.userId === currentUser.id && !payslip.viewedAt) {
      await this.prisma.payslip.update({
        where: { id },
        data: { viewedAt: new Date() },
      });
    }

    // Log payslip access
    await this.auditService.logView(currentUser.id, 'Payslip', id);

    return payslip;
  }

  async importCsvPayroll(csvData: string, currentUser: User): Promise<{ imported: number; errors: string[] }> {
    // Only superadmins can import payroll
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Only superadmins can import payroll data');
    }

    const results: PayrollCsvRow[] = [];
    const errors: string[] = [];
    const importBatch = `import-${Date.now()}`;

    // Parse CSV data
    const readable = Readable.from([csvData]);
    
    return new Promise((resolve, reject) => {
      readable
        .pipe(csvParser())
        .on('data', (row) => {
          try {
            const parsedRow: PayrollCsvRow = {
              userId: row.userId,
              period: row.period,
              grossSalary: parseFloat(row.grossSalary),
              deductions: JSON.parse(row.deductions || '{}'),
              netSalary: parseFloat(row.netSalary),
              currency: row.currency || 'USD',
            };
            results.push(parsedRow);
          } catch (error) {
            errors.push(`Row parsing error: ${error.message}`);
          }
        })
        .on('end', async () => {
          try {
            let imported = 0;

            for (const row of results) {
              try {
                // Validate user exists
                const user = await this.prisma.user.findUnique({
                  where: { id: row.userId, deletedAt: null },
                });

                if (!user) {
                  errors.push(`User not found: ${row.userId}`);
                  continue;
                }

                // Check if payslip already exists for this period
                const existingPayslip = await this.prisma.payslip.findUnique({
                  where: {
                    userId_period: {
                      userId: row.userId,
                      period: row.period,
                    },
                  },
                });

                if (existingPayslip) {
                  errors.push(`Payslip already exists for user ${row.userId}, period ${row.period}`);
                  continue;
                }

                // Create payslip
                await this.prisma.payslip.create({
                  data: {
                    userId: row.userId,
                    period: row.period,
                    grossSalary: row.grossSalary,
                    deductions: row.deductions,
                    netSalary: row.netSalary,
                    currency: row.currency,
                    importBatch,
                  },
                });

                imported++;
              } catch (error) {
                errors.push(`Error creating payslip for user ${row.userId}: ${error.message}`);
              }
            }

            // Log the import operation
            await this.auditService.log({
              userId: currentUser.id,
              action: 'CSV_IMPORT',
              entity: 'Payslip',
              entityId: importBatch,
              newData: { imported, errors: errors.length },
            });

            resolve({ imported, errors });
          } catch (error) {
            reject(error);
          }
        })
        .on('error', reject);
    });
  }

  async getPayrollStats(currentUser: User, period?: string): Promise<any> {
    // Only superadmins and department admins can view stats
    if (currentUser.role === Role.STAFF) {
      throw new ForbiddenException('Staff cannot access payroll statistics');
    }

    let whereClause: any = {};
    
    if (period) {
      whereClause.period = period;
    }

    // Department admins only see their department
    if (currentUser.role === Role.DEPARTMENT_ADMIN) {
      whereClause.user = { departmentId: currentUser.departmentId, deletedAt: null };
    } else {
      whereClause.user = { deletedAt: null };
    }

    const [totalPayslips, totalGross, totalNet, avgSalary] = await Promise.all([
      this.prisma.payslip.count({ where: whereClause }),
      this.prisma.payslip.aggregate({
        where: whereClause,
        _sum: { grossSalary: true },
      }),
      this.prisma.payslip.aggregate({
        where: whereClause,
        _sum: { netSalary: true },
      }),
      this.prisma.payslip.aggregate({
        where: whereClause,
        _avg: { grossSalary: true },
      }),
    ]);

    return {
      totalPayslips,
      totalGross: totalGross._sum.grossSalary || 0,
      totalNet: totalNet._sum.netSalary || 0,
      avgSalary: avgSalary._avg.grossSalary || 0,
    };
  }
}