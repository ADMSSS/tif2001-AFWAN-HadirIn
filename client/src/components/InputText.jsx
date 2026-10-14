import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

/**
 * Komponen InputText Reusable & Modular (Sesuai Desain Figma HadirIn)
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
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <div className={`w-full mb-4 ${className}`}>
      {label && (
        <label
          htmlFor={id || name}
          className="block text-[11px] font-bold tracking-[0.14em] uppercase text-[#666] mb-2"
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
            'w-full h-[52px] px-4 text-[15px] bg-white outline-none',
            isPassword ? 'pr-12' : 'pr-4',
            'placeholder-[#aaa] text-[#111] transition-all border',
            error
              ? 'border-red-500'
              : 'border-[#111] focus:border-[#ccff00] focus:shadow-[0_0_0_3px_rgba(204,255,0,0.25)]',
            disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : '',
          ].join(' ')}
          {...props}
        />

        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(s => !s)}
            disabled={disabled}
            tabIndex={-1}
            aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#111] transition-colors cursor-pointer"
          >
            {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
          </button>
        )}
      </div>

      {error && (
        <p id={`${name}-error`} className="mt-1.5 text-[12px] text-red-600 font-medium">
          {error}
        </p>
      )}
    </div>
  );
}