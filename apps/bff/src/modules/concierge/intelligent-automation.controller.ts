import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Logger
} from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/jwt-auth.guard';
import { PermissionGuard } from '../../auth/permission.guard';
import { RequirePermission } from '../../auth/require-permission.decorator';
import { TenantContextService } from '../../shared/tenant/tenant-context.service';
import { IntelligentPlaybookEngine } from './processors/intelligent-playbook-engine';
import { SmartNotificationEngine, SmartNotification } from './processors/smart-notification-engine';
import { MLPredictionService } from './processors/ml-prediction-service';
import { NLPService, TextAnalysisResult } from './processors/nlp-service';
import { AnalyticsIntelligenceService } from './processors/analytics-intelligence-service';
import { SelfHealingService } from './processors/self-healing-service';

@Controller('api/concierge/intelligence')
@UseGuards(JwtAuthGuard, PermissionGuard)
export class IntelligentAutomationController {
  private readonly logger = new Logger(IntelligentAutomationController.name);

  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly playbookEngine: IntelligentPlaybookEngine,
    private readonly notificationEngine: SmartNotificationEngine,
    private readonly mlPredictionService: MLPredictionService,
    private readonly nlpService: NLPService,
    private readonly analyticsService: AnalyticsIntelligenceService,
    private readonly selfHealingService: SelfHealingService,
  ) {}

  /**
   * Execute intelligent playbook with AI enhancements
   */
  @Post('playbooks/execute')
  @RequirePermission('concierge.playbooks.execute.property')
  async executeIntelligentPlaybook(
    @Body() dto: {
      playbookId: string;
      trigger: string;
      triggerData: any;
      useAI?: boolean;
      learningEnabled?: boolean;
    },
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      this.logger.log(`Executing intelligent playbook ${dto.playbookId} with AI enhancements`);
      
      const result = await this.playbookEngine.executeIntelligentPlaybook({
        playbookId: dto.playbookId,
        trigger: dto.trigger,
        triggerData: dto.triggerData,
        tenant
      });
      
      return {
        success: true,
        execution: result,
        timestamp: new Date(),
        aiEnhanced: dto.useAI !== false,
        learningEnabled: dto.learningEnabled !== false
      };
      
    } catch (error) {
      this.logger.error('Error in intelligent playbook execution:', error);
      throw new HttpException(
        `Playbook execution failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Send smart notification with intelligent routing
   */
  @Post('notifications/send')
  @RequirePermission('concierge.notifications.send.property')
  async sendSmartNotification(
    @Body() dto: {
      trigger: {
        event: string;
        conditions?: any;
        frequency?: 'immediate' | 'batched' | 'scheduled' | 'intelligent';
      };
      content: {
        subject: string;
        body: string;
        variables?: Record<string, any>;
      };
      recipients: string[];
      channels?: Array<{
        type: 'email' | 'sms' | 'push' | 'in_app';
        enabled: boolean;
      }>;
      timing?: {
        type: 'immediate' | 'optimal' | 'business_hours' | 'predictive';
        businessHours?: { start: string; end: string; timezone: string };
      };
      personalization?: {
        useRecipientHistory?: boolean;
        adaptToTimezone?: boolean;
        languagePreference?: boolean;
        roleBasedContent?: boolean;
      };
    },
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      const smartNotification: SmartNotification = {
        trigger: dto.trigger,
        channels: dto.channels?.map(c => ({
          type: c.type,
          enabled: c.enabled,
          config: {},
          priority: 1
        })) || [
          { type: 'email', enabled: true, config: {}, priority: 1 },
          { type: 'in_app', enabled: true, config: {}, priority: 2 }
        ],
        personalization: {
          useRecipientHistory: dto.personalization?.useRecipientHistory ?? true,
          adaptToTimezone: dto.personalization?.adaptToTimezone ?? true,
          languagePreference: dto.personalization?.languagePreference ?? true,
          roleBasedContent: dto.personalization?.roleBasedContent ?? true,
          contextualData: true,
          sentimentAnalysis: true
        },
        timing: dto.timing || { type: 'optimal' },
        content: {
          subject: dto.content.subject,
          body: dto.content.body,
          variables: dto.content.variables || {},
          templates: {
            email: {
              subject: dto.content.subject,
              body: dto.content.body,
              format: 'html'
            },
            in_app: {
              body: dto.content.body,
              format: 'text'
            }
          }
        },
        learningEnabled: true,
        tenant
      };
      
      const result = await this.notificationEngine.sendSmartNotification(smartNotification);
      
      return {
        success: true,
        notification: result,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.logger.error('Error sending smart notification:', error);
      throw new HttpException(
        `Smart notification failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Analyze text with NLP and generate suggestions
   */
  @Post('nlp/analyze')
  @RequirePermission('concierge.objects.create.property')
  async analyzeTextWithNLP(
    @Body() dto: {
      text: string;
      context?: {
        source?: 'email' | 'chat' | 'form' | 'voice' | 'sms';
        guestId?: string;
        reservationId?: string;
        language?: string;
      };
      generateSuggestions?: boolean;
    },
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      // Analyze the text
      const analysis = await this.nlpService.analyzeText(dto.text, dto.context);
      
      let suggestions = [];
      if (dto.generateSuggestions !== false) {
        // Generate object creation suggestions
        suggestions = await this.nlpService.suggestObjectCreation(analysis, {
          guestId: dto.context?.guestId,
          reservationId: dto.context?.reservationId,
          tenant
        });
      }
      
      return {
        analysis,
        suggestions,
        timestamp: new Date(),
        processingTime: Date.now() // Could track actual processing time
      };
      
    } catch (error) {
      this.logger.error('Error in NLP analysis:', error);
      throw new HttpException(
        `NLP analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI-powered predictions for various aspects
   */
  @Get('predictions/:type')
  @RequirePermission('concierge.analytics.read.property')
  async getPredictions(
    @Param('type') type: 'guest_preferences' | 'service_demand' | 'staff_workload' | 'sla_breach' | 'workflow_optimization',
    @Query() query: any,
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      let prediction;
      
      switch (type) {
        case 'guest_preferences':
          if (!query.guestId) {
            throw new HttpException('guestId is required for guest preferences prediction', HttpStatus.BAD_REQUEST);
          }
          prediction = await this.mlPredictionService.predictGuestPreferences(query.guestId, tenant);
          break;
          
        case 'service_demand':
          const timeRange = {
            start: query.start ? new Date(query.start) : new Date(),
            end: query.end ? new Date(query.end) : new Date(Date.now() + 24 * 60 * 60 * 1000)
          };
          prediction = await this.mlPredictionService.forecastServiceDemand(timeRange, tenant);
          break;
          
        case 'staff_workload':
          const workloadTimeRange = {
            start: query.start ? new Date(query.start) : new Date(),
            end: query.end ? new Date(query.end) : new Date(Date.now() + 8 * 60 * 60 * 1000)
          };
          prediction = await this.mlPredictionService.predictStaffWorkload(workloadTimeRange, tenant);
          break;
          
        case 'sla_breach':
          if (!query.objectId) {
            throw new HttpException('objectId is required for SLA breach prediction', HttpStatus.BAD_REQUEST);
          }
          prediction = await this.mlPredictionService.predictSLABreachRisk(query.objectId, tenant);
          break;
          
        case 'workflow_optimization':
          if (!query.workflowType) {
            throw new HttpException('workflowType is required for workflow optimization', HttpStatus.BAD_REQUEST);
          }
          prediction = await this.mlPredictionService.optimizeWorkflow(query.workflowType, tenant);
          break;
          
        default:
          throw new HttpException(`Unknown prediction type: ${type}`, HttpStatus.BAD_REQUEST);
      }
      
      return {
        type,
        prediction,
        timestamp: new Date(),
        cached: false // Could implement caching info
      };
      
    } catch (error) {
      this.logger.error(`Error getting ${type} predictions:`, error);
      throw new HttpException(
        `Prediction failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get performance dashboard with AI insights
   */
  @Get('analytics/dashboard')
  @RequirePermission('concierge.analytics.read.property')
  async getPerformanceDashboard(
    @Query() query: {
      start?: string;
      end?: string;
      includeInsights?: boolean;
      includeForecasts?: boolean;
    },
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      const timeRange = {
        start: query.start ? new Date(query.start) : new Date(Date.now() - 24 * 60 * 60 * 1000),
        end: query.end ? new Date(query.end) : new Date()
      };
      
      const dashboard = await this.analyticsService.generatePerformanceDashboard(timeRange, tenant);
      
      return {
        dashboard,
        timeRange,
        generatedAt: new Date(),
        aiInsights: query.includeInsights !== false,
        forecasting: query.includeForecasts !== false
      };
      
    } catch (error) {
      this.logger.error('Error generating performance dashboard:', error);
      throw new HttpException(
        `Dashboard generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get AI-powered recommendations
   */
  @Get('recommendations/:area')
  @RequirePermission('concierge.analytics.read.property')
  async getRecommendations(
    @Param('area') area: 'operations' | 'staff' | 'guest_experience' | 'efficiency',
    @Query() query: any,
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      const context = {
        area,
        tenant,
        timeRange: query.start && query.end ? {
          start: new Date(query.start),
          end: new Date(query.end)
        } : undefined,
        specificContext: query.context ? JSON.parse(query.context) : undefined
      };
      
      const recommendations = await this.analyticsService.generateRecommendations(context);
      
      return {
        area,
        recommendations: recommendations.slice(0, parseInt(query.limit) || 10),
        generatedAt: new Date(),
        context: context.specificContext ? 'custom' : 'general'
      };
      
    } catch (error) {
      this.logger.error(`Error generating ${area} recommendations:`, error);
      throw new HttpException(
        `Recommendations generation failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get system health and self-healing status
   */
  @Get('system/health')
  @RequirePermission('system.health.read.platform')
  async getSystemHealth(@Request() req: any) {
    try {
      const healthReport = await this.selfHealingService.getSystemHealthReport();
      
      return {
        ...healthReport,
        timestamp: new Date(),
        selfHealingEnabled: true
      };
      
    } catch (error) {
      this.logger.error('Error getting system health:', error);
      throw new HttpException(
        `Health check failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Provide smart auto-completion for form fields
   */
  @Post('autocomplete')
  @RequirePermission('concierge.objects.create.property')
  async getSmartAutoComplete(
    @Body() dto: {
      partialText: string;
      fieldType: string;
      context?: {
        objectType?: string;
        guestId?: string;
        similarObjects?: string[];
      };
    },
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      const context = {
        ...dto.context,
        tenant
      };
      
      const autoComplete = await this.nlpService.provideAutoComplete(
        dto.partialText,
        dto.fieldType,
        context
      );
      
      return {
        ...autoComplete,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.logger.error('Error in smart autocomplete:', error);
      throw new HttpException(
        `Autocomplete failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Analyze conversation for insights and action items
   */
  @Post('conversations/analyze')
  @RequirePermission('concierge.analytics.read.property')
  async analyzeConversation(
    @Body() dto: {
      messages: Array<{
        content: string;
        sender: string;
        timestamp: string;
        type: 'guest' | 'staff' | 'system';
      }>;
      context?: {
        guestId?: string;
        reservationId?: string;
      };
    },
    @Request() req: any
  ) {
    try {
      const tenant = this.tenantContext.getTenantContext(req);
      
      const messages = dto.messages.map(m => ({
        ...m,
        timestamp: new Date(m.timestamp)
      }));
      
      const analysis = await this.nlpService.analyzeConversation(messages, {
        guestId: dto.context?.guestId,
        reservationId: dto.context?.reservationId,
        tenant
      });
      
      return {
        analysis,
        messageCount: messages.length,
        timespan: {
          start: messages[0]?.timestamp,
          end: messages[messages.length - 1]?.timestamp
        },
        timestamp: new Date()
      };
      
    } catch (error) {
      this.logger.error('Error analyzing conversation:', error);
      throw new HttpException(
        `Conversation analysis failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Enhance content with AI improvements
   */
  @Post('content/enhance')
  @RequirePermission('concierge.objects.update.property')
  async enhanceContent(
    @Body() dto: {
      text: string;
      purpose: 'response' | 'notification' | 'documentation' | 'communication';
      style?: 'formal' | 'casual' | 'professional' | 'friendly';
    },
    @Request() req: any
  ) {
    try {
      const enhancement = await this.nlpService.enhanceContent(
        dto.text,
        dto.purpose,
        dto.style || 'professional'
      );
      
      return {
        ...enhancement,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.logger.error('Error enhancing content:', error);
      throw new HttpException(
        `Content enhancement failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Update ML models with feedback for continuous learning
   */
  @Post('ml/feedback')
  @RequirePermission('concierge.analytics.update.property')
  async provideFeedback(
    @Body() dto: {
      predictionId: string;
      actualOutcome: any;
      feedback: {
        accuracy: 'correct' | 'partially_correct' | 'incorrect';
        usefulness: number; // 1-5 scale
        comments?: string;
      };
    },
    @Request() req: any
  ) {
    try {
      await this.mlPredictionService.updatePredictionWithFeedback(
        dto.predictionId,
        dto.actualOutcome,
        dto.feedback
      );
      
      return {
        success: true,
        message: 'Feedback recorded successfully',
        predictionId: dto.predictionId,
        timestamp: new Date()
      };
      
    } catch (error) {
      this.logger.error('Error recording ML feedback:', error);
      throw new HttpException(
        `Feedback recording failed: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
