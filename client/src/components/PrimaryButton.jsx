import { ArrowRight } from 'lucide-react';

/**
 * Komponen PrimaryButton (Dikonversi 1:1 dari Figma Make ui.tsx & AuthPage.tsx)
 */
export default function PrimaryButton({
  children,
  type = 'button',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={[
        'group w-full flex items-center justify-between bg-foreground text-accent font-display font-bold text-lg lg:text-2xl px-5 lg:px-8 py-4 lg:py-6 rounded-md',
        'shadow-[4px_4px_0_0_#c9f23c] border-2 border-foreground',
        'hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c] transition-all',
        'focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      <span>{loading ? 'Memproses...' : children}</span>
      <ArrowRight className="w-5 h-5 lg:w-7 lg:h-7 transition-transform group-hover:translate-x-1" />
    </button>
  );
}
