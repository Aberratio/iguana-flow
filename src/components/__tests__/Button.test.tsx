import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { screen, fireEvent } from '@testing-library/dom';
import { Button } from '../ui/button';
import { createRef } from 'react';

describe('Button', () => {
  describe('rendering', () => {
    it('should render with default props', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toHaveTextContent('Click me');
    });

    it('should render children correctly', () => {
      render(
        <Button>
          <span data-testid="icon">🔥</span>
          Text
        </Button>
      );
      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveTextContent('Text');
    });
  });

  describe('interactions', () => {
    it('should handle click events', () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Click me</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', () => {
      const handleClick = vi.fn();
      render(<Button disabled onClick={handleClick}>Disabled</Button>);
      
      fireEvent.click(screen.getByRole('button'));
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('disabled state', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    it('should have disabled styling', () => {
      render(<Button disabled>Disabled</Button>);
      expect(screen.getByRole('button')).toHaveClass('disabled:opacity-50');
    });
  });

  describe('variants', () => {
    it('should apply destructive variant classes', () => {
      render(<Button variant="destructive">Delete</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-destructive');
    });

    it('should apply outline variant classes', () => {
      render(<Button variant="outline">Outline</Button>);
      expect(screen.getByRole('button')).toHaveClass('border');
    });

    it('should apply ghost variant classes', () => {
      render(<Button variant="ghost">Ghost</Button>);
      expect(screen.getByRole('button').className).toContain('hover:bg-white/5');
    });

    it('should apply secondary variant classes', () => {
      render(<Button variant="secondary">Secondary</Button>);
      expect(screen.getByRole('button')).toHaveClass('bg-secondary');
    });

    it('should apply link variant classes', () => {
      render(<Button variant="link">Link</Button>);
      expect(screen.getByRole('button')).toHaveClass('underline-offset-4');
    });
  });

  describe('sizes', () => {
    it('should apply small size classes', () => {
      render(<Button size="sm">Small</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-9');
    });

    it('should apply large size classes', () => {
      render(<Button size="lg">Large</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-11');
    });

    it('should apply icon size classes', () => {
      render(<Button size="icon">🔥</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10', 'w-10');
    });

    it('should apply default size classes', () => {
      render(<Button>Default</Button>);
      expect(screen.getByRole('button')).toHaveClass('h-10');
    });
  });

  describe('ref forwarding', () => {
    it('should forward ref correctly', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>With Ref</Button>);
      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
    });

    it('should allow focus via ref', () => {
      const ref = createRef<HTMLButtonElement>();
      render(<Button ref={ref}>Focusable</Button>);
      ref.current?.focus();
      expect(document.activeElement).toBe(ref.current);
    });
  });

  describe('asChild prop', () => {
    it('should render as child element when asChild is true', () => {
      render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );
      expect(screen.getByRole('link')).toHaveTextContent('Link Button');
      expect(screen.getByRole('link')).toHaveAttribute('href', '/test');
    });

    it('should apply button classes to child element', () => {
      render(
        <Button asChild variant="outline">
          <a href="/test">Styled Link</a>
        </Button>
      );
      expect(screen.getByRole('link')).toHaveClass('border');
    });
  });

  describe('custom className', () => {
    it('should merge custom className with default classes', () => {
      render(<Button className="custom-class">Custom</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
      expect(button).toHaveClass('inline-flex');
    });

    it('should allow overriding default styles', () => {
      render(<Button className="rounded-full">Rounded</Button>);
      expect(screen.getByRole('button')).toHaveClass('rounded-full');
    });
  });

  describe('accessibility', () => {
    it('should have correct role', () => {
      render(<Button>Accessible</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);
      expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();
    });

    it('should support aria-disabled', () => {
      render(<Button disabled aria-disabled="true">Disabled</Button>);
      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true');
    });
  });
});
