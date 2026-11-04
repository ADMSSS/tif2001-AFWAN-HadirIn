import { ArrowRight } from 'lucide-react';

/**
 * Komponen PrimaryButton Modular (Sesuai Desain Figma HadirIn v3)
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
        'w-full h-[52px] bg-[#14170f] text-[#c5f82a] font-bold text-[15px] rounded-[4px]',
        'shadow-[3px_3px_0px_#c5f82a] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0px_#c5f82a]',
        'flex items-center justify-between px-5 transition-all',
        'hover:bg-[#1e2217]',
        'disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      <span>{loading ? 'Memproses...' : children}</span>
      {!loading && <ArrowRight size={18} strokeWidth={2.2} className="text-[#c5f82a]" />}
    </button>
  );
}
