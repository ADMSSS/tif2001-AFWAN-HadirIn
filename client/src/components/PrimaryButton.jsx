/**
 * Komponen PrimaryButton Modular (Sesuai Desain Figma HadirIn)
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
        'w-full h-[54px] bg-[#111] text-[#ccff00] font-extrabold text-[16px] tracking-wide',
        'flex items-center justify-between px-6 transition-colors',
        'hover:bg-[#1d1d1d] active:bg-[#2d2d2d]',
        'disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer',
        className,
      ].join(' ')}
      {...props}
    >
      <span>{loading ? 'Memproses...' : children}</span>
      {!loading && <span className="text-[22px] leading-none font-light">→</span>}
    </button>
  );
}