import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../shared/database/prisma.service';
import { TenantContextService } from '../../../shared/tenant/tenant-context.service';

export interface ValidationContext {
  organizationId: string;
  propertyId: string;
  userId?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

@Injectable()
export class FieldValidationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantContext: TenantContextService,
  ) {}

  async validateAttribute(
    fieldKey: string,
    fieldType: string,
    value: any,
    validationConfig: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      errors: [],
      warnings: [],
    };

    // Basic type validation
    const typeValidation = await this.validateFieldType(fieldType, value);
    if (!typeValidation.isValid) {
      result.errors.push(...typeValidation.errors);
      result.isValid = false;
    }

    // Field-specific validation
    switch (fieldType) {
      case 'relationship':
        const relationshipValidation = await this.validateRelationshipField(
          fieldKey, 
          value, 
          validationConfig, 
          context
        );
        this.mergeValidationResults(result, relationshipValidation);
        break;

      case 'quantity':
        const quantityValidation = this.validateQuantityField(value, validationConfig);
        this.mergeValidationResults(result, quantityValidation);
        break;

      case 'money':
        const moneyValidation = this.validateMoneyField(value, validationConfig);
        this.mergeValidationResults(result, moneyValidation);
        break;

      case 'file':
        const fileValidation = this.validateFileField(value, validationConfig);
        this.mergeValidationResults(result, fileValidation);
        break;

      case 'url':
        const urlValidation = this.validateUrlField(value);
        this.mergeValidationResults(result, urlValidation);
        break;

      case 'email':
        const emailValidation = this.validateEmailField(value);
        this.mergeValidationResults(result, emailValidation);
        break;

      case 'phone':
        const phoneValidation = this.validatePhoneField(value);
        this.mergeValidationResults(result, phoneValidation);
        break;

      case 'select':
      case 'multiselect':
        const selectValidation = this.validateSelectField(value, validationConfig, fieldType === 'multiselect');
        this.mergeValidationResults(result, selectValidation);
        break;

      case 'percentage':
        const percentageValidation = this.validatePercentageField(value);
        this.mergeValidationResults(result, percentageValidation);
        break;

      case 'rating':
        const ratingValidation = this.validateRatingField(value, validationConfig);
        this.mergeValidationResults(result, ratingValidation);
        break;
    }

    return result;
  }

  private async validateFieldType(fieldType: string, value: any): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };
    
    if (value === null || value === undefined) {
      return result; // Null values are handled by required validation
    }

    switch (fieldType) {
      case 'string':
      case 'url':
      case 'email':
      case 'phone':
      case 'richtext':
      case 'location':
      case 'file':
      case 'select':
        if (typeof value !== 'string') {
          result.errors.push(`Expected string for ${fieldType}, got ${typeof value}`);
          result.isValid = false;
        }
        break;

      case 'number':
      case 'quantity':
      case 'money':
      case 'percentage':
      case 'rating':
        if (typeof value !== 'number' || isNaN(value)) {
          result.errors.push(`Expected number for ${fieldType}, got ${typeof value}`);
          result.isValid = false;
        }
        break;

      case 'boolean':
        if (typeof value !== 'boolean') {
          result.errors.push(`Expected boolean for ${fieldType}, got ${typeof value}`);
          result.isValid = false;
        }
        break;

      case 'date':
      case 'time':
        const dateValue = new Date(value);
        if (isNaN(dateValue.getTime())) {
          result.errors.push(`Invalid date format for ${fieldType}`);
          result.isValid = false;
        }
        break;

      case 'multiselect':
        if (!Array.isArray(value)) {
          result.errors.push(`Expected array for multiselect, got ${typeof value}`);
          result.isValid = false;
        }
        break;
    }

    return result;
  }

  private async validateRelationshipField(
    fieldKey: string,
    value: string,
    config: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };
    
    if (!value) return result;

    const entityType = config?.entityType;
    if (!entityType) {
      result.errors.push(`No entity type specified for relationship field ${fieldKey}`);
      result.isValid = false;
      return result;
    }

    let exists = false;

    try {
      switch (entityType) {
        case 'guest':
          const guest = await this.prisma.guest.findFirst({
            where: {
              id: value,
              propertyId: context.propertyId,
              deletedAt: null,
            },
          });
          exists = !!guest;
          break;

        case 'reservation':
          const reservation = await this.prisma.reservation.findFirst({
            where: {
              id: value,
              propertyId: context.propertyId,
            },
          });
          exists = !!reservation;
          break;

        case 'unit':
          const unit = await this.prisma.unit.findFirst({
            where: {
              id: value,
              propertyId: context.propertyId,
              isActive: true,
              deletedAt: null,
            },
          });
          exists = !!unit;
          break;

        case 'vendor':
          const vendor = await this.prisma.vendor.findFirst({
            where: {
              id: value,
              organizationId: context.organizationId,
              propertyId: context.propertyId,
              isActive: true,
            },
          });
          exists = !!vendor;
          break;

        case 'concierge_object':
          const object = await this.prisma.conciergeObject.findFirst({
            where: {
              id: value,
              organizationId: context.organizationId,
              propertyId: context.propertyId,
              deletedAt: null,
            },
          });
          exists = !!object;
          break;

        default:
          result.errors.push(`Unknown entity type: ${entityType}`);
          result.isValid = false;
          return result;
      }

      if (!exists) {
        result.errors.push(`${entityType} with ID ${value} not found`);
        result.isValid = false;
      }
    } catch (error) {
      result.errors.push(`Error validating ${entityType} relationship: ${error.message}`);
      result.isValid = false;
    }

    return result;
  }

  private validateQuantityField(value: number, config: any): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value < 0) {
      result.errors.push('Quantity cannot be negative');
      result.isValid = false;
    }

    if (config?.min !== undefined && value < config.min) {
      result.errors.push(`Quantity must be at least ${config.min}`);
      result.isValid = false;
    }

    if (config?.max !== undefined && value > config.max) {
      result.errors.push(`Quantity cannot exceed ${config.max}`);
      result.isValid = false;
    }

    if (config?.unit && typeof config.unit !== 'string') {
      result.warnings = result.warnings || [];
      result.warnings.push('Quantity unit should be specified');
    }

    return result;
  }

  private validateMoneyField(value: number, config: any): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value < 0 && !config?.allowNegative) {
      result.errors.push('Money amount cannot be negative');
      result.isValid = false;
    }

    const decimalPlaces = (value.toString().split('.')[1] || '').length;
    const maxDecimals = config?.maxDecimals || 4;
    
    if (decimalPlaces > maxDecimals) {
      result.errors.push(`Money amount cannot have more than ${maxDecimals} decimal places`);
      result.isValid = false;
    }

    if (config?.min !== undefined && value < config.min) {
      result.errors.push(`Amount must be at least ${config.min}`);
      result.isValid = false;
    }

    if (config?.max !== undefined && value > config.max) {
      result.errors.push(`Amount cannot exceed ${config.max}`);
      result.isValid = false;
    }

    return result;
  }

  private validateFileField(value: string, config: any): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Validate file key format (assuming S3/R2 key format)
    if (!/^[a-zA-Z0-9._/-]+$/.test(value)) {
      result.errors.push('Invalid file key format');
      result.isValid = false;
    }

    // Check allowed extensions if specified
    if (config?.allowedExtensions && Array.isArray(config.allowedExtensions)) {
      const extension = value.split('.').pop()?.toLowerCase();
      if (!extension || !config.allowedExtensions.includes(extension)) {
        result.errors.push(`File extension .${extension} is not allowed. Allowed: ${config.allowedExtensions.join(', ')}`);
        result.isValid = false;
      }
    }

    return result;
  }

  private validateUrlField(value: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    try {
      new URL(value);
    } catch {
      result.errors.push('Invalid URL format');
      result.isValid = false;
    }

    return result;
  }

  private validateEmailField(value: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      result.errors.push('Invalid email format');
      result.isValid = false;
    }

    return result;
  }

  private validatePhoneField(value: string): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Basic phone validation (can be enhanced for specific regions)
    const phoneRegex = /^[\+]?[\d\s\-\(\)\.]{7,20}$/;
    if (!phoneRegex.test(value)) {
      result.errors.push('Invalid phone number format');
      result.isValid = false;
    }

    return result;
  }

  private validateSelectField(value: any, config: any, isMultiSelect: boolean): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    const options = config?.options || [];
    
    if (isMultiSelect) {
      if (!Array.isArray(value)) {
        result.errors.push('Multiselect value must be an array');
        result.isValid = false;
        return result;
      }

      for (const option of value) {
        if (!options.includes(option)) {
          result.errors.push(`Invalid option: ${option}. Valid options: ${options.join(', ')}`);
          result.isValid = false;
        }
      }
    } else {
      if (!options.includes(value)) {
        result.errors.push(`Invalid option: ${value}. Valid options: ${options.join(', ')}`);
        result.isValid = false;
      }
    }

    return result;
  }

  private validatePercentageField(value: number): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (value < 0 || value > 100) {
      result.errors.push('Percentage must be between 0 and 100');
      result.isValid = false;
    }

    return result;
  }

  private validateRatingField(value: number, config: any): ValidationResult {
    const result: ValidationResult = { isValid: true, errors: [] };

    const min = config?.min || 1;
    const max = config?.max || 5;

    if (value < min || value > max) {
      result.errors.push(`Rating must be between ${min} and ${max}`);
      result.isValid = false;
    }

    return result;
  }

  private mergeValidationResults(target: ValidationResult, source: ValidationResult): void {
    target.errors.push(...source.errors);
    if (source.warnings) {
      target.warnings = target.warnings || [];
      target.warnings.push(...source.warnings);
    }
    if (!source.isValid) {
      target.isValid = false;
    }
  }

  /**
   * Cross-field validation for complex business rules
   */
  async validateCrossFieldRules(
    attributes: any[],
    objectType: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };
    
    const validationRules = objectType?.validations?.crossFieldRules || [];
    
    for (const rule of validationRules) {
      const ruleValidation = await this.evaluateCrossFieldRule(rule, attributes, context);
      this.mergeValidationResults(result, ruleValidation);
    }

    return result;
  }

  /**
   * Validate all attributes for an object with enhanced field types
   */
  async validateObjectAttributes(
    attributes: any[],
    objectType: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };
    
    if (!attributes || !Array.isArray(attributes)) {
      return result;
    }

    const schema = objectType?.fieldsSchema || {};
    const schemaFields = schema.fields || [];
    const fieldConfigMap = new Map(schemaFields.map((f: any) => [f.key, f]));

    // Validate each attribute
    for (const attribute of attributes) {
      const fieldConfig = fieldConfigMap.get(attribute.fieldKey);
      if (!fieldConfig) {
        result.errors.push(`Unknown field: ${attribute.fieldKey}`);
        result.isValid = false;
        continue;
      }

      const validation = await this.validateAttribute(
        attribute.fieldKey,
        attribute.fieldType,
        this.getAttributeValue(attribute),
        fieldConfig,
        context,
      );

      this.mergeValidationResults(result, validation);
    }

    // Check for missing required fields
    const requiredFields = schemaFields.filter((f: any) => f.required).map((f: any) => f.key);
    const providedFields = attributes.map(attr => attr.fieldKey);
    
    for (const requiredField of requiredFields) {
      if (!providedFields.includes(requiredField)) {
        result.errors.push(`Required field '${requiredField}' is missing`);
        result.isValid = false;
      }
    }

    // Perform cross-field validation
    const crossFieldValidation = await this.validateCrossFieldRules(attributes, objectType, context);
    this.mergeValidationResults(result, crossFieldValidation);

    return result;
  }

  /**
   * Validate quantity field with unit support
   */
  async validateQuantityWithUnit(
    quantity: number,
    unit: string,
    config: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Validate quantity value
    const quantityValidation = this.validateQuantityField(quantity, config);
    this.mergeValidationResults(result, quantityValidation);

    // Validate unit
    if (config.allowedUnits && Array.isArray(config.allowedUnits)) {
      if (!config.allowedUnits.includes(unit)) {
        result.errors.push(`Invalid unit '${unit}'. Allowed units: ${config.allowedUnits.join(', ')}`);
        result.isValid = false;
      }
    }

    // Unit conversion validation (if needed)
    if (config.baseUnit && config.conversions && unit !== config.baseUnit) {
      const conversionFactor = config.conversions[unit];
      if (!conversionFactor) {
        result.warnings = result.warnings || [];
        result.warnings.push(`No conversion factor defined for unit '${unit}' to base unit '${config.baseUnit}'`);
      }
    }

    return result;
  }

  /**
   * Validate money field with currency support
   */
  async validateMoneyWithCurrency(
    amount: number,
    currency: string,
    config: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };

    // Validate amount
    const moneyValidation = this.validateMoneyField(amount, config);
    this.mergeValidationResults(result, moneyValidation);

    // Validate currency code
    if (!/^[A-Z]{3}$/.test(currency)) {
      result.errors.push('Currency must be a valid 3-letter ISO code (e.g., USD, EUR)');
      result.isValid = false;
    }

    // Check allowed currencies
    if (config.allowedCurrencies && Array.isArray(config.allowedCurrencies)) {
      if (!config.allowedCurrencies.includes(currency)) {
        result.errors.push(`Currency '${currency}' not allowed. Allowed currencies: ${config.allowedCurrencies.join(', ')}`);
        result.isValid = false;
      }
    }

    // Currency exchange rate validation (if needed)
    if (config.baseCurrency && currency !== config.baseCurrency) {
      result.warnings = result.warnings || [];
      result.warnings.push(`Amount in ${currency} may need conversion to base currency ${config.baseCurrency}`);
    }

    return result;
  }

  /**
   * Validate location field (coordinates, address, etc.)
   */
  async validateLocationField(
    value: any,
    config: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (typeof value === 'string') {
      // Address format
      if (value.length < 5) {
        result.errors.push('Address must be at least 5 characters long');
        result.isValid = false;
      }
    } else if (typeof value === 'object' && value !== null) {
      // Coordinate format {lat, lng} or {latitude, longitude}
      const lat = value.lat || value.latitude;
      const lng = value.lng || value.longitude;
      
      if (typeof lat !== 'number' || typeof lng !== 'number') {
        result.errors.push('Location coordinates must have numeric lat/lng or latitude/longitude');
        result.isValid = false;
      } else {
        if (lat < -90 || lat > 90) {
          result.errors.push('Latitude must be between -90 and 90');
          result.isValid = false;
        }
        if (lng < -180 || lng > 180) {
          result.errors.push('Longitude must be between -180 and 180');
          result.isValid = false;
        }
      }
    } else {
      result.errors.push('Location must be a string (address) or object with coordinates');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate duration field (in various formats)
   */
  async validateDurationField(
    value: any,
    config: any,
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };

    if (typeof value === 'number') {
      // Duration in minutes/seconds/hours (based on config)
      const unit = config.unit || 'minutes';
      const min = config.min || 0;
      const max = config.max || (unit === 'hours' ? 24 : unit === 'minutes' ? 1440 : 86400);
      
      if (value < min) {
        result.errors.push(`Duration must be at least ${min} ${unit}`);
        result.isValid = false;
      }
      if (value > max) {
        result.errors.push(`Duration cannot exceed ${max} ${unit}`);
        result.isValid = false;
      }
    } else if (typeof value === 'string') {
      // ISO 8601 duration format (PT30M) or simple format (30m, 2h, etc.)
      if (value.startsWith('PT')) {
        // ISO 8601 format validation
        const iso8601Regex = /^PT(\d+H)?(\d+M)?(\d+S)?$/;
        if (!iso8601Regex.test(value)) {
          result.errors.push('Invalid ISO 8601 duration format (expected: PT1H30M or similar)');
          result.isValid = false;
        }
      } else {
        // Simple format validation (1h, 30m, 45s)
        const simpleRegex = /^\d+[hms]$/;
        if (!simpleRegex.test(value)) {
          result.errors.push('Invalid duration format (expected: 1h, 30m, 45s, etc.)');
          result.isValid = false;
        }
      }
    } else {
      result.errors.push('Duration must be a number or string');
      result.isValid = false;
    }

    return result;
  }

  /**
   * Get the actual value from an attribute based on its field type
   */
  private getAttributeValue(attribute: any): any {
    return (
      attribute.stringValue ||
      attribute.numberValue ||
      attribute.booleanValue ||
      attribute.dateValue ||
      attribute.relationshipValue ||
      attribute.selectValue ||
      attribute.fileValue ||
      attribute.moneyValue ||
      attribute.jsonValue
    );
  }

  private async evaluateCrossFieldRule(
    rule: any,
    attributes: any[],
    context: ValidationContext,
  ): Promise<ValidationResult> {
    const result: ValidationResult = { isValid: true, errors: [] };
    
    // This is a simplified implementation. In a real system, you might want
    // to use a rule engine or more sophisticated validation framework
    switch (rule.type) {
      case 'conditional_required':
        // If field A has value X, then field B is required
        const conditionField = attributes.find(a => a.fieldKey === rule.conditionField);
        const targetField = attributes.find(a => a.fieldKey === rule.targetField);
        
        if (conditionField && conditionField.stringValue === rule.conditionValue) {
          if (!targetField || !this.hasValue(targetField)) {
            result.errors.push(`Field '${rule.targetField}' is required when '${rule.conditionField}' is '${rule.conditionValue}'`);
            result.isValid = false;
          }
        }
        break;

      case 'mutex_fields':
        // Only one of the specified fields can have a value
        const mutexFields = rule.fields.filter((fieldKey: string) =>
          attributes.some(a => a.fieldKey === fieldKey && this.hasValue(a))
        );
        
        if (mutexFields.length > 1) {
          result.errors.push(`Only one of these fields can have a value: ${rule.fields.join(', ')}`);
          result.isValid = false;
        }
        break;
    }

    return result;
  }

  private hasValue(attribute: any): boolean {
    return !!(
      attribute.stringValue ||
      attribute.numberValue !== null ||
      attribute.booleanValue !== null ||
      attribute.dateValue ||
      attribute.jsonValue ||
      attribute.relationshipValue ||
      attribute.selectValue ||
      attribute.fileValue ||
      attribute.moneyValue !== null
    );
  }
}