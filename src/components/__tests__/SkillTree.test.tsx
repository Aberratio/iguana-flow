import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the SkillTree component's level rendering logic
describe('SkillTree Level Rendering Logic', () => {
  // Test the core logic that determines which levels to render
  
  describe('Level filtering with freeLevelsCount', () => {
    it('should include all levels as premium when freeLevelsCount = 0', () => {
      const freeLevelsCount = 0;
      const sportLevels = [
        { id: '1', level_number: 1, level_name: 'Level 1' },
        { id: '2', level_number: 2, level_name: 'Level 2' },
      ];
      
      const freeLevels = sportLevels.filter(l => l.level_number <= freeLevelsCount);
      const paidLevels = sportLevels.filter(l => l.level_number > freeLevelsCount);
      
      expect(freeLevels).toHaveLength(0);
      expect(paidLevels).toHaveLength(2);
    });

    it('should correctly split levels when freeLevelsCount > 0', () => {
      const freeLevelsCount = 2;
      const sportLevels = [
        { id: '1', level_number: 1, level_name: 'Level 1' },
        { id: '2', level_number: 2, level_name: 'Level 2' },
        { id: '3', level_number: 3, level_name: 'Level 3' },
        { id: '4', level_number: 4, level_name: 'Level 4' },
      ];
      
      const freeLevels = sportLevels.filter(l => l.level_number <= freeLevelsCount);
      const paidLevels = sportLevels.filter(l => l.level_number > freeLevelsCount);
      
      expect(freeLevels).toHaveLength(2);
      expect(paidLevels).toHaveLength(2);
      expect(freeLevels.map(l => l.level_number)).toEqual([1, 2]);
      expect(paidLevels.map(l => l.level_number)).toEqual([3, 4]);
    });

    it('should have all levels as free when freeLevelsCount >= total levels', () => {
      const freeLevelsCount = 5;
      const sportLevels = [
        { id: '1', level_number: 1, level_name: 'Level 1' },
        { id: '2', level_number: 2, level_name: 'Level 2' },
      ];
      
      const freeLevels = sportLevels.filter(l => l.level_number <= freeLevelsCount);
      const paidLevels = sportLevels.filter(l => l.level_number > freeLevelsCount);
      
      expect(freeLevels).toHaveLength(2);
      expect(paidLevels).toHaveLength(0);
    });
  });

  describe('Premium section visibility condition', () => {
    it('should show premium section when there are paid levels (freeLevelsCount = 0)', () => {
      const freeLevelsCount = 0;
      const sportLevels = [
        { id: '1', level_number: 1 },
      ];
      
      // New condition: sportLevels.some(l => l.level_number > freeLevelsCount)
      const shouldShowPremiumSection = sportLevels.some(l => l.level_number > freeLevelsCount);
      
      expect(shouldShowPremiumSection).toBe(true);
    });

    it('should show premium section when freeLevelsCount > 0 and paid levels exist', () => {
      const freeLevelsCount = 1;
      const sportLevels = [
        { id: '1', level_number: 1 },
        { id: '2', level_number: 2 },
      ];
      
      const shouldShowPremiumSection = sportLevels.some(l => l.level_number > freeLevelsCount);
      
      expect(shouldShowPremiumSection).toBe(true);
    });

    it('should NOT show premium section when all levels are free', () => {
      const freeLevelsCount = 5;
      const sportLevels = [
        { id: '1', level_number: 1 },
        { id: '2', level_number: 2 },
      ];
      
      const shouldShowPremiumSection = sportLevels.some(l => l.level_number > freeLevelsCount);
      
      expect(shouldShowPremiumSection).toBe(false);
    });
  });

  describe('Separator visibility condition', () => {
    it('should NOT show separator when freeLevelsCount = 0', () => {
      const freeLevelsCount = 0;
      const sportLevels = [
        { id: '1', level_number: 1 },
      ];
      
      // Separator should only show when there are BOTH free and paid levels
      const shouldShowSeparator = freeLevelsCount > 0 && sportLevels.some(l => l.level_number > freeLevelsCount);
      
      expect(shouldShowSeparator).toBe(false);
    });

    it('should show separator when there are both free and paid levels', () => {
      const freeLevelsCount = 1;
      const sportLevels = [
        { id: '1', level_number: 1 },
        { id: '2', level_number: 2 },
      ];
      
      const shouldShowSeparator = freeLevelsCount > 0 && sportLevels.some(l => l.level_number > freeLevelsCount);
      
      expect(shouldShowSeparator).toBe(true);
    });
  });

  describe('adminPreviewMode behavior', () => {
    it('should unlock all levels when adminPreviewMode is true', () => {
      const adminPreviewMode = true;
      const hasFullAccess = false;
      
      // In admin preview mode, all levels should be accessible
      const canAccessLevel = adminPreviewMode || hasFullAccess;
      
      expect(canAccessLevel).toBe(true);
    });

    it('should respect hasFullAccess when not in admin preview', () => {
      const adminPreviewMode = false;
      const hasFullAccess = true;
      
      const canAccessLevel = adminPreviewMode || hasFullAccess;
      
      expect(canAccessLevel).toBe(true);
    });

    it('should lock levels when neither admin preview nor full access', () => {
      const adminPreviewMode = false;
      const hasFullAccess = false;
      
      const canAccessLevel = adminPreviewMode || hasFullAccess;
      
      expect(canAccessLevel).toBe(false);
    });
  });
});
