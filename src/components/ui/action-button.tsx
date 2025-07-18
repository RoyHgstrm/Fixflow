import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2, type LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const actionButtonVariants = cva(
  'transition-all duration-300 group relative overflow-hidden',
  {
    variants: {
      intent: {
        primary: 'gradient-primary shadow-glow hover:shadow-glow-lg',
        secondary: 'glass hover:bg-primary/5 border border-border/50',
        destructive: 'glass hover:bg-destructive/10 text-destructive border border-destructive/20',
        ghost: 'hover:bg-muted/50',
      },
      responsive: {
        desktop: 'hidden sm:flex',
        mobile: 'flex sm:hidden',
        both: 'flex',
      },
      size: {
        sm: 'h-8 px-3 text-sm',
        default: 'h-10 px-4',
        lg: 'h-12 px-6 text-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      intent: 'primary',
      responsive: 'both',
      size: 'default',
    },
  }
);

export interface ActionButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof actionButtonVariants> {
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;
  fullWidth?: boolean;
  tooltip?: string;
  mobileLabel?: string; // Different label for mobile
}

const ActionButton = React.forwardRef<HTMLButtonElement, ActionButtonProps>(
  ({
    className,
    intent,
    responsive,
    size,
    icon: Icon,
    iconPosition = 'left',
    loading = false,
    loadingText,
    fullWidth = false,
    tooltip,
    mobileLabel,
    children,
    disabled,
    ...props
  }, ref) => {
    const buttonContent = (
      <>
        {loading && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        )}
        <span className={cn(
          'transition-all duration-200',
          size === 'icon' && 'sr-only',
          Icon && !loading && iconPosition === 'left' && 'ml-2',
          Icon && !loading && iconPosition === 'right' && 'mr-2'
        )}>
          {loading && loadingText ? loadingText : children}
        </span>
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
        )}
      </>
    );

    return (
      <Button
        ref={ref}
        className={cn(
          actionButtonVariants({ intent, responsive, size }),
          fullWidth && 'w-full justify-center',
          loading && 'cursor-not-allowed',
          className
        )}
        disabled={disabled || loading}
        title={tooltip}
        {...props}
      >
        {/* Desktop content */}
        <span className={cn(
          'hidden sm:flex items-center gap-2',
          fullWidth && 'justify-center'
        )}>
          {buttonContent}
        </span>
        
        {/* Mobile content */}
        <span className={cn(
          'flex sm:hidden items-center gap-2',
          fullWidth && 'justify-center'
        )}>
          {!loading && Icon && iconPosition === 'left' && (
            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
          {loading && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          <span className={cn(
            size === 'icon' && 'sr-only'
          )}>
            {loading && loadingText 
              ? loadingText 
              : mobileLabel || children
            }
          </span>
          {!loading && Icon && iconPosition === 'right' && (
            <Icon className="h-4 w-4 group-hover:scale-110 transition-transform" />
          )}
        </span>
      </Button>
    );
  }
);

ActionButton.displayName = 'ActionButton';

// Preset action button components for common use cases
export const PrimaryActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ActionButtonProps, 'intent'>
>(({ ...props }, ref) => (
  <ActionButton ref={ref} intent="primary" {...props} />
));
PrimaryActionButton.displayName = "PrimaryActionButton";

export const SecondaryActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ActionButtonProps, 'intent'>
>(({ ...props }, ref) => (
  <ActionButton ref={ref} intent="secondary" {...props} />
));
SecondaryActionButton.displayName = "SecondaryActionButton";

export const DestructiveActionButton = React.forwardRef<
  HTMLButtonElement,
  Omit<ActionButtonProps, 'intent'>
>(({ ...props }, ref) => (
  <ActionButton ref={ref} intent="destructive" {...props} />
));
DestructiveActionButton.displayName = "DestructiveActionButton";

// Action button group for related actions
export interface ActionButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  responsive?: boolean;
}

export const ActionButtonGroup = React.forwardRef<HTMLDivElement, ActionButtonGroupProps>(
  ({ className, orientation = 'horizontal', spacing = 'normal', responsive = true, children, ...props }, ref) => {
    const spacingClasses = {
      tight: orientation === 'horizontal' ? 'gap-1' : 'gap-1',
      normal: orientation === 'horizontal' ? 'gap-2' : 'gap-2',
      loose: orientation === 'horizontal' ? 'gap-4' : 'gap-3',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          orientation === 'horizontal' ? 'flex-row' : 'flex-col',
          responsive && 'flex-col sm:flex-row',
          spacingClasses[spacing],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ActionButtonGroup.displayName = 'ActionButtonGroup';

export { ActionButton, actionButtonVariants }; 