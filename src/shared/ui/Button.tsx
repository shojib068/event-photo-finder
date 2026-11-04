import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-300',
  secondary: 'bg-white text-stone-800 ring-1 ring-stone-300 hover:bg-stone-50 disabled:text-stone-400',
  ghost: 'text-stone-600 hover:text-stone-900 underline-offset-4 hover:underline',
};

export function Button({ variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-12 items-center justify-center rounded-full px-6 text-base font-semibold transition disabled:cursor-not-allowed ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
