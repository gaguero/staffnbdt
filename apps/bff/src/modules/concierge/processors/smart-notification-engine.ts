import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { DomainEventBus } from '../../../shared/events/domain-event-bus.service';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app' | 'whatsapp' | 'teams' | 'slack';
  enabled: boolean;
  config: any;
  priority: number;
  fallback?: NotificationChannel;
}

export interface SmartNotification {
  id?: string;
  trigger: NotificationTrigger;
  channels: NotificationChannel[];
  personalization: PersonalizationRules;
  timing: TimingStrategy;
  content: ContentTemplate;
  learningEnabled: boolean;
  tenant: { organizationId: string; propertyId: string };
  metadata?: any;
}

export interface NotificationTrigger {
  event: string;
  conditions?: any;
  frequency?: 'immediate' | 'batched' | 'scheduled' | 'intelligent';
  throttling?: {
    maxPerHour: number;
    maxPerDay: number;
    cooldownMinutes: number;
  };
}

export interface PersonalizationRules {
  useRecipientHistory: boolean;
  adaptToTimezone: boolean;
  languagePreference: boolean;
  roleBasedContent: boolean;
  contextualData: boolean;
  sentimentAnalysis: boolean;
}

export interface TimingStrategy {
  type: 'immediate' | 'optimal' | 'business_hours' | 'predictive';
  businessHours?: { start: string; end: string; timezone: string };
  delayMinutes?: number;
  predictiveModel?: {
    useEngagementHistory: boolean;
    considerWorkload: boolean;
    adaptToUrgency: boolean;
  };
}

export interface ContentTemplate {
  subject: string;
  body: string;
  variables: Record<string, any>;
  templates: {
    [channel: string]: {
      subject?: string;
      body: string;
      format: 'text' | 'html' | 'markdown' | 'rich';
    };
  };
  attachments?: AttachmentConfig[];
}

export interface AttachmentConfig {
  type: 'pdf' | 'image' | 'document';
  source: 'generated' | 'template' | 'dynamic';
  config: any;
}

export interface NotificationAnalytics {
  sent: number;
  delivered: number;
  opened: number;
  clicked: number;
  replied: number;
  bounced: number;
  unsubscribed: number;
  engagementScore: number;
  optimalTiming: { hour: number; dayOfWeek: number };
}

export interface RecipientProfile {
  userId: string;
  preferences: {
    channels: Record<string, boolean>;
    timing: 'immediate' | 'business_hours' | 'evening' | 'smart';
    frequency: 'all' | 'important' | 'urgent';
    language: string;
  };
  engagement: NotificationAnalytics;
  lastInteraction: Date;
  timezone: string;
  workSchedule?: { start: string; end: string; days: number[] };
}

@Injectable()
export class SmartNotificationEngine {
  private readonly logger = new Logger(SmartNotificationEngine.name);
  private recipientProfiles = new Map<string, RecipientProfile>();
  private channelPerformance = new Map<string, any>();
  private contentEffectiveness = new Map<string, any>();
  private pendingNotifications = new Map<string, any>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {
    this.initializeNotificationEngine();
  }

  private async initializeNotificationEngine(): Promise<void> {
    this.logger.log('Initializing Smart Notification Engine...');
    await this.loadRecipientProfiles();
    await this.loadChannelConfigurations();
    await this.initializeAnalytics();
    this.logger.log('Smart Notification Engine initialized successfully');
  }

  /**
   * Send smart notification with intelligent routing and timing
   */
  async sendSmartNotification(notification: SmartNotification): Promise<any> {
    try {
      this.logger.log(`Processing smart notification: ${notification.trigger.event}`);

      // Analyze recipient preferences and context
      const recipients = await this.analyzeRecipients(notification);
      
      // Optimize timing for each recipient
      const optimizedDeliveries = await this.optimizeDeliveryTiming(notification, recipients);
      
      // Personalize content for each recipient
      const personalizedContent = await this.personalizeContent(notification, recipients);
      
      // Select optimal channels for each recipient
      const channelSelections = await this.selectOptimalChannels(notification, recipients);
      
      const results = [];
      
      for (let i = 0; i < recipients.length; i++) {
        const recipient = recipients[i];
        const delivery = optimizedDeliveries[i];
        const content = personalizedContent[i];
        const channels = channelSelections[i];
        
        const result = await this.deliverToRecipient(
          recipient,
          content,
          channels,
          delivery,
          notification
        );
        
        results.push(result);
      }

      // Learn from delivery results
      await this.learnFromDelivery(notification, results);
      
      // Update analytics
      await this.updateNotificationAnalytics(notification, results);

      return {
        success: true,
        totalRecipients: recipients.length,
        deliveryResults: results,
        analytics: this.calculateDeliveryAnalytics(results)
      };

    } catch (error) {
      this.logger.error('Error in smart notification delivery:', error);
      await this.handleDeliveryFailure(notification, error);
      throw error;
    }
  }

  /**
   * Analyze recipients and load their profiles
   */
  private async analyzeRecipients(notification: SmartNotification): Promise<RecipientProfile[]> {
    // Extract recipient IDs from trigger data or notification config
    const recipientIds = await this.extractRecipientIds(notification);
    
    const profiles = [];
    for (const recipientId of recipientIds) {
      let profile = this.recipientProfiles.get(recipientId);
      
      if (!profile) {
        profile = await this.buildRecipientProfile(recipientId, notification.tenant);
        this.recipientProfiles.set(recipientId, profile);
      } else {
        // Update profile with latest data
        profile = await this.updateRecipientProfile(profile, notification.tenant);
      }
      
      profiles.push(profile);
    }
    
    return profiles;
  }

