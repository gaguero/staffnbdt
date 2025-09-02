import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { DomainEventBus } from '../../../shared/events/domain-event-bus.service';

export interface TextAnalysisResult {
  intent: {
    category: string;
    confidence: number;
    subcategory?: string;
  };
  entities: Array<{
    entity: string;
    value: any;
    confidence: number;
    start: number;
    end: number;
  }>;
  sentiment: {
    score: number; // -1 to 1
    label: 'negative' | 'neutral' | 'positive';
    confidence: number;
  };
  keywords: Array<{
    word: string;
    relevance: number;
  }>;
  language: string;
  urgency: {
    level: 'low' | 'medium' | 'high' | 'urgent';
    score: number;
    indicators: string[];
  };
}

export interface ObjectCreationSuggestion {
  type: string;
  confidence: number;
  fields: Record<string, any>;
  reasoning: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number;
  suggestedAssignments: Array<{
    userId: string;
    role: string;
    confidence: number;
  }>;
}

export interface ContentEnhancement {
  originalText: string;
  enhancedText: string;
  improvements: Array<{
    type: 'clarity' | 'tone' | 'completeness' | 'professionalism';
    description: string;
    before: string;
    after: string;
  }>;
  qualityScore: number;
  readabilityScore: number;
}

export interface SmartAutoComplete {
  suggestions: Array<{
    text: string;
    confidence: number;
    context: string;
    reasoning: string;
  }>;
  fieldPredictions: Record<string, any>;
  templateRecommendations: Array<{
    templateId: string;
    name: string;
    matchScore: number;
    applicableFields: string[];
  }>;
}

export interface ConversationAnalysis {
  topics: Array<{
    topic: string;
    relevance: number;
    mentions: number;
  }>;
  actionItems: Array<{
    action: string;
    assignee?: string;
    dueDate?: Date;
    priority: string;
  }>;
  followUpNeeds: Array<{
    type: string;
    timing: string;
    content: string;
  }>;
  satisfaction: {
    score: number;
    indicators: string[];
    concerns: string[];
  };
}

