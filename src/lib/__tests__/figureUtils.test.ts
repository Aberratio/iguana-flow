import { describe, it, expect } from 'vitest';
import { getDifficultyLabel, getFigureTypeLabel, getDifficultyColorClass, getCategoryLabel } from '../figureUtils';

describe('getDifficultyLabel', () => {
  it('should return correct Polish labels for known difficulties', () => {
    expect(getDifficultyLabel('beginner')).toBe('Początkujący');
    expect(getDifficultyLabel('intermediate')).toBe('Średniozaawansowany');
    expect(getDifficultyLabel('advanced')).toBe('Zaawansowany');
  });

  it('should handle null gracefully', () => {
    expect(getDifficultyLabel(null)).toBe('');
  });

  it('should handle undefined gracefully', () => {
    expect(getDifficultyLabel(undefined)).toBe('');
  });

  it('should return key for unknown difficulty values', () => {
    expect(getDifficultyLabel('expert')).toBe('expert');
    expect(getDifficultyLabel('master')).toBe('master');
  });

  it('should handle empty string', () => {
    expect(getDifficultyLabel('')).toBe('');
  });
});

describe('getFigureTypeLabel', () => {
  it('should return correct Polish labels for known types', () => {
    expect(getFigureTypeLabel('static')).toBe('Statyczna');
    expect(getFigureTypeLabel('dynamic')).toBe('Dynamiczna');
    expect(getFigureTypeLabel('transition')).toBe('Przejście');
    expect(getFigureTypeLabel('spin')).toBe('Obrót');
  });

  it('should handle null gracefully', () => {
    expect(getFigureTypeLabel(null)).toBe('');
  });

  it('should handle undefined gracefully', () => {
    expect(getFigureTypeLabel(undefined)).toBe('');
  });

  it('should return key for unknown type values', () => {
    expect(getFigureTypeLabel('unknown')).toBe('unknown');
  });
});

describe('getDifficultyColorClass', () => {
  it('should return green class for beginner', () => {
    expect(getDifficultyColorClass('beginner')).toContain('green');
  });

  it('should return yellow class for intermediate', () => {
    expect(getDifficultyColorClass('intermediate')).toContain('yellow');
  });

  it('should return red class for advanced', () => {
    expect(getDifficultyColorClass('advanced')).toContain('red');
  });

  it('should return gray for null value', () => {
    expect(getDifficultyColorClass(null)).toContain('gray');
  });

  it('should return gray for undefined value', () => {
    expect(getDifficultyColorClass(undefined)).toContain('gray');
  });

  it('should return gray for unknown difficulty', () => {
    expect(getDifficultyColorClass('unknown')).toContain('gray');
  });

  it('should include opacity and border classes', () => {
    const result = getDifficultyColorClass('beginner');
    expect(result).toContain('bg-');
    expect(result).toContain('text-');
    expect(result).toContain('border-');
  });
});

describe('getCategoryLabel', () => {
  const mockCategories = [
    { id: '1', key_name: 'aerial-hoop', name: 'Aerial Hoop' },
    { id: '2', key_name: 'pole-dance', name: 'Pole Dance' },
    { id: '3', key_name: 'silks', name: 'Aerial Silks' }
  ];

  it('should return correct category name for known key', () => {
    expect(getCategoryLabel('aerial-hoop', mockCategories as any)).toBe('Aerial Hoop');
    expect(getCategoryLabel('pole-dance', mockCategories as any)).toBe('Pole Dance');
  });

  it('should return key for unknown category', () => {
    expect(getCategoryLabel('unknown-sport', mockCategories as any)).toBe('unknown-sport');
  });

  it('should handle null gracefully', () => {
    expect(getCategoryLabel(null, mockCategories as any)).toBe('');
  });

  it('should handle undefined gracefully', () => {
    expect(getCategoryLabel(undefined, mockCategories as any)).toBe('');
  });

  it('should handle empty categories array', () => {
    expect(getCategoryLabel('aerial-hoop', [])).toBe('aerial-hoop');
  });
});
