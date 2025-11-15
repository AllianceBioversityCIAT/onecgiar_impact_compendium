/**
 * Email validation utilities to prevent case sensitivity issues
 */

export interface EmailValidationResult {
  isValid: boolean;
  normalizedEmail: string;
  warnings: string[];
  errors: string[];
}

export class EmailValidator {
  /**
   * Normalize email to lowercase and trim whitespace
   */
  static normalize(email: string): string {
    return email.toLowerCase().trim();
  }

  /**
   * Validate and normalize email with detailed feedback
   */
  static validate(email: string): EmailValidationResult {
    const result: EmailValidationResult = {
      isValid: true,
      normalizedEmail: '',
      warnings: [],
      errors: [],
    };

    // Basic validation
    if (!email) {
      result.isValid = false;
      result.errors.push('Email is required');
      return result;
    }

    // Normalize email
    const normalizedEmail = this.normalize(email);
    result.normalizedEmail = normalizedEmail;

    // Check email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      result.isValid = false;
      result.errors.push('Invalid email format');
      return result;
    }

    // Check for case sensitivity issues
    if (email !== normalizedEmail) {
      if (email.includes(' ')) {
        result.warnings.push('Email contained spaces that were removed');
      }

      const hasUpperCase = /[A-Z]/.test(email);
      if (hasUpperCase) {
        result.warnings.push(
          'Email was converted to lowercase for consistency'
        );
      }
    }

    // Check for common domain issues
    const domain = normalizedEmail.split('@')[1];
    if (domain && domain.includes('..')) {
      result.isValid = false;
      result.errors.push('Invalid domain format (consecutive dots)');
    }

    return result;
  }

  /**
   * Check if email has potential case sensitivity issues
   */
  static hasCaseIssues(email: string): boolean {
    const normalized = this.normalize(email);
    return email !== normalized;
  }

  /**
   * Get warning message for case sensitivity issues
   */
  static getCaseWarning(email: string): string | null {
    if (!this.hasCaseIssues(email)) {
      return null;
    }

    const hasUpperCase = /[A-Z]/.test(email);
    const hasSpaces = email.includes(' ');

    if (hasUpperCase && hasSpaces) {
      return 'Email will be normalized: uppercase converted to lowercase and spaces removed';
    } else if (hasUpperCase) {
      return 'Email will be converted to lowercase for consistency';
    } else if (hasSpaces) {
      return 'Spaces will be removed from email';
    }

    return 'Email will be normalized for consistency';
  }
}
