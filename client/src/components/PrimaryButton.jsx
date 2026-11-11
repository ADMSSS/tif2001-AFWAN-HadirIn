import React from 'react';
import { ArrowRight } from 'lucide-react';

/**
 * PrimaryButton - 1:1 dengan tombol submit di AuthPage Figma (proporsional untuk layar desktop)
 */
const PrimaryButton = ({
  children,
  type = 'button',
  onClick,
  isLoading = false,
  disabled = false,
  className = '',
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`group w-full flex items-center justify-between bg-foreground text-accent font-display font-bold text-base lg:text-lg px-5 py-3 rounded-md shadow-[4px_4px_0_0_#c9f23c] border-2 border-foreground hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all disabled:opacity-60 disabled:pointer-events-none cursor-pointer ${className}`}
    >
      <span>{isLoading ? 'Memproses...' : children}</span>
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-accent"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
      )}
    </button>
  );
};

export default PrimaryButton;
