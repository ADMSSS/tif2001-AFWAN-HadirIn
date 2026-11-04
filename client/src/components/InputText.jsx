import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const inputCls =
  'w-full bg-transparent focus:outline-none font-sans disabled:opacity-60';

/**
 * InputText - 1:1 dengan komponen Field pada figma desain/src/app/component/ui.tsx
 */
const InputText = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  helperText,
  hint,
  disabled = false,
  mono = false,
  autoComplete,
  inputMode,
  maxLength,
  className = '',
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type;
  const resolvedHint = hint || helperText;

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="block font-mono text-[11px] uppercase tracking-wider text-foreground/80">
          {label}
        </span>
      )}
      <div
        className={`mt-1 flex items-center gap-2 border-2 rounded-md bg-card px-3.5 py-2 lg:px-4 lg:py-2.5 focus-within:shadow-[4px_4px_0_0_#c9f23c] focus-within:-translate-y-px transition-all ${
          error ? 'border-destructive' : 'border-foreground'
        }`}
      >
        <input
          id={name}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          maxLength={maxLength}
          aria-invalid={Boolean(error)}
          className={`${inputCls} text-sm ${mono ? 'font-mono tracking-wider' : ''}`}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
            className="text-muted-foreground hover:text-foreground cursor-pointer"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {resolvedHint && !error && (
        <span className="block text-[11px] text-muted-foreground mt-1">
          {resolvedHint}
        </span>
      )}
      {error && (
        <span role="alert" className="block text-xs text-destructive font-medium mt-1">
          {error}
        </span>
      )}
    </label>
  );
};

export default InputText;
