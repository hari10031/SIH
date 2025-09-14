import * as React from 'react';
import { Text } from 'react-native';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

const labelVariants = cva(
  'text-sm font-medium leading-none text-zinc-950 native:text-base peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
);

type LabelProps = React.ComponentPropsWithoutRef<typeof Text> &
  VariantProps<typeof labelVariants>;

const Label = React.forwardRef<React.ElementRef<typeof Text>, LabelProps>(
  ({ className, ...props }, ref) => (
    <Text ref={ref} className={cn(labelVariants(), className)} {...props} />
  )
);
Label.displayName = 'Label';

export { Label };