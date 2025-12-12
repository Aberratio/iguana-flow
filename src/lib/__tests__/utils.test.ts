import { describe, it, expect } from 'vitest';
import { cn, isDayLocked } from '../utils';

describe('cn - class name merger', () => {
  it('should merge class names correctly', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('should handle conditional classes', () => {
    expect(cn('foo', false && 'bar', 'baz')).toBe('foo baz');
  });

  it('should resolve Tailwind conflicts - last class wins', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });

  it('should handle empty inputs', () => {
    expect(cn()).toBe('');
  });

  it('should handle undefined and null values', () => {
    expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
  });

  it('should handle arrays of classes', () => {
    expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
  });

  it('should handle objects with conditional classes', () => {
    expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
  });
});

describe('isDayLocked - challenge day locking logic', () => {
  const createDay = (dayNumber: number, status: string, daysFromNow = 0) => {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return {
      day_number: dayNumber,
      status,
      calendar_date: date.toISOString().split('T')[0]
    };
  };

  describe('basic locking rules', () => {
    it('should never lock day 1', () => {
      expect(isDayLocked(1, [])).toBe(false);
      expect(isDayLocked(1, [createDay(1, 'pending')])).toBe(false);
    });

    it('should unlock day 2 when day 1 is completed', () => {
      const days = [
        createDay(1, 'completed', -1),
        createDay(2, 'pending', 0)
      ];
      expect(isDayLocked(2, days)).toBe(false);
    });

    it('should lock day when previous is not completed', () => {
      const days = [
        createDay(1, 'pending', -1),
        createDay(2, 'pending', 0)
      ];
      expect(isDayLocked(2, days)).toBe(true);
    });

    it('should lock day 3 when day 2 is not completed', () => {
      const days = [
        createDay(1, 'completed', -2),
        createDay(2, 'pending', -1),
        createDay(3, 'pending', 0)
      ];
      expect(isDayLocked(3, days)).toBe(true);
    });
  });

  describe('admin access', () => {
    it('should allow admin to access any day regardless of status', () => {
      const days = [createDay(1, 'pending', -1)];
      expect(isDayLocked(5, days, true)).toBe(false);
      expect(isDayLocked(10, days, true)).toBe(false);
    });

    it('should allow admin to access future days', () => {
      const days = [createDay(1, 'completed', -1), createDay(2, 'pending', 5)];
      expect(isDayLocked(2, days, true)).toBe(false);
    });
  });

  describe('rest days', () => {
    it('should treat rest day as completed for unlocking next day', () => {
      const days = [
        createDay(1, 'rest', -1),
        createDay(2, 'pending', 0)
      ];
      expect(isDayLocked(2, days)).toBe(false);
    });

    it('should unlock day after rest day in middle of challenge', () => {
      const days = [
        createDay(1, 'completed', -3),
        createDay(2, 'completed', -2),
        createDay(3, 'rest', -1),
        createDay(4, 'pending', 0)
      ];
      expect(isDayLocked(4, days)).toBe(false);
    });
  });

  describe('date-based locking', () => {
    it('should lock future dates even if previous day is completed', () => {
      const days = [
        createDay(1, 'completed', -1),
        createDay(2, 'pending', 5) // 5 days in the future
      ];
      expect(isDayLocked(2, days)).toBe(true);
    });

    it('should unlock past dates when previous day is completed', () => {
      const days = [
        createDay(1, 'completed', -5),
        createDay(2, 'pending', -3)
      ];
      expect(isDayLocked(2, days)).toBe(false);
    });

    it('should unlock today when previous day is completed', () => {
      const days = [
        createDay(1, 'completed', -1),
        createDay(2, 'pending', 0) // today
      ];
      expect(isDayLocked(2, days)).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle empty calendar days', () => {
      expect(isDayLocked(2, [])).toBe(true);
    });

    it('should handle missing previous day', () => {
      const days = [createDay(3, 'pending', 0)];
      expect(isDayLocked(3, days)).toBe(true);
    });

    it('should handle day without calendar_date', () => {
      const days = [
        { day_number: 1, status: 'completed' },
        { day_number: 2, status: 'pending' }
      ];
      expect(isDayLocked(2, days)).toBe(false);
    });
  });
});
