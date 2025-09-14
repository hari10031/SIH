import * as React from 'react';
import { TextInput, View, Text } from 'react-native';
import { cn } from '../../lib/utils';

export interface InputProps extends React.ComponentPropsWithoutRef<typeof TextInput> {
  label?: string;
  placeholder?: string;
  error?: string;
  className?: string;
}

const Input = React.forwardRef<React.ElementRef<typeof TextInput>, InputProps>(
  ({ className, label, error, ...props }, ref) => {
    return (
      <View className="w-full">
        {label && (
          <Text className="text-sm font-medium leading-none text-zinc-950 mb-2 native:text-base">
            {label}
          </Text>
        )}
        <TextInput
          ref={ref}
          className={cn(
            'web:flex h-10 native:h-12 w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm native:text-base web:ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-zinc-500 web:focus-visible:outline-none web:focus-visible:ring-2 web:focus-visible:ring-zinc-950 web:focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            error && 'border-red-500 web:focus-visible:ring-red-500',
            className
          )}
          placeholderTextColor="#71717a"
          {...props}
        />
        {error && (
          <Text className="text-sm text-red-500 mt-1 native:text-base">{error}</Text>
        )}
      </View>
    );
  }
);
Input.displayName = 'Input';

export { Input };