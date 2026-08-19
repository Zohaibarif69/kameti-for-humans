import React from 'react';

type Variant = 'primary' | 'secondary' | 'tertiary' | 'danger' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-dark active:bg-primary-dark focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
  secondary: 'bg-white text-kameti-text border border-kameti-border hover:bg-kameti-surface-2 active:bg-kameti-surface-2',
  tertiary: 'bg-transparent text-primary hover:text-primary-dark hover:underline p-0',
  danger: 'bg-danger text-white hover:opacity-90 active:opacity-80',
  ghost: 'bg-transparent text-kameti-text-secondary hover:bg-kameti-surface-2 hover:text-kameti-text',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[13px] min-h-[32px]',
  md: 'px-4 py-2 text-[14px] min-h-[36px]',
  lg: 'px-5 py-2.5 text-[14px] min-h-[44px]',
};

export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base = 'inline-flex items-center gap-2 font-medium rounded-lg transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed';
  const variantCls = variantClasses[variant];
  const sizeCls = variant === 'tertiary' ? 'text-[14px]' : sizeClasses[size];

  return (
    <button
      className={`${base} ${variantCls} ${sizeCls} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : icon}
      {children}
      {!loading && iconRight}
    </button>
  );
}
