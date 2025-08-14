import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrainingService } from './training.service';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { ApiResponse as CustomApiResponse } from '../../shared/dto/response.dto';
import { User } from '@prisma/client';

@ApiTags('Training')
@Controller('training')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class TrainingController {
  constructor(private readonly trainingService: TrainingService) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get all training sessions' })
  async findAllSessions(
    @Query('limit') limit: number,
    @Query('offset') offset: number,
  ) {
    const result = await this.trainingService.findAll(limit, offset);
    return CustomApiResponse.success(result, 'Training sessions retrieved successfully');
  }

  @Get('sessions/:id')
  @ApiOperation({ summary: 'Get training session by ID' })
  async findOneSession(@Param('id') id: string) {
    const session = await this.trainingService.findOne(id);
    return CustomApiResponse.success(session, 'Training session retrieved successfully');
  }

  @Post('sessions/:id/enroll')
  @ApiOperation({ summary: 'Enroll in training session' })
  async enroll(
    @Param('id') sessionId: string,
    @CurrentUser() currentUser: User,
  ) {
    const enrollment = await this.trainingService.enroll(sessionId, currentUser);
    return CustomApiResponse.success(enrollment, 'Successfully enrolled in training session');
  }

  @Get('users/:userId/enrollments')
  @ApiOperation({ summary: 'Get user enrollments' })
  async getUserEnrollments(
    @Param('userId') userId: string,
    @CurrentUser() currentUser: User,
  ) {
    const enrollments = await this.trainingService.getUserEnrollments(userId, currentUser);
    return CustomApiResponse.success(enrollments, 'Enrollments retrieved successfully');
  }

  @Patch('enrollments/:id/progress')
  @ApiOperation({ summary: 'Update enrollment progress' })
  async updateProgress(
    @Param('id') enrollmentId: string,
    @Body('progress') progress: any,
    @CurrentUser() currentUser: User,
  ) {
    const enrollment = await this.trainingService.updateProgress(
      enrollmentId,
      progress,
      currentUser,
    );
    return CustomApiResponse.success(enrollment, 'Progress updated successfully');
  }
}