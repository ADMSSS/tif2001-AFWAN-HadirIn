import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export const inputCls =
  'w-full bg-transparent outline-none placeholder:text-muted-foreground/70';

/**
 * Komponen Field / InputText (1:1 dari Figma Make ui.tsx)
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
  hint = '',
  disabled = false,
  className = '',
  inputClassName = '',
  ...props
}) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  const effectiveType = isPassword ? (show ? 'text' : 'password') : type;
  const displayHint = hint || helperText;

  return (
    <label htmlFor={id || name} className={`block ${className}`}>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 border-2 border-foreground rounded-md bg-card px-4 py-2.5 focus-within:shadow-[4px_4px_0_0_#c9f23c] focus-within:-translate-y-px transition-all">
        {isPassword ? (
          <div className="flex items-center gap-2">
            <input
              id={id || name}
              name={name}
              type={effectiveType}
              value={value}
              onChange={onChange}
              disabled={disabled}
              placeholder={placeholder}
              className={`${inputCls} ${inputClassName}`}
              {...props}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              disabled={disabled}
              aria-label={
                show ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'
              }
              className="text-muted-foreground hover:text-foreground"
            >
              {show ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        ) : (
          <input
            id={id || name}
            name={name}
            type={effectiveType}
            value={value}
            onChange={onChange}
            disabled={disabled}
            placeholder={placeholder}
            className={`${inputCls} ${inputClassName}`}
            {...props}
          />
        )}
      </div>
      {error ? (
        <span className="block text-xs text-destructive mt-1.5">{error}</span>
      ) : displayHint ? (
        <span className="block text-xs text-muted-foreground mt-1.5">
          {displayHint}
        </span>
      ) : null}
    </label>
  );
}
