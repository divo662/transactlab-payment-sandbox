import { logger } from '../../utils/helpers/logger';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface TimeInterval {
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

export interface DateFormatOptions {
  format?: 'short' | 'long' | 'iso' | 'custom';
  timezone?: string;
  locale?: string;
  customFormat?: string;
}

/**
 * Date Service
 * Handles date/time utilities and formatting
 */
export class DateService {
  /**
   * Get current date/time
   */
  static now(): Date {
    return new Date();
  }

  /**
   * Get current timestamp
   */
  static timestamp(): number {
    return Date.now();
  }

  /**
   * Format date
   */
  static formatDate(date: Date, options: DateFormatOptions = {}): string {
    try {
      const { format = 'iso', timezone = 'UTC', locale = 'en-US', customFormat } = options;

      switch (format) {
        case 'short':
          return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
          });

        case 'long':
          return date.toLocaleDateString(locale, {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'long'
          });

        case 'iso':
          return date.toISOString();

        case 'custom':
          if (!customFormat) {
            throw new Error('Custom format is required when format is set to custom');
          }
          return this.formatCustomDate(date, customFormat);

        default:
          return date.toISOString();
      }
    } catch (error) {
      logger.error('Failed to format date', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        options
      });
      return date.toISOString();
    }
  }

  /**
   * Format custom date
   */
  static formatCustomDate(date: Date, format: string): string {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return format
        .replace('YYYY', String(year))
        .replace('MM', month)
        .replace('DD', day)
        .replace('HH', hours)
        .replace('mm', minutes)
        .replace('ss', seconds);
    } catch (error) {
      logger.error('Failed to format custom date', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        format
      });
      return date.toISOString();
    }
  }

  /**
   * Parse date string
   */
  static parseDate(dateString: string): Date | null {
    try {
      const date = new Date(dateString);
      return isNaN(date.getTime()) ? null : date;
    } catch (error) {
      logger.error('Failed to parse date', {
        error: error instanceof Error ? error.message : 'Unknown error',
        dateString
      });
      return null;
    }
  }

  /**
   * Add time to date
   */
  static addTime(date: Date, interval: TimeInterval): Date {
    try {
      const newDate = new Date(date);

      if (interval.days) {
        newDate.setDate(newDate.getDate() + interval.days);
      }

      if (interval.hours) {
        newDate.setHours(newDate.getHours() + interval.hours);
      }

      if (interval.minutes) {
        newDate.setMinutes(newDate.getMinutes() + interval.minutes);
      }

      if (interval.seconds) {
        newDate.setSeconds(newDate.getSeconds() + interval.seconds);
      }

      return newDate;
    } catch (error) {
      logger.error('Failed to add time to date', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        interval
      });
      return date;
    }
  }

  /**
   * Subtract time from date
   */
  static subtractTime(date: Date, interval: TimeInterval): Date {
    try {
      const newDate = new Date(date);

      if (interval.days) {
        newDate.setDate(newDate.getDate() - interval.days);
      }

      if (interval.hours) {
        newDate.setHours(newDate.getHours() - interval.hours);
      }

      if (interval.minutes) {
        newDate.setMinutes(newDate.getMinutes() - interval.minutes);
      }

      if (interval.seconds) {
        newDate.setSeconds(newDate.getSeconds() - interval.seconds);
      }

      return newDate;
    } catch (error) {
      logger.error('Failed to subtract time from date', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date,
        interval
      });
      return date;
    }
  }

  /**
   * Get date difference
   */
  static getDateDifference(date1: Date, date2: Date): TimeInterval {
    try {
      const diffMs = Math.abs(date2.getTime() - date1.getTime());
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      return {
        days: diffDays,
        hours: diffHours,
        minutes: diffMinutes,
        seconds: diffSeconds
      };
    } catch (error) {
      logger.error('Failed to get date difference', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date1,
        date2
      });
      return {};
    }
  }

  /**
   * Check if date is in the past
   */
  static isPast(date: Date): boolean {
    return date < this.now();
  }

  /**
   * Check if date is in the future
   */
  static isFuture(date: Date): boolean {
    return date > this.now();
  }

  /**
   * Check if date is today
   */
  static isToday(date: Date): boolean {
    const today = this.now();
    return date.toDateString() === today.toDateString();
  }

  /**
   * Check if date is yesterday
   */
  static isYesterday(date: Date): boolean {
    const yesterday = this.subtractTime(this.now(), { days: 1 });
    return date.toDateString() === yesterday.toDateString();
  }

  /**
   * Check if date is this week
   */
  static isThisWeek(date: Date): boolean {
    const today = this.now();
    const startOfWeek = this.getStartOfWeek(today);
    const endOfWeek = this.getEndOfWeek(today);
    return date >= startOfWeek && date <= endOfWeek;
  }

  /**
   * Check if date is this month
   */
  static isThisMonth(date: Date): boolean {
    const today = this.now();
    return date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }

  /**
   * Check if date is this year
   */
  static isThisYear(date: Date): boolean {
    const today = this.now();
    return date.getFullYear() === today.getFullYear();
  }

  /**
   * Get start of day
   */
  static getStartOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get end of day
   */
  static getEndOfDay(date: Date): Date {
    const newDate = new Date(date);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Get start of week
   */
  static getStartOfWeek(date: Date): Date {
    const newDate = new Date(date);
    const day = newDate.getDay();
    const diff = newDate.getDate() - day + (day === 0 ? -6 : 1);
    newDate.setDate(diff);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get end of week
   */
  static getEndOfWeek(date: Date): Date {
    const startOfWeek = this.getStartOfWeek(date);
    return this.addTime(startOfWeek, { days: 6 });
  }

  /**
   * Get start of month
   */
  static getStartOfMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setDate(1);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get end of month
   */
  static getEndOfMonth(date: Date): Date {
    const newDate = new Date(date);
    newDate.setMonth(newDate.getMonth() + 1, 0);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Get start of year
   */
  static getStartOfYear(date: Date): Date {
    const newDate = new Date(date);
    newDate.setMonth(0, 1);
    newDate.setHours(0, 0, 0, 0);
    return newDate;
  }

  /**
   * Get end of year
   */
  static getEndOfYear(date: Date): Date {
    const newDate = new Date(date);
    newDate.setMonth(11, 31);
    newDate.setHours(23, 59, 59, 999);
    return newDate;
  }

  /**
   * Get relative time string
   */
  static getRelativeTime(date: Date): string {
    try {
      const now = this.now();
      const diff = this.getDateDifference(date, now);

      if (diff.days && diff.days > 0) {
        return diff.days === 1 ? 'yesterday' : `${diff.days} days ago`;
      }

      if (diff.hours && diff.hours > 0) {
        return diff.hours === 1 ? '1 hour ago' : `${diff.hours} hours ago`;
      }

      if (diff.minutes && diff.minutes > 0) {
        return diff.minutes === 1 ? '1 minute ago' : `${diff.minutes} minutes ago`;
      }

      if (diff.seconds && diff.seconds > 0) {
        return diff.seconds < 30 ? 'just now' : `${diff.seconds} seconds ago`;
      }

      return 'just now';
    } catch (error) {
      logger.error('Failed to get relative time', {
        error: error instanceof Error ? error.message : 'Unknown error',
        date
      });
      return 'unknown';
    }
  }

  /**
   * Get date range for period
   */
  static getDateRange(period: 'today' | 'yesterday' | 'this_week' | 'last_week' | 'this_month' | 'last_month' | 'this_year' | 'last_year'): DateRange {
    const now = this.now();

    switch (period) {
      case 'today':
        return {
          start: this.getStartOfDay(now),
          end: this.getEndOfDay(now)
        };

      case 'yesterday':
        const yesterday = this.subtractTime(now, { days: 1 });
        return {
          start: this.getStartOfDay(yesterday),
          end: this.getEndOfDay(yesterday)
        };

      case 'this_week':
        return {
          start: this.getStartOfWeek(now),
          end: this.getEndOfWeek(now)
        };

      case 'last_week':
        const lastWeek = this.subtractTime(now, { days: 7 });
        return {
          start: this.getStartOfWeek(lastWeek),
          end: this.getEndOfWeek(lastWeek)
        };

      case 'this_month':
        return {
          start: this.getStartOfMonth(now),
          end: this.getEndOfMonth(now)
        };

      case 'last_month':
        const lastMonth = this.subtractTime(now, { days: 30 });
        return {
          start: this.getStartOfMonth(lastMonth),
          end: this.getEndOfMonth(lastMonth)
        };

      case 'this_year':
        return {
          start: this.getStartOfYear(now),
          end: this.getEndOfYear(now)
        };

      case 'last_year':
        const lastYear = this.subtractTime(now, { days: 365 });
        return {
          start: this.getStartOfYear(lastYear),
          end: this.getEndOfYear(lastYear)
        };

      default:
        return {
          start: this.getStartOfDay(now),
          end: this.getEndOfDay(now)
        };
    }
  }

  /**
   * Check if date is expired
   */
  static isExpired(date: Date): boolean {
    return this.isPast(date);
  }

  /**
   * Get expiration time
   */
  static getExpirationTime(minutes: number = 30): Date {
    return this.addTime(this.now(), { minutes });
  }

  /**
   * Check if date is within range
   */
  static isWithinRange(date: Date, start: Date, end: Date): boolean {
    return date >= start && date <= end;
  }

  /**
   * Get timezone offset
   */
  static getTimezoneOffset(): number {
    return new Date().getTimezoneOffset();
  }

  /**
   * Convert to UTC
   */
  static toUTC(date: Date): Date {
    return new Date(date.getTime() + (date.getTimezoneOffset() * 60000));
  }

  /**
   * Convert from UTC
   */
  static fromUTC(date: Date): Date {
    return new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  }
}

export default DateService; 