import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Komponen InputText Reusable & Modular (Sesuai Desain Figma HadirIn v3)
 */
export default function InputText({
  label,
  id,
  name,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error = '',
  helperText = '',
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full mb-5 ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block font-['JetBrains_Mono',monospace] text-[11px] font-medium tracking-[0.18em] uppercase text-[#4a4e43] mb-2"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          id={id || name}
          name={name}
          type={effectiveType}
          value={value}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
          className={[
            "w-full h-[48px] px-4 font-['JetBrains_Mono',monospace] text-[13.5px] bg-[#f8f7f2] outline-none",
            isPassword ? 'pr-11' : 'pr-4',
            'placeholder-[#8c9184] text-[#14170f] transition-all border rounded-[4px]',
            error
              ? 'border-red-500 focus:border-red-600'
              : 'border-[#6e7365] focus:border-[#14170f] focus:bg-white',
            disabled ? 'opacity-60 cursor-not-allowed' : '',
          ].join(' ')}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            disabled={disabled}
            tabIndex={-1}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#6e7365] hover:text-[#14170f] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {error ? (
        <p id={`${name}-error`} className="mt-1.5 text-[12px] text-red-600 font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p className="mt-1.5 text-[12px] text-[#5c6055]">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
