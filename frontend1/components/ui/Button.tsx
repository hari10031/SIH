import * as React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const buttonVariants = cva(
  'group flex items-center justify-center rounded-md web:ring-offset-background web:transition-colors web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-ring web:focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-zinc-900 web:hover:bg-zinc-800 active:bg-zinc-800',
        destructive:
          'bg-red-600 web:hover:bg-red-700 active:bg-red-700',
        outline:
          'border border-zinc-200 bg-white web:hover:bg-zinc-100 active:bg-zinc-100',
        secondary:
          'bg-zinc-100 web:hover:bg-zinc-200 active:bg-zinc-200',
        ghost: 'web:hover:bg-zinc-100 active:bg-zinc-100',
        link: 'web:underline-offset-4 web:hover:underline web:focus:underline',
      },
      size: {
        default: 'h-10 px-4 py-2 native:h-12 native:px-5 native:py-3',
        sm: 'h-9 rounded-md px-3 native:h-10 native:px-4',
        lg: 'h-11 rounded-md px-8 native:h-14',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

const buttonTextVariants = cva(
  'web:whitespace-nowrap text-sm font-medium web:transition-colors',
  {
    variants: {
      variant: {
        default: 'text-white',
        destructive: 'text-white',
        outline: 'text-zinc-900',
        secondary: 'text-zinc-900',
        ghost: 'text-zinc-900',
        link: 'text-zinc-900 group-active:underline',
      },
      size: {
        default: 'text-base',
        sm: 'text-sm',
        lg: 'native:text-lg text-base',
        icon: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

type ButtonProps = React.ComponentPropsWithoutRef<typeof TouchableOpacity> &
  VariantProps<typeof buttonVariants> & {
    children?: React.ReactNode;
    title?: string;
    loading?: boolean;
  };

const Button = React.forwardRef<
  React.ElementRef<typeof TouchableOpacity>,
  ButtonProps
>(({ className, variant, size, children, disabled, title, loading, ...props }, ref) => {
  const content = children || (
    <>
      {loading ? (
        <ActivityIndicator 
          size="small" 
          color={variant === 'default' || variant === 'destructive' ? 'white' : '#18181b'} 
        />
      ) : (
        <Text className={cn(buttonTextVariants({ variant, size }))}>
          {title}
        </Text>
      )}
    </>
  );

  return (
    <TouchableOpacity
      className={cn(
        buttonVariants({ variant, size }),
        (disabled || loading) && 'opacity-50',
        className
      )}
      ref={ref}
      role='button'
      disabled={disabled || loading}
      {...props}
    >
      {content}
    </TouchableOpacity>
  );
});
Button.displayName = 'Button';

export { Button, buttonVariants, buttonTextVariants };
export type { ButtonProps };