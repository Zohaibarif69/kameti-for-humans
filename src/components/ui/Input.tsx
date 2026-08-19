import React from 'react';

interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  prefix?: React.ReactNode;
  suffix?: React.ReactNode;
}

export default function Input({ label, error, prefix, suffix, className = '', id, ...props }: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-[13px] font-medium text-kameti-text">{label}</label>}
      <div className="relative flex items-center">
        {prefix && <span className="absolute left-3 text-kameti-text-muted">{prefix}</span>}
        <input
          id={inputId}
          className={`w-full border border-kameti-border rounded-lg text-[14px] text-kameti-text placeholder-kameti-text-muted bg-white py-2 px-3 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all ${prefix ? 'pl-9' : ''} ${suffix ? 'pr-9' : ''} ${error ? 'border-danger focus:border-danger focus:ring-danger/15' : ''} ${className}`}
          {...props}
        />
        {suffix && <span className="absolute right-3 text-kameti-text-muted">{suffix}</span>}
      </div>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export function Select({ label, error, options, className = '', id, ...props }: SelectProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-[13px] font-medium text-kameti-text">{label}</label>}
      <select
        id={inputId}
        className={`w-full border border-kameti-border rounded-lg text-[14px] text-kameti-text bg-white py-2 px-3 pr-8 outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-all appearance-none ${error ? 'border-danger' : ''} ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <p className="text-[12px] text-danger">{error}</p>}
    </div>
  );
}
