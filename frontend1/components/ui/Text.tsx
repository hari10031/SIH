import * as React from 'react';
import { Text as RNText } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const textVariants = cva('text-base text-foreground', {
  variants: {
    variant: {
      default: 'text-foreground',
      muted: 'text-muted-foreground',
      destructive: 'text-destructive',
      primary: 'text-primary',
      secondary: 'text-secondary-foreground',
    },
    size: {
      default: 'text-base native:text-base',
      sm: 'text-sm native:text-sm',
      lg: 'text-lg native:text-lg',
      xl: 'text-xl native:text-xl',
      '2xl': 'text-2xl native:text-2xl',
      '3xl': 'text-3xl native:text-3xl',
    },
    weight: {
      normal: 'font-normal',
      medium: 'font-medium',
      semibold: 'font-semibold',
      bold: 'font-bold',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'default',
    weight: 'normal',
  },
});

type TextProps = React.ComponentPropsWithoutRef<typeof RNText> &
  VariantProps<typeof textVariants>;

const Text = React.forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  ({ className, variant, size, weight, ...props }, ref) => {
    return (
      <RNText
        className={cn(textVariants({ variant, size, weight }), className)}
        ref={ref}
        {...props}
      />
    );
  }
);
Text.displayName = 'Text';

export { Text, textVariants };
export type { TextProps };