@Injectable()
export class NLPService {
  private readonly logger = new Logger(NLPService.name);
  private intentPatterns = new Map<string, RegExp[]>();
  private entityPatterns = new Map<string, RegExp>();
  private urgencyIndicators: string[] = [
    'urgent', 'emergency', 'asap', 'immediately', 'critical', 'now',
    'right away', 'high priority', 'can\'t wait', 'deadline'
  ];
  private sentimentLexicon = new Map<string, number>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: DomainEventBus,
  ) {
    this.initializeNLPService();
  }

  private async initializeNLPService(): Promise<void> {
    this.logger.log('Initializing NLP Service...');
    await this.loadIntentPatterns();
    await this.loadEntityPatterns();
    await this.loadSentimentLexicon();
    this.logger.log('NLP Service initialized successfully');
  }

  /**
   * Analyze text to extract intent, entities, sentiment, and other insights
   */
  async analyzeText(
    text: string,
    context?: {
      source: 'email' | 'chat' | 'form' | 'voice' | 'sms';
      language?: string;
      metadata?: any;
    }
  ): Promise<TextAnalysisResult> {
    try {
      this.logger.log(`Analyzing text from ${context?.source || 'unknown'} source`);
      
      // Clean and preprocess text
      const cleanedText = this.preprocessText(text);
      
      // Detect language
      const language = context?.language || await this.detectLanguage(cleanedText);
      
      // Extract intent
      const intent = await this.extractIntent(cleanedText, context);
      
      // Extract entities
      const entities = await this.extractEntities(cleanedText, intent);
      
      // Analyze sentiment
      const sentiment = await this.analyzeSentiment(cleanedText, language);
      
      // Extract keywords
      const keywords = await this.extractKeywords(cleanedText);
      
      // Assess urgency
      const urgency = await this.assessUrgency(cleanedText, intent, sentiment);
      
      return {
        intent,
        entities,
        sentiment,
        keywords,
        language,
        urgency
      };
      
    } catch (error) {
      this.logger.error('Error analyzing text:', error);
      return this.getDefaultAnalysis(text);
    }
  }

  /**
   * Generate object creation suggestions from text analysis
   */
  async suggestObjectCreation(
    analysisResult: TextAnalysisResult,
    context: {
      guestId?: string;
      reservationId?: string;
      tenant: { organizationId: string; propertyId: string };
    }
  ): Promise<ObjectCreationSuggestion[]> {
    try {
      const suggestions: ObjectCreationSuggestion[] = [];
      
      // Map intent to object types
      const objectTypeMappings = await this.getObjectTypeMappings(context.tenant);
      const primaryMapping = objectTypeMappings.get(analysisResult.intent.category);
      
      if (primaryMapping) {
        const suggestion: ObjectCreationSuggestion = {
          type: primaryMapping.objectType,
          confidence: analysisResult.intent.confidence,
          fields: await this.mapEntitiesToFields(analysisResult.entities, primaryMapping),
          reasoning: `Detected intent: ${analysisResult.intent.category} with ${Math.round(analysisResult.intent.confidence * 100)}% confidence`,
          priority: this.mapUrgencyToPriority(analysisResult.urgency),
          estimatedDuration: this.estimateTaskDuration(analysisResult.intent.category, analysisResult.entities),
          suggestedAssignments: await this.suggestAssignments(analysisResult, context)
        };
        
        // Enhance fields with context
        if (context.guestId) {
          suggestion.fields.guestId = context.guestId;
        }
        if (context.reservationId) {
          suggestion.fields.reservationId = context.reservationId;
        }
        
        // Set due date based on urgency
        suggestion.fields.dueAt = this.calculateDueDate(analysisResult.urgency);
        
        suggestions.push(suggestion);
      }
      
      // Check for secondary suggestions based on entities
      const secondarySuggestions = await this.generateSecondarySuggestions(analysisResult, context);
      suggestions.push(...secondarySuggestions);
      
      return suggestions.sort((a, b) => b.confidence - a.confidence);
      
    } catch (error) {
      this.logger.error('Error generating object suggestions:', error);
      return [];
    }
  }

  /**
   * Enhance content for better clarity and professionalism
   */
  async enhanceContent(
    text: string,
    purpose: 'response' | 'notification' | 'documentation' | 'communication',
    style: 'formal' | 'casual' | 'professional' | 'friendly' = 'professional'
  ): Promise<ContentEnhancement> {
    try {
      const improvements: ContentEnhancement['improvements'] = [];
      let enhancedText = text;
      
      // Fix grammar and spelling
      const grammarFixes = await this.fixGrammarAndSpelling(enhancedText);
      if (grammarFixes.changed) {
        improvements.push({
          type: 'clarity',
          description: 'Fixed grammar and spelling errors',
          before: enhancedText,
          after: grammarFixes.text
        });
        enhancedText = grammarFixes.text;
      }
      
      // Adjust tone based on style
      const toneAdjustment = await this.adjustTone(enhancedText, style);
      if (toneAdjustment.changed) {
        improvements.push({
          type: 'tone',
          description: `Adjusted tone to be more ${style}`,
          before: enhancedText,
          after: toneAdjustment.text
        });
        enhancedText = toneAdjustment.text;
      }
      
      // Add missing information based on purpose
      const completenessCheck = await this.checkCompleteness(enhancedText, purpose);
      if (completenessCheck.suggestions.length > 0) {
        const completedText = await this.addMissingInformation(enhancedText, completenessCheck.suggestions);
        improvements.push({
          type: 'completeness',
          description: 'Added missing information for completeness',
          before: enhancedText,
          after: completedText
        });
        enhancedText = completedText;
      }
      
      // Professional formatting
      const formattedText = await this.applyProfessionalFormatting(enhancedText, purpose);
      if (formattedText !== enhancedText) {
        improvements.push({
          type: 'professionalism',
          description: 'Applied professional formatting',
          before: enhancedText,
          after: formattedText
        });
        enhancedText = formattedText;
      }
      
      return {
        originalText: text,
        enhancedText,
        improvements,
        qualityScore: this.calculateQualityScore(enhancedText, improvements),
        readabilityScore: this.calculateReadabilityScore(enhancedText)
      };
      
    } catch (error) {
      this.logger.error('Error enhancing content:', error);
      return {
        originalText: text,
        enhancedText: text,
        improvements: [],
        qualityScore: 0.5,
        readabilityScore: 0.5
      };
    }
  }

  /**
   * Provide smart auto-completion and field suggestions
   */
  async provideAutoComplete(
    partialText: string,
    fieldType: string,
    context: {
      objectType?: string;
      guestHistory?: any;
      similarObjects?: any[];
      tenant: { organizationId: string; propertyId: string };
    }
  ): Promise<SmartAutoComplete> {
    try {
      const suggestions = [];
      
      // Context-aware suggestions based on field type
      switch (fieldType) {
        case 'description':
          suggestions.push(...await this.suggestDescriptions(partialText, context));
          break;
        case 'location':
          suggestions.push(...await this.suggestLocations(partialText, context));
          break;
        case 'service':
          suggestions.push(...await this.suggestServices(partialText, context));
          break;
        case 'staff_assignment':
          suggestions.push(...await this.suggestStaffAssignments(partialText, context));
          break;
      }
      
      // Generic text completion
      const genericSuggestions = await this.generateGenericCompletions(partialText, context);
      suggestions.push(...genericSuggestions);
      
      // Predict other field values based on current input
      const fieldPredictions = await this.predictRelatedFields(partialText, context);
      
      // Recommend templates based on input
      const templateRecommendations = await this.recommendTemplates(partialText, context);
      
      return {
        suggestions: suggestions
          .sort((a, b) => b.confidence - a.confidence)
          .slice(0, 5), // Top 5 suggestions
        fieldPredictions,
        templateRecommendations
      };
      
    } catch (error) {
      this.logger.error('Error providing auto-completion:', error);
      return {
        suggestions: [],
        fieldPredictions: {},
        templateRecommendations: []
      };
    }
  }

  /**
   * Analyze conversations for insights and action items
   */
  async analyzeConversation(
    messages: Array<{
      content: string;
      sender: string;
      timestamp: Date;
      type: 'guest' | 'staff' | 'system';
    }>,
    context: {
      guestId?: string;
      reservationId?: string;
      tenant: { organizationId: string; propertyId: string };
    }
  ): Promise<ConversationAnalysis> {
    try {
      // Combine all message content
      const fullConversation = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
      
      // Extract topics
      const topics = await this.extractTopics(fullConversation);
      
      // Identify action items
      const actionItems = await this.extractActionItems(messages);
      
      // Determine follow-up needs
      const followUpNeeds = await this.identifyFollowUpNeeds(messages, topics);
      
      // Analyze satisfaction
      const satisfaction = await this.analyzeSatisfaction(messages);
      
      return {
        topics,
        actionItems,
        followUpNeeds,
        satisfaction
      };
      
    } catch (error) {
      this.logger.error('Error analyzing conversation:', error);
      return {
        topics: [],
        actionItems: [],
        followUpNeeds: [],
        satisfaction: { score: 0.5, indicators: [], concerns: [] }
      };
    }
  }

  // Private helper methods
  private async loadIntentPatterns(): Promise<void> {
    // Load intent recognition patterns
    const patterns = new Map<string, RegExp[]>([
      ['room_service', [
        /\b(room service|food delivery|order food|hungry|meal|breakfast|lunch|dinner)\b/i,
        /\b(bring.*food|deliver.*meal|room.*menu)\b/i
      ]],
      ['housekeeping', [
        /\b(housekeeping|clean.*room|towel|sheet|pillow|tidy up|make.*bed)\b/i,
        /\b(dirty|mess|spill|vacuum|mop)\b/i
      ]],
      ['maintenance', [
        /\b(fix|repair|broken|not working|malfunction|issue with|problem with)\b/i,
        /\b(air conditioning|tv|wifi|light|toilet|shower|faucet)\b/i
      ]],
      ['concierge', [
        /\b(recommendation|suggest|where.*go|what.*do|activity|tour|restaurant)\b/i,
        /\b(book|reserve|ticket|transportation|taxi|directions)\b/i
      ]],
      ['complaint', [
        /\b(complain|unhappy|dissatisfied|poor|bad|terrible|awful|worst)\b/i,
        /\b(manager|supervisor|speak to|talk to|escalate)\b/i
      ]],
      ['compliment', [
        /\b(thank|appreciate|excellent|wonderful|amazing|great|love|perfect)\b/i,
        /\b(compliment|praise|outstanding|exceptional|impressed)\b/i
      ]]
    ]);
    
    this.intentPatterns = patterns;
    this.logger.log(`Loaded ${patterns.size} intent pattern categories`);
  }

  private async loadEntityPatterns(): Promise<void> {
    const patterns = new Map<string, RegExp>([
      ['room_number', /\b(?:room\s*)?(\d{3,4}[a-zA-Z]?)\b/i],
      ['time', /\b(\d{1,2}(?::\d{2})?\s*(?:am|pm|AM|PM)?)\b/],
      ['date', /\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|today|tomorrow|yesterday)\b/i],
      ['phone', /\b(\+?\d[\d\s\-\(\)]{8,}\d)\b/],
      ['email', /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/],
      ['urgency', /\b(urgent|asap|emergency|immediately|critical|high priority)\b/i],
      ['person_name', /\b([A-Z][a-z]+\s+[A-Z][a-z]+)\b/],
      ['location', /\b(lobby|pool|restaurant|gym|spa|parking|elevator|bar)\b/i]
    ]);
    
    this.entityPatterns = patterns;
    this.logger.log(`Loaded ${patterns.size} entity patterns`);
  }

  private async loadSentimentLexicon(): Promise<void> {
    // Simplified sentiment lexicon (in production, use comprehensive lexicons)
    const lexicon = new Map<string, number>([
      // Positive words
      ['excellent', 0.8], ['wonderful', 0.7], ['great', 0.6], ['good', 0.4],
      ['amazing', 0.9], ['perfect', 0.8], ['love', 0.7], ['thank', 0.5],
      ['appreciate', 0.6], ['happy', 0.6], ['satisfied', 0.5],
      
      // Negative words
      ['terrible', -0.9], ['awful', -0.8], ['horrible', -0.8], ['bad', -0.6],
      ['poor', -0.5], ['disappointed', -0.6], ['unhappy', -0.6],
      ['complain', -0.5], ['problem', -0.4], ['issue', -0.3],
      
      // Neutral/context words
      ['okay', 0.1], ['fine', 0.1], ['normal', 0.0], ['standard', 0.0]
    ]);
    
    this.sentimentLexicon = lexicon;
    this.logger.log(`Loaded sentiment lexicon with ${lexicon.size} words`);
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s\-\.\@\+]/g, ' ') // Keep basic punctuation
      .replace(/\s+/g, ' ')
      .trim();
  }

  private async detectLanguage(text: string): Promise<string> {
    // Simplified language detection (in production, use proper language detection)
    const spanishWords = ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no'];
    const englishWords = ['the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'it'];
    
    const words = text.toLowerCase().split(/\s+/);
    const spanishCount = words.filter(word => spanishWords.includes(word)).length;
    const englishCount = words.filter(word => englishWords.includes(word)).length;
    
    return spanishCount > englishCount ? 'es' : 'en';
  }

  private async extractIntent(text: string, context?: any): Promise<TextAnalysisResult['intent']> {
    let bestMatch = { category: 'general', confidence: 0.1 };
    
    for (const [category, patterns] of this.intentPatterns) {
      for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) {
          const confidence = Math.min(0.9, 0.3 + (match[0].length / text.length));
          if (confidence > bestMatch.confidence) {
            bestMatch = { category, confidence };
          }
        }
      }
    }
    
    return bestMatch;
  }

  private async extractEntities(text: string, intent: any): Promise<TextAnalysisResult['entities']> {
    const entities = [];
    
    for (const [entityType, pattern] of this.entityPatterns) {
      const matches = [...text.matchAll(new RegExp(pattern, 'gi'))];
      for (const match of matches) {
        entities.push({
          entity: entityType,
          value: match[1] || match[0],
          confidence: 0.8,
          start: match.index || 0,
          end: (match.index || 0) + match[0].length
        });
      }
    }
    
    return entities;
  }

  private async analyzeSentiment(text: string, language: string): Promise<TextAnalysisResult['sentiment']> {
    const words = text.split(/\s+/);
    let totalScore = 0;
    let scoredWords = 0;
    
    for (const word of words) {
      const score = this.sentimentLexicon.get(word.toLowerCase());
      if (score !== undefined) {
        totalScore += score;
        scoredWords++;
      }
    }
    
    const averageScore = scoredWords > 0 ? totalScore / scoredWords : 0;
    const normalizedScore = Math.max(-1, Math.min(1, averageScore));
    
    let label: 'negative' | 'neutral' | 'positive';
    if (normalizedScore < -0.1) label = 'negative';
    else if (normalizedScore > 0.1) label = 'positive';
    else label = 'neutral';
    
    return {
      score: normalizedScore,
      label,
      confidence: Math.min(0.9, scoredWords / words.length + 0.1)
    };
  }

  private async extractKeywords(text: string): Promise<TextAnalysisResult['keywords']> {
    const words = text.split(/\s+/).filter(word => word.length > 3);
    const wordCount = new Map<string, number>();
    
    for (const word of words) {
      const cleanWord = word.toLowerCase();
      wordCount.set(cleanWord, (wordCount.get(cleanWord) || 0) + 1);
    }
    
    return Array.from(wordCount.entries())
      .map(([word, count]) => ({
        word,
        relevance: Math.min(1, count / words.length * 10)
      }))
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 10);
  }

  private async assessUrgency(text: string, intent: any, sentiment: any): Promise<TextAnalysisResult['urgency']> {
    let urgencyScore = 0;
    const indicators = [];
    
    // Check for urgency keywords
    for (const indicator of this.urgencyIndicators) {
      if (text.toLowerCase().includes(indicator)) {
        urgencyScore += 0.3;
        indicators.push(indicator);
      }
    }
    
    // Intent-based urgency
    if (intent.category === 'complaint' || intent.category === 'maintenance') {
      urgencyScore += 0.2;
    }
    
    // Sentiment-based urgency (very negative = more urgent)
    if (sentiment.score < -0.5) {
      urgencyScore += 0.2;
      indicators.push('negative sentiment');
    }
    
    urgencyScore = Math.min(1, urgencyScore);
    
    let level: 'low' | 'medium' | 'high' | 'urgent';
    if (urgencyScore < 0.25) level = 'low';
    else if (urgencyScore < 0.5) level = 'medium';
    else if (urgencyScore < 0.75) level = 'high';
    else level = 'urgent';
    
    return {
      level,
      score: urgencyScore,
      indicators
    };
  }

  // Additional helper methods would be implemented here...
  private getDefaultAnalysis(text: string): TextAnalysisResult {
    return {
      intent: { category: 'general', confidence: 0.1 },
      entities: [],
      sentiment: { score: 0, label: 'neutral', confidence: 0.1 },
      keywords: [],
      language: 'en',
      urgency: { level: 'medium', score: 0.5, indicators: [] }
    };
  }

  // ... Many more helper methods would be implemented for production use
}
