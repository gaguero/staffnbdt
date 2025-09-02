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