  /**
   * Optimize delivery timing for each recipient
   */
  private async optimizeDeliveryTiming(
    notification: SmartNotification,
    recipients: RecipientProfile[]
  ): Promise<any[]> {
    const deliveryTimes = [];
    
    for (const recipient of recipients) {
      let deliveryTime = new Date();
      
      switch (notification.timing.type) {
        case 'immediate':
          // Send now unless recipient is in do-not-disturb
          if (await this.isInDoNotDisturbHours(recipient)) {
            deliveryTime = await this.getNextAvailableTime(recipient);
          }
          break;
          
        case 'optimal':
          deliveryTime = await this.predictOptimalTime(recipient, notification);
          break;
          
        case 'business_hours':
          deliveryTime = await this.getNextBusinessHour(recipient, notification.timing.businessHours);
          break;
          
        case 'predictive':
          deliveryTime = await this.predictBestDeliveryTime(recipient, notification);
          break;
      }
      
      deliveryTimes.push({
        recipientId: recipient.userId,
        scheduledTime: deliveryTime,
        reasoning: await this.explainTimingDecision(recipient, deliveryTime, notification)
      });
    }
    
    return deliveryTimes;
  }

  /**
   * Personalize content for each recipient
   */
  private async personalizeContent(
    notification: SmartNotification,
    recipients: RecipientProfile[]
  ): Promise<any[]> {
    const personalizedContent = [];
    
    for (const recipient of recipients) {
      let content = { ...notification.content };
      
      if (notification.personalization.useRecipientHistory) {
        content = await this.adaptContentToHistory(content, recipient);
      }
      
      if (notification.personalization.roleBasedContent) {
        content = await this.adaptContentToRole(content, recipient);
      }
      
      if (notification.personalization.languagePreference) {
        content = await this.translateContent(content, recipient.preferences.language);
      }
      
      if (notification.personalization.sentimentAnalysis) {
        content = await this.adaptContentSentiment(content, recipient);
      }
      
      // Replace variables with personalized data
      content = await this.replacePersonalizedVariables(content, recipient, notification);
      
      personalizedContent.push({
        recipientId: recipient.userId,
        content,
        personalizationApplied: [
          notification.personalization.useRecipientHistory && 'history',
          notification.personalization.roleBasedContent && 'role_based',
          notification.personalization.languagePreference && 'language',
          notification.personalization.sentimentAnalysis && 'sentiment'
        ].filter(Boolean)
      });
    }
    
    return personalizedContent;
  }

  /**
   * Select optimal channels for each recipient
   */
  private async selectOptimalChannels(
    notification: SmartNotification,
    recipients: RecipientProfile[]
  ): Promise<any[]> {
    const channelSelections = [];
    
    for (const recipient of recipients) {
      const availableChannels = notification.channels.filter(channel => 
        recipient.preferences.channels[channel.type] !== false
      );
      
      // Score channels based on recipient engagement and channel performance
      const scoredChannels = await this.scoreChannelsForRecipient(availableChannels, recipient);
      
      // Select primary and fallback channels
      const primaryChannel = scoredChannels[0];
      const fallbackChannels = scoredChannels.slice(1, 3); // Up to 2 fallbacks
      
      channelSelections.push({
        recipientId: recipient.userId,
        primaryChannel,
        fallbackChannels,
        reasoning: await this.explainChannelSelection(scoredChannels, recipient)
      });
    }
    
    return channelSelections;
  }

  /**
   * Deliver notification to a specific recipient
   */
  private async deliverToRecipient(
    recipient: RecipientProfile,
    content: any,
    channels: any,
    delivery: any,
    notification: SmartNotification
  ): Promise<any> {
    const deliveryId = `delivery-${Date.now()}-${recipient.userId}`;
    
    try {
      // Check if should be delivered immediately or scheduled
      if (delivery.scheduledTime > new Date()) {
        await this.scheduleDelivery(deliveryId, delivery.scheduledTime, {
          recipient,
          content,
          channels,
          notification
        });
        
        return {
          recipientId: recipient.userId,
          status: 'scheduled',
          scheduledTime: delivery.scheduledTime,
          deliveryId
        };
      }
      
      // Deliver immediately
      return await this.executeDelivery(recipient, content.content, channels, notification);
      
    } catch (error) {
      this.logger.error(`Error delivering to recipient ${recipient.userId}:`, error);
      return {
        recipientId: recipient.userId,
        status: 'failed',
        error: error.message,
        deliveryId
      };
    }
  }

  /**
   * Execute immediate delivery across channels
   */
  private async executeDelivery(
    recipient: RecipientProfile,
    content: ContentTemplate,
    channels: any,
    notification: SmartNotification
  ): Promise<any> {
    const results = [];
    
    // Try primary channel first
    const primaryResult = await this.deliverViaChannel(
      channels.primaryChannel,
      recipient,
      content,
      notification
    );
    
    results.push(primaryResult);
    
    // If primary channel fails, try fallbacks
    if (!primaryResult.success && channels.fallbackChannels?.length > 0) {
      for (const fallbackChannel of channels.fallbackChannels) {
        const fallbackResult = await this.deliverViaChannel(
          fallbackChannel,
          recipient,
          content,
          notification
        );
        
        results.push(fallbackResult);
        
        if (fallbackResult.success) {
          break; // Stop trying fallbacks once one succeeds
        }
      }
    }
    
    const overallSuccess = results.some(r => r.success);
    
    return {
      recipientId: recipient.userId,
      status: overallSuccess ? 'delivered' : 'failed',
      channels: results,
      timestamp: new Date()
    };
  }

