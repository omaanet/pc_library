/**
 * Input validation and sanitization utilities
 * Provides comprehensive validation and sanitization for API inputs
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedValue?: any;
}

/**
 * Validation rule interface for configurable validation
 */
export interface ValidationRule {
  type: 'string' | 'number' | 'boolean' | 'date' | 'url' | 'email';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  sanitize?: boolean;
  customValidator?: (value: any) => boolean;
}

/**
 * Sanitizes string input to prevent XSS and injection attacks
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    // Remove potential HTML/script tags
    .replace(/<[^>]*>/g, '')
    // Remove script tags and their content
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    // Remove javascript: URLs
    .replace(/javascript:/gi, '')
    // Remove data: URLs that could contain scripts
    .replace(/data:(text\/html|application\/javascript)[^;]/gi, '')
    // Escape special characters
    .replace(/[<>]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;'
      };
      return escapeMap[match] || match;
    });
}

/**
 * Validates string input based on provided rules
 */
export function validateString(value: any, rules: ValidationRule): ValidationResult {
  const errors: string[] = [];

  // Type check
  if (typeof value !== 'string' && !(rules.required === false && value === undefined)) {
    errors.push('Value must be a string');
    return { isValid: false, errors };
  }

  // Required check
  if (rules.required && (value === undefined || value === null || value === '')) {
    errors.push('Value is required');
    return { isValid: false, errors };
  }

  // Skip further validation if value is not provided and not required
  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }

  // Length validation
  if (rules.minLength && value.length < rules.minLength) {
    errors.push(`Value must be at least ${rules.minLength} characters long`);
  }

  if (rules.maxLength && value.length > rules.maxLength) {
    errors.push(`Value must not exceed ${rules.maxLength} characters`);
  }

  // Pattern validation
  if (rules.pattern && !rules.pattern.test(value)) {
    errors.push('Value does not match required format');
  }

  // Custom validation
  if (rules.customValidator && !rules.customValidator(value)) {
    errors.push('Value failed custom validation');
  }

  // Sanitize if requested
  const sanitizedValue = rules.sanitize ? sanitizeString(value) : value;

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
}

/**
 * Validates number input
 */
export function validateNumber(value: any, rules: Omit<ValidationRule, 'type'>): ValidationResult {
  const errors: string[] = [];

  // Type check
  if (rules.required && (value === undefined || value === null)) {
    errors.push('Value is required');
    return { isValid: false, errors };
  }

  if (value !== undefined && value !== null && typeof value !== 'number') {
    errors.push('Value must be a number');
    return { isValid: false, errors };
  }

  // Skip further validation if value is not provided and not required
  if (value === undefined || value === null) {
    return { isValid: true, errors: [], sanitizedValue: null };
  }

  // Custom validation for numbers
  if (rules.customValidator && !rules.customValidator(value)) {
    errors.push('Value failed custom validation');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: value
  };
}

/**
 * Validates boolean input
 */
export function validateBoolean(value: any, rules: Omit<ValidationRule, 'type'>): ValidationResult {
  const errors: string[] = [];

  // Type check
  if (rules.required && (value === undefined || value === null)) {
    errors.push('Value is required');
    return { isValid: false, errors };
  }

  if (value !== undefined && value !== null && typeof value !== 'boolean') {
    errors.push('Value must be a boolean');
    return { isValid: false, errors };
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: value
  };
}

/**
 * Validates URL input
 */
export function validateUrl(value: any): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }

  if (typeof value !== 'string') {
    errors.push('URL must be a string');
    return { isValid: false, errors };
  }

  try {
    const url = new URL(value);

    // Only allow http/https protocols
    if (!['http:', 'https:'].includes(url.protocol)) {
      errors.push('URL must use HTTP or HTTPS protocol');
    }

    // Basic sanitization - remove dangerous characters
    const sanitizedValue = sanitizeString(value);

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedValue
    };
  } catch {
    errors.push('Invalid URL format');
    return { isValid: false, errors };
  }
}

/**
 * Validates email input
 */
export function validateEmail(value: any): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }

  if (typeof value !== 'string') {
    errors.push('Email must be a string');
    return { isValid: false, errors };
  }

  // RFC 5322 compliant email regex (simplified but robust)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(value)) {
    errors.push('Invalid email format');
  }

  const sanitizedValue = sanitizeString(value).toLowerCase();

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue
  };
}

/**
 * Validates date string input
 */
export function validateDate(value: any): ValidationResult {
  const errors: string[] = [];

  if (value === undefined || value === null || value === '') {
    return { isValid: true, errors: [], sanitizedValue: '' };
  }

  if (typeof value !== 'string') {
    errors.push('Date must be a string');
    return { isValid: false, errors };
  }

  // Check if it's a valid date
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    errors.push('Invalid date format');
  }

  return {
    isValid: errors.length === 0,
    errors,
    sanitizedValue: value
  };
}

/**
 * Comprehensive input validator that applies multiple validation rules
 */
export function validateInput(value: any, rules: ValidationRule): ValidationResult {
  switch (rules.type) {
    case 'string':
      return validateString(value, rules);
    case 'number':
      return validateNumber(value, rules);
    case 'boolean':
      return validateBoolean(value, rules);
    case 'url':
      return validateUrl(value);
    case 'email':
      return validateEmail(value);
    case 'date':
      return validateDate(value);
    default:
      return { isValid: false, errors: ['Unknown validation type'] };
  }
}

/**
 * Validates an entire object against a schema
 */
export function validateObject(data: any, schema: Record<string, ValidationRule>): {
  isValid: boolean;
  errors: Record<string, string[]>;
  sanitizedData: any;
} {
  const errors: Record<string, string[]> = {};
  const sanitizedData: any = {};
  let isValid = true;

  for (const [field, rules] of Object.entries(schema)) {
    const result = validateInput(data[field], rules);

    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }

    sanitizedData[field] = result.sanitizedValue;
  }

  return { isValid, errors, sanitizedData };
}