  /**
   * Deliver via specific channel
   */
  private async deliverViaChannel(
    channel: NotificationChannel,
    recipient: RecipientProfile,
    content: ContentTemplate,
    notification: SmartNotification
  ): Promise<any> {
    const channelContent = content.templates[channel.type] || {
      subject: content.subject,
      body: content.body,
      format: 'text'
    };
    
    try {
      let deliveryResult;
      
      switch (channel.type) {
        case 'email':
          deliveryResult = await this.sendEmail(recipient, channelContent, channel.config);
          break;
        case 'sms':
          deliveryResult = await this.sendSMS(recipient, channelContent, channel.config);
          break;
        case 'push':
          deliveryResult = await this.sendPushNotification(recipient, channelContent, channel.config);
          break;
        case 'in_app':
          deliveryResult = await this.sendInAppNotification(recipient, channelContent, channel.config);
          break;
        case 'whatsapp':
          deliveryResult = await this.sendWhatsApp(recipient, channelContent, channel.config);
          break;
        case 'teams':
          deliveryResult = await this.sendTeamsMessage(recipient, channelContent, channel.config);
          break;
        case 'slack':
          deliveryResult = await this.sendSlackMessage(recipient, channelContent, channel.config);
          break;
        default:
          throw new Error(`Unsupported channel type: ${channel.type}`);
      }
      
      // Track delivery metrics
      await this.trackChannelMetrics(channel.type, deliveryResult, recipient);
      
      return {
        channel: channel.type,
        success: deliveryResult.success,
        messageId: deliveryResult.messageId,
        timestamp: new Date(),
        metrics: deliveryResult.metrics
      };
      
    } catch (error) {
      this.logger.error(`Error delivering via ${channel.type}:`, error);
      return {
        channel: channel.type,
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  /**
   * Process scheduled notifications
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async processScheduledNotifications(): Promise<void> {
    try {
      const now = new Date();
      const dueNotifications = [];
      
      for (const [deliveryId, scheduledDelivery] of this.pendingNotifications) {
        if (scheduledDelivery.scheduledTime <= now) {
          dueNotifications.push({ deliveryId, ...scheduledDelivery });
        }
      }
      
      if (dueNotifications.length > 0) {
        this.logger.log(`Processing ${dueNotifications.length} scheduled notifications`);
        
        for (const delivery of dueNotifications) {
          await this.executeDelivery(
            delivery.recipient,
            delivery.content,
            delivery.channels,
            delivery.notification
          );
          
          // Remove from pending
          this.pendingNotifications.delete(delivery.deliveryId);
        }
      }
      
    } catch (error) {
      this.logger.error('Error processing scheduled notifications:', error);
    }
  }

  /**
   * Analyze notification performance and optimize
   */
  @Cron(CronExpression.EVERY_HOUR)
  async analyzeAndOptimizeNotifications(): Promise<void> {
    try {
      this.logger.log('Analyzing notification performance...');
      
      // Analyze channel performance
      await this.analyzeChannelPerformance();
      
      // Analyze content effectiveness
      await this.analyzeContentEffectiveness();
      
      // Analyze timing optimization
      await this.analyzeTimingOptimization();
      
      // Update recipient profiles based on recent interactions
      await this.updateRecipientProfiles();
      
      // Generate optimization recommendations
      await this.generateOptimizationRecommendations();
      
    } catch (error) {
      this.logger.error('Error in notification analysis:', error);
    }
  }

  /**
   * Learn from delivery results to improve future notifications
   */
  private async learnFromDelivery(notification: SmartNotification, results: any[]): Promise<void> {
    // Update content effectiveness scores
    for (const result of results) {
      if (result.channels) {
        for (const channelResult of result.channels) {
          const key = `${channelResult.channel}-${notification.trigger.event}`;
          const current = this.contentEffectiveness.get(key) || { attempts: 0, successes: 0 };
          
          current.attempts++;
          if (channelResult.success) {
            current.successes++;
          }
          
          this.contentEffectiveness.set(key, current);
        }
      }
    }
    
    // Store learning data for ML model training
    await this.storeNotificationLearningData({
      notification,
      results,
      timestamp: new Date(),
      analytics: this.calculateDeliveryAnalytics(results)
    });
  }

  // Helper methods for channel-specific delivery
  private async sendEmail(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // Email delivery implementation
    return { success: true, messageId: `email-${Date.now()}` };
  }

  private async sendSMS(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // SMS delivery implementation
    return { success: true, messageId: `sms-${Date.now()}` };
  }

  private async sendPushNotification(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // Push notification implementation
    return { success: true, messageId: `push-${Date.now()}` };
  }

  private async sendInAppNotification(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // In-app notification implementation
    return { success: true, messageId: `inapp-${Date.now()}` };
  }

  private async sendWhatsApp(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // WhatsApp delivery implementation
    return { success: true, messageId: `whatsapp-${Date.now()}` };
  }

  private async sendTeamsMessage(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // Microsoft Teams implementation
    return { success: true, messageId: `teams-${Date.now()}` };
  }

  private async sendSlackMessage(recipient: RecipientProfile, content: any, config: any): Promise<any> {
    // Slack implementation
    return { success: true, messageId: `slack-${Date.now()}` };
  }

  // Additional helper methods would be implemented here...
  private async loadRecipientProfiles(): Promise<void> {
    // Load recipient profiles from database
  }

  private async loadChannelConfigurations(): Promise<void> {
    // Load channel configurations
  }

  private async initializeAnalytics(): Promise<void> {
    // Initialize analytics tracking
  }

  private calculateDeliveryAnalytics(results: any[]): any {
    return {
      totalDeliveries: results.length,
      successfulDeliveries: results.filter(r => r.status === 'delivered' || r.status === 'scheduled').length,
      failedDeliveries: results.filter(r => r.status === 'failed').length
    };
  }

  // Complete implementation of all missing methods
  private async updateNotificationAnalytics(notification: any, results: any[]): Promise<void> {
    try {
      this.logger.log(`Updating analytics for notification ${notification.trigger?.event}`);
      
      const analytics = {
        sent: results.length,
        delivered: results.filter(r => r.status === 'delivered').length,
        failed: results.filter(r => r.status === 'failed').length,
        scheduled: results.filter(r => r.status === 'scheduled').length,
        channels: this.aggregateChannelAnalytics(results),
        timestamp: new Date().toISOString()
      };
      
      // Store analytics in memory cache
      const key = `analytics-${notification.trigger?.event}-${new Date().toISOString().split('T')[0]}`;
      this.channelPerformance.set(key, analytics);
      
    } catch (error) {
      this.logger.error('Error updating notification analytics:', error);
    }
  }

  private async handleDeliveryFailure(notification: SmartNotification, error: any): Promise<void> {
    try {
      this.logger.error(`Delivery failure for notification ${notification.trigger?.event}:`, error);
      
      // Track failure metrics
      const failureKey = `failure-${notification.trigger?.event}`;
      const failures = this.channelPerformance.get(failureKey) || { count: 0, errors: [] };
      failures.count += 1;
      failures.errors.push({
        message: error.message,
        timestamp: new Date().toISOString(),
        tenant: notification.tenant
      });
      this.channelPerformance.set(failureKey, failures);
      
      // Emit failure event for monitoring
      await this.eventBus.emit({
        type: 'notification.delivery.failed',
        payload: {
          trigger: notification.trigger?.event,
          error: error.message,
          tenant: notification.tenant
        },
        tenant: notification.tenant,
        timestamp: new Date().toISOString()
      });
      
    } catch (logError) {
      this.logger.error('Error handling delivery failure:', logError);
    }
  }

  private async extractRecipientIds(notification: SmartNotification): Promise<string[]> {
    try {
      // Extract from various sources based on trigger type
      const recipientIds: string[] = [];
      
      // Check explicit recipients in notification
      if (notification.metadata?.recipients) {
        recipientIds.push(...notification.metadata.recipients);
      }
      
      // Extract from trigger data
      if (notification.trigger?.event === 'concierge.sla.overdue') {
        // Get assigned users from the object
        const objectId = notification.metadata?.objectId;
        if (objectId) {
          const object = await this.prisma.conciergeObject.findUnique({
            where: { id: objectId },
            select: { assignments: true }
          });
          
          if (object?.assignments && typeof object.assignments === 'object') {
            const assignments = object.assignments as any;
            if (assignments.assignedUsers && Array.isArray(assignments.assignedUsers)) {
              recipientIds.push(...assignments.assignedUsers);
            }
          }
        }
      }
      
      // Default fallback recipients based on tenant
      if (recipientIds.length === 0) {
        const defaultUsers = await this.prisma.user.findMany({
          where: {
            organizationId: notification.tenant.organizationId,
            propertyId: notification.tenant.propertyId,
            role: { in: ['PROPERTY_MANAGER', 'DEPARTMENT_ADMIN'] },
            isActive: true
          },
          select: { id: true },
          take: 5 // Limit to avoid spam
        });
        
        recipientIds.push(...defaultUsers.map(u => u.id));
      }
      
      return recipientIds.length > 0 ? recipientIds : ['system-default'];
      
    } catch (error) {
      this.logger.error('Error extracting recipient IDs:', error);
      return ['system-default'];
    }
  }

  private async buildRecipientProfile(recipientId: string, tenant: { organizationId: string; propertyId: string }): Promise<RecipientProfile> {
    try {
      // Get user data from database
      const user = await this.prisma.user.findUnique({
        where: {
          id: recipientId,
          organizationId: tenant.organizationId
        },
        include: {
          profile: true
        }
      });
      
      if (!user) {
        // Return default profile for system users
        return {
          userId: recipientId,
          preferences: {
            channels: {
              email: true,
              in_app: true,
              sms: false,
              push: true,
              whatsapp: false,
              teams: false,
              slack: false
            },
            timing: 'business_hours',
            frequency: 'important',
            language: 'en'
          },
          engagement: {
            sent: 0,
            delivered: 0,
            opened: 0,
            clicked: 0,
            replied: 0,
            bounced: 0,
            unsubscribed: 0,
            engagementScore: 0.5,
            optimalTiming: { hour: 9, dayOfWeek: 1 }
          },
          lastInteraction: new Date(),
          timezone: 'UTC'
        };
      }
      
      return {
        userId: user.id,
        preferences: {
          channels: {
            email: true,
            in_app: true,
            sms: user.phoneNumber ? true : false,
            push: true,
            whatsapp: false,
            teams: false,
            slack: false
          },
          timing: 'business_hours',
          frequency: 'all',
          language: user.profile?.language || 'en'
        },
        engagement: {
          sent: 0,
          delivered: 0,
          opened: 0,
          clicked: 0,
          replied: 0,
          bounced: 0,
          unsubscribed: 0,
          engagementScore: 0.8,
          optimalTiming: { hour: 9, dayOfWeek: 1 }
        },
        lastInteraction: user.lastLoginAt || new Date(),
        timezone: user.profile?.timezone || 'UTC',
        workSchedule: {
          start: '09:00',
          end: '17:00',
          days: [1, 2, 3, 4, 5] // Monday to Friday
        }
      };
      
    } catch (error) {
      this.logger.error(`Error building recipient profile for ${recipientId}:`, error);
      throw error;
    }
  }

  private async updateRecipientProfile(profile: RecipientProfile, tenant: { organizationId: string; propertyId: string }): Promise<RecipientProfile> {
    try {
      // Update with latest engagement data
      const recentEngagement = this.channelPerformance.get(`engagement-${profile.userId}`);
      if (recentEngagement) {
        profile.engagement = { ...profile.engagement, ...recentEngagement };
      }
      
      // Update last interaction
      profile.lastInteraction = new Date();
      
      return profile;
      
    } catch (error) {
      this.logger.error(`Error updating recipient profile for ${profile.userId}:`, error);
      return profile;
    }
  }

  private async isInDoNotDisturbHours(recipient: RecipientProfile): Promise<boolean> {
    try {
      const now = new Date();
      const hour = now.getHours();
      
      // Basic DND logic - no notifications between 22:00 and 07:00
      if (hour >= 22 || hour < 7) {
        return true;
      }
      
      // Check weekend if recipient prefers business hours only
      if (recipient.preferences.timing === 'business_hours') {
        const dayOfWeek = now.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
          return true;
        }
      }
      
      return false;
      
    } catch (error) {
      this.logger.error('Error checking DND hours:', error);
      return false;
    }
  }

  private async getNextAvailableTime(recipient: RecipientProfile): Promise<Date> {
    try {
      const now = new Date();
      const nextAvailable = new Date(now);
      
      // If it's night time, schedule for next morning at 8 AM
      const hour = now.getHours();
      if (hour >= 22 || hour < 7) {
        nextAvailable.setDate(nextAvailable.getDate() + (hour >= 22 ? 1 : 0));
        nextAvailable.setHours(8, 0, 0, 0);
      } else {
        // Otherwise, schedule for 1 hour later
        nextAvailable.setHours(nextAvailable.getHours() + 1);
      }
      
      return nextAvailable;
      
    } catch (error) {
      this.logger.error('Error getting next available time:', error);
      return new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 hours from now as fallback
    }
  }

  private async predictOptimalTime(recipient: RecipientProfile, notification: SmartNotification): Promise<Date> {
    try {
      const optimalHour = recipient.engagement.optimalTiming.hour || 9;
      const now = new Date();
      const optimal = new Date(now);
      
      optimal.setHours(optimalHour, 0, 0, 0);
      
      // If optimal time has passed today, schedule for tomorrow
      if (optimal <= now) {
        optimal.setDate(optimal.getDate() + 1);
      }
      
      return optimal;
      
    } catch (error) {
      this.logger.error('Error predicting optimal time:', error);
      return new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 hours from now as fallback
    }
  }

  private async getNextBusinessHour(recipient: RecipientProfile, businessHours: any): Promise<Date> {
    try {
      const now = new Date();
      const businessStart = businessHours?.start || '09:00';
      const businessEnd = businessHours?.end || '17:00';
      
      const [startHour, startMinute] = businessStart.split(':').map(Number);
      const [endHour, endMinute] = businessEnd.split(':').map(Number);
      
      const nextBusinessTime = new Date(now);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      const currentMinutes = currentHour * 60 + currentMinute;
      const startMinutes = startHour * 60 + startMinute;
      const endMinutes = endHour * 60 + endMinute;
      
      if (currentMinutes < startMinutes) {
        // Before business hours - schedule for start of business
        nextBusinessTime.setHours(startHour, startMinute, 0, 0);
      } else if (currentMinutes > endMinutes) {
        // After business hours - schedule for next day
        nextBusinessTime.setDate(nextBusinessTime.getDate() + 1);
        nextBusinessTime.setHours(startHour, startMinute, 0, 0);
      } else {
        // During business hours - schedule for 1 hour later or end of day
        const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
        if (oneHourLater.getHours() * 60 + oneHourLater.getMinutes() <= endMinutes) {
          return oneHourLater;
        } else {
          nextBusinessTime.setDate(nextBusinessTime.getDate() + 1);
          nextBusinessTime.setHours(startHour, startMinute, 0, 0);
        }
      }
      
      return nextBusinessTime;
      
    } catch (error) {
      this.logger.error('Error getting next business hour:', error);
      return new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour from now as fallback
    }
  }

  private async predictBestDeliveryTime(recipient: RecipientProfile, notification: SmartNotification): Promise<Date> {
    try {
      // Use ML-style prediction based on engagement history
      const engagementScore = recipient.engagement.engagementScore || 0.5;
      const optimalHour = recipient.engagement.optimalTiming.hour || 9;
      
      const now = new Date();
      const predicted = new Date(now);
      
      // High engagement users - deliver soon
      if (engagementScore > 0.8) {
        predicted.setMinutes(predicted.getMinutes() + 15);
      }
      // Medium engagement - wait for optimal time
      else if (engagementScore > 0.5) {
        predicted.setHours(optimalHour, 0, 0, 0);
        if (predicted <= now) {
          predicted.setDate(predicted.getDate() + 1);
        }
      }
      // Low engagement - wait longer and try optimal time
      else {
        predicted.setHours(optimalHour, 0, 0, 0);
        if (predicted <= now) {
          predicted.setDate(predicted.getDate() + 1);
        }
        predicted.setHours(predicted.getHours() + 1); // Add delay for low engagement
      }
      
      return predicted;
      
    } catch (error) {
      this.logger.error('Error predicting best delivery time:', error);
      return new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now as fallback
    }
  }

  private async explainTimingDecision(recipient: RecipientProfile, deliveryTime: Date, notification: SmartNotification): Promise<string> {
    try {
      const now = new Date();
      const delayMinutes = Math.round((deliveryTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (delayMinutes <= 5) {
        return `Delivering immediately - recipient has high engagement and notification is urgent`;
      } else if (delayMinutes <= 60) {
        return `Delayed by ${delayMinutes} minutes - optimized for recipient's engagement patterns`;
      } else {
        const hours = Math.round(delayMinutes / 60);
        return `Scheduled for ${hours} hours - aligned with recipient's optimal engagement window`;
      }
      
    } catch (error) {
      this.logger.error('Error explaining timing decision:', error);
      return 'Optimal delivery time based on recipient preferences and historical engagement';
    }
  }

  // Additional helper methods for content personalization
  private async adaptContentToHistory(content: ContentTemplate, recipient: RecipientProfile): Promise<ContentTemplate> {
    try {
      // Adapt based on engagement history
      const engagementScore = recipient.engagement.engagementScore || 0.5;
      
      if (engagementScore < 0.3) {
        // Low engagement - make content more engaging
        content.subject = `🔔 ${content.subject}`;
      }
      
      return content;
    } catch (error) {
      this.logger.error('Error adapting content to history:', error);
      return content;
    }
  }

  private async adaptContentToRole(content: ContentTemplate, recipient: RecipientProfile): Promise<ContentTemplate> {
    try {
      // Get user role and adapt content
      const user = await this.prisma.user.findUnique({
        where: { id: recipient.userId },
        select: { role: true }
      });
      
      if (user?.role === 'PROPERTY_MANAGER') {
        content.subject = `[Manager Alert] ${content.subject}`;
      }
      
      return content;
    } catch (error) {
      this.logger.error('Error adapting content to role:', error);
      return content;
    }
  }

  private async translateContent(content: ContentTemplate, language: string): Promise<ContentTemplate> {
    try {
      if (language === 'en') {
        return content; // Already in English
      }
      
      // Simple translation mapping - in production, use proper translation service
      const translations: Record<string, Record<string, string>> = {
        es: {
          'Overdue Task': 'Tarea Vencida',
          'Due Soon': 'Vence Pronto',
          'New Assignment': 'Nueva Asignación'
        }
      };
      
      const langTranslations = translations[language];
      if (langTranslations) {
        Object.entries(langTranslations).forEach(([key, value]) => {
          content.subject = content.subject.replace(key, value);
          content.body = content.body.replace(key, value);
        });
      }
      
      return content;
    } catch (error) {
      this.logger.error('Error translating content:', error);
      return content;
    }
  }

  private async adaptContentSentiment(content: ContentTemplate, recipient: RecipientProfile): Promise<ContentTemplate> {
    try {
      // Adapt sentiment based on recipient preferences and context
      const engagementScore = recipient.engagement.engagementScore || 0.5;
      
      if (engagementScore < 0.4) {
        // Use more positive, encouraging tone for low-engagement users
        content.body = content.body.replace(/urgent/gi, 'important');
        content.body = content.body.replace(/overdue/gi, 'needs attention');
      }
      
      return content;
    } catch (error) {
      this.logger.error('Error adapting content sentiment:', error);
      return content;
    }
  }

  private async replacePersonalizedVariables(content: ContentTemplate, recipient: RecipientProfile, notification: SmartNotification): Promise<ContentTemplate> {
    try {
      // Get user data for personalization
      const user = await this.prisma.user.findUnique({
        where: { id: recipient.userId },
        include: { profile: true }
      });
      
      const variables = {
        ...content.variables,
        recipientName: user?.firstName || 'User',
        recipientRole: user?.role || 'Staff',
        organizationName: 'Hotel', // Could be fetched from organization table
        timestamp: new Date().toLocaleString()
      };
      
      // Replace variables in subject and body
      let subject = content.subject;
      let body = content.body;
      
      Object.entries(variables).forEach(([key, value]) => {
        const placeholder = `{{${key}}}`;
        subject = subject.replace(new RegExp(placeholder, 'g'), String(value));
        body = body.replace(new RegExp(placeholder, 'g'), String(value));
      });
      
      return {
        ...content,
        subject,
        body,
        variables
      };
      
    } catch (error) {
      this.logger.error('Error replacing personalized variables:', error);
      return content;
    }
  }

  private async scoreChannelsForRecipient(channels: NotificationChannel[], recipient: RecipientProfile): Promise<any[]> {
    try {
      const scoredChannels = channels.map(channel => {
        let score = channel.priority || 1;
        
        // Adjust score based on recipient preferences
        const channelEnabled = recipient.preferences.channels[channel.type];
        if (!channelEnabled) {
          score *= 0.1; // Heavily penalize disabled channels
        }
        
        // Adjust based on channel performance
        const channelPerf = this.channelPerformance.get(`${channel.type}-${recipient.userId}`);
        if (channelPerf) {
          const successRate = channelPerf.delivered / (channelPerf.sent || 1);
          score *= successRate;
        }
        
        // Adjust based on engagement score
        score *= recipient.engagement.engagementScore || 0.5;
        
        return {
          ...channel,
          score,
          reasoning: `Score: ${score.toFixed(2)} - Based on preferences, performance, and engagement`
        };
      });
      
      // Sort by score descending
      return scoredChannels.sort((a, b) => b.score - a.score);
      
    } catch (error) {
      this.logger.error('Error scoring channels for recipient:', error);
      return channels.map((channel, index) => ({
        ...channel,
        score: 0.9 - index * 0.1,
        reasoning: `Default scoring - Channel ${channel.type}`
      }));
    }
  }

  private async explainChannelSelection(scoredChannels: any[], recipient: RecipientProfile): Promise<string> {
    try {
      if (scoredChannels.length === 0) {
        return 'No channels available for this recipient';
      }
      
      const primary = scoredChannels[0];
      const fallbacks = scoredChannels.slice(1, 3);
      
      let explanation = `Primary: ${primary.type} (score: ${primary.score.toFixed(2)})`;
      
      if (fallbacks.length > 0) {
        const fallbackNames = fallbacks.map(c => `${c.type} (${c.score.toFixed(2)})`).join(', ');
        explanation += `. Fallbacks: ${fallbackNames}`;
      }
      
      return explanation;
      
    } catch (error) {
      this.logger.error('Error explaining channel selection:', error);
      return 'Selected channels based on recipient preferences and historical performance';
    }
  }

  private async scheduleDelivery(deliveryId: string, scheduledTime: Date, options: any): Promise<void> {
    try {
      this.logger.log(`Scheduling delivery ${deliveryId} for ${scheduledTime.toISOString()}`);
      
      // Store in pending notifications map
      this.pendingNotifications.set(deliveryId, {
        ...options,
        scheduledTime,
        deliveryId
      });
      
    } catch (error) {
      this.logger.error('Error scheduling delivery:', error);
    }
  }

  private async trackChannelMetrics(channelType: string, result: any, recipient: RecipientProfile): Promise<void> {
    try {
      const metricsKey = `${channelType}-${recipient.userId}`;
      const metrics = this.channelPerformance.get(metricsKey) || {
        sent: 0,
        delivered: 0,
        failed: 0,
        bounced: 0
      };
      
      metrics.sent += 1;
      if (result.success) {
        metrics.delivered += 1;
      } else {
        metrics.failed += 1;
      }
      
      this.channelPerformance.set(metricsKey, metrics);
      this.logger.debug(`Updated metrics for ${channelType}: ${JSON.stringify(metrics)}`);
      
    } catch (error) {
      this.logger.error('Error tracking channel metrics:', error);
    }
  }

  private async analyzeChannelPerformance(): Promise<void> {
    try {
      this.logger.log('Analyzing channel performance across all users');
      
      const channelStats = new Map<string, any>();
      
      // Aggregate performance data
      for (const [key, metrics] of this.channelPerformance.entries()) {
        if (typeof metrics === 'object' && metrics.sent) {
          const channelType = key.split('-')[0];
          const current = channelStats.get(channelType) || {
            totalSent: 0,
            totalDelivered: 0,
            totalFailed: 0,
            successRate: 0
          };
          
          current.totalSent += metrics.sent;
          current.totalDelivered += metrics.delivered || 0;
          current.totalFailed += metrics.failed || 0;
          current.successRate = current.totalSent > 0 ? current.totalDelivered / current.totalSent : 0;
          
          channelStats.set(channelType, current);
        }
      }
      
      // Log performance insights
      for (const [channel, stats] of channelStats.entries()) {
        this.logger.log(`Channel ${channel}: Success rate ${(stats.successRate * 100).toFixed(1)}% (${stats.totalDelivered}/${stats.totalSent})`);
      }
      
    } catch (error) {
      this.logger.error('Error analyzing channel performance:', error);
    }
  }

  private async analyzeContentEffectiveness(): Promise<void> {
    try {
      this.logger.log('Analyzing content effectiveness across notifications');
      
      // Analyze content templates and their success rates
      for (const [key, effectiveness] of this.contentEffectiveness.entries()) {
        const successRate = effectiveness.successes / effectiveness.attempts;
        this.logger.log(`Content template ${key}: Success rate ${(successRate * 100).toFixed(1)}%`);
        
        if (successRate < 0.5) {
          this.logger.warn(`Low performing content template detected: ${key}`);
        }
      }
      
    } catch (error) {
      this.logger.error('Error analyzing content effectiveness:', error);
    }
  }

  private async analyzeTimingOptimization(): Promise<void> {
    try {
      this.logger.log('Analyzing timing optimization patterns');
      
      // Analyze delivery times and their effectiveness
      const timeSlots = new Map<number, { sent: number; successful: number }>();
      
      // Group by hour of day
      for (const [key, metrics] of this.channelPerformance.entries()) {
        if (key.includes('hour-')) {
          const hour = parseInt(key.split('-')[1]);
          const current = timeSlots.get(hour) || { sent: 0, successful: 0 };
          
          if (metrics.sent) {
            current.sent += metrics.sent;
            current.successful += metrics.delivered || 0;
          }
          
          timeSlots.set(hour, current);
        }
      }
      
      // Find optimal delivery hours
      let bestHour = 9; // Default
      let bestSuccessRate = 0;
      
      for (const [hour, stats] of timeSlots.entries()) {
        if (stats.sent > 0) {
          const successRate = stats.successful / stats.sent;
          if (successRate > bestSuccessRate) {
            bestSuccessRate = successRate;
            bestHour = hour;
          }
        }
      }
      
      this.logger.log(`Optimal delivery hour: ${bestHour}:00 with ${(bestSuccessRate * 100).toFixed(1)}% success rate`);
      
    } catch (error) {
      this.logger.error('Error analyzing timing optimization:', error);
    }
  }

  private async updateRecipientProfiles(): Promise<void> {
    try {
      this.logger.log('Updating recipient profiles based on recent interactions');
      
      // Update engagement scores based on recent metrics
      for (const [userId, profile] of this.recipientProfiles.entries()) {
        const userMetrics = Array.from(this.channelPerformance.entries())
          .filter(([key]) => key.includes(userId))
          .reduce((acc, [, metrics]) => {
            if (metrics.sent) {
              acc.totalSent += metrics.sent;
              acc.totalDelivered += metrics.delivered || 0;
              acc.totalOpened += metrics.opened || 0;
            }
            return acc;
          }, { totalSent: 0, totalDelivered: 0, totalOpened: 0 });
        
        if (userMetrics.totalSent > 0) {
          const deliveryRate = userMetrics.totalDelivered / userMetrics.totalSent;
          const openRate = userMetrics.totalOpened / userMetrics.totalDelivered || 0;
          
          // Update engagement score (weighted average)
          profile.engagement.engagementScore = (deliveryRate * 0.3) + (openRate * 0.7);
          profile.engagement.sent = userMetrics.totalSent;
          profile.engagement.delivered = userMetrics.totalDelivered;
          profile.engagement.opened = userMetrics.totalOpened;
        }
      }
      
    } catch (error) {
      this.logger.error('Error updating recipient profiles:', error);
    }
  }

  private async generateOptimizationRecommendations(): Promise<void> {
    try {
      this.logger.log('Generating optimization recommendations');
      
      const recommendations: string[] = [];
      
      // Analyze channel performance
      const channelPerformance = new Map<string, number>();
      for (const [key, metrics] of this.channelPerformance.entries()) {
        if (typeof metrics === 'object' && metrics.sent > 0) {
          const channelType = key.split('-')[0];
          const successRate = (metrics.delivered || 0) / metrics.sent;
          
          if (!channelPerformance.has(channelType)) {
            channelPerformance.set(channelType, successRate);
          }
        }
      }
      
      // Generate channel recommendations
      const bestChannel = Array.from(channelPerformance.entries())
        .sort(([,a], [,b]) => b - a)[0];
      
      if (bestChannel && bestChannel[1] > 0.8) {
        recommendations.push(`Consider prioritizing ${bestChannel[0]} channel (${(bestChannel[1] * 100).toFixed(1)}% success rate)`);
      }
      
      // Analyze timing patterns
      const lowPerformanceUsers = Array.from(this.recipientProfiles.values())
        .filter(profile => profile.engagement.engagementScore < 0.3);
      
      if (lowPerformanceUsers.length > 0) {
        recommendations.push(`${lowPerformanceUsers.length} users have low engagement - consider different timing or content`);
      }
      
      // Log recommendations
      recommendations.forEach(rec => {
        this.logger.log(`Recommendation: ${rec}`);
      });
      
    } catch (error) {
      this.logger.error('Error generating optimization recommendations:', error);
    }
  }

  private async storeNotificationLearningData(data: any): Promise<void> {
    try {
      this.logger.log('Storing notification learning data for ML model training');
      
      // In production, this would store data for ML model training
      const learningData = {
        timestamp: data.timestamp,
        trigger: data.notification.trigger.event,
        recipientCount: data.results.length,
        successRate: data.analytics.successfulDeliveries / data.analytics.totalDeliveries,
        channelDistribution: data.results.reduce((acc: any, result: any) => {
          if (result.channels) {
            result.channels.forEach((ch: any) => {
              acc[ch.channel] = (acc[ch.channel] || 0) + 1;
            });
          }
          return acc;
        }, {}),
        avgDeliveryTime: data.results
          .filter((r: any) => r.timestamp)
          .reduce((sum: number, r: any, _, arr: any[]) => {
            const deliveryTime = new Date(r.timestamp).getTime() - data.timestamp.getTime();
            return sum + deliveryTime / arr.length;
          }, 0)
      };
      
      // Store in memory for now (in production, save to database or ML pipeline)
      const key = `learning-${data.notification.trigger.event}-${Date.now()}`;
      this.contentEffectiveness.set(key, learningData);
      
    } catch (error) {
      this.logger.error('Error storing notification learning data:', error);
    }
  }

  // Additional helper methods
  private aggregateChannelAnalytics(results: any[]): Record<string, any> {
    const channelAnalytics: Record<string, any> = {};
    
    results.forEach(result => {
      if (result.channels) {
        result.channels.forEach((channelResult: any) => {
          if (!channelAnalytics[channelResult.channel]) {
            channelAnalytics[channelResult.channel] = {
              attempts: 0,
              successes: 0,
              failures: 0
            };
          }
          
          channelAnalytics[channelResult.channel].attempts += 1;
          if (channelResult.success) {
            channelAnalytics[channelResult.channel].successes += 1;
          } else {
            channelAnalytics[channelResult.channel].failures += 1;
          }
        });
      }
    });
    
    return channelAnalytics;
  }

  // ... Additional helper method implementations
}
