import React from 'react';
import { initials } from '../utils/formatters';

export function Wordmark({ dark = false, className = '' }) {
  return (
    <span
      className={`font-display font-extrabold tracking-tight leading-none ${className}`}
    >
      Hadir
      <span
        className={
          dark
            ? 'text-accent'
            : 'bg-foreground text-accent px-1.5 ml-0.5 rounded-sm'
        }
      >
        In
      </span>
    </span>
  );
}

export function PageHead({ kicker, title, action, kickerClassName = '' }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
      <div>
        {kicker && (
          <p
            className={`font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground ${kickerClassName}`}
          >
            {kicker}
          </p>
        )}
        <h1 className="font-display text-4xl sm:text-5xl font-extrabold tracking-tight leading-none mt-1">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}

export function Panel({
  title,
  kicker,
  action,
  children,
  className = '',
  bodyClassName = 'p-5',
  tone = 'card',
}) {
  const bg =
    tone === 'accent'
      ? 'bg-accent'
      : tone === 'dark'
        ? 'bg-foreground text-background'
        : 'bg-card';
  return (
    <section
      className={`border-2 border-foreground rounded-md ${bg} ${className}`}
    >
      {(title || action) && (
        <header
          className={`flex items-center justify-between gap-3 px-5 py-3.5 border-b-2 ${
            tone === 'dark' ? 'border-background/30' : 'border-foreground'
          }`}
        >
          <div>
            {kicker && (
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] opacity-60">
                {kicker}
              </p>
            )}
            {title && (
              <h2 className="font-display text-xl font-extrabold leading-tight">
                {title}
              </h2>
            )}
          </div>
          {action}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

export function Stat({ label, value, hint, tone = 'card' }) {
  const cls = {
    card: 'bg-card',
    accent: 'bg-accent',
    dark: 'bg-foreground text-background',
    alert: 'bg-destructive text-destructive-foreground',
  }[tone];
  return (
    <div className={`border-2 border-foreground rounded-md p-4 ${cls}`}>
      <p className="font-display text-4xl font-extrabold tabular-nums leading-none">
        {value}
      </p>
      <p className="font-mono text-[11px] uppercase tracking-widest mt-2">
        {label}
      </p>
      {hint && <p className="text-xs opacity-70 mt-1">{hint}</p>}
    </div>
  );
}

const pillTone = {
  ok: 'bg-accent text-accent-foreground border-foreground',
  warn: 'bg-destructive text-destructive-foreground border-foreground',
  mute: 'bg-secondary text-secondary-foreground border-foreground/40',
  dark: 'bg-foreground text-background border-foreground',
};

export function Pill({ tone = 'mute', children }) {
  return (
    <span
      className={`inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider px-2 py-0.5 rounded-sm border whitespace-nowrap ${pillTone[tone]}`}
    >
      {children}
    </span>
  );
}

export function Btn({
  variant = 'primary',
  size = 'md',
  className = '',
  type = 'button',
  ...p
}) {
  const base =
    'inline-flex items-center justify-center gap-2 font-display font-bold rounded-md border-2 border-foreground transition-all disabled:opacity-40 disabled:pointer-events-none focus-visible:outline-2 focus-visible:outline-offset-2 cursor-pointer';
  const sz = size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-5 py-3';
  const v = {
    primary:
      'bg-foreground text-accent shadow-[4px_4px_0_0_#c9f23c] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_#c9f23c]',
    accent:
      'bg-accent text-accent-foreground hover:bg-foreground hover:text-accent',
    ghost: 'bg-card hover:bg-secondary',
    danger:
      'bg-card text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground',
  }[variant];
  return (
    <button type={type} {...p} className={`${base} ${sz} ${v} ${className}`} />
  );
}

export function Field({ label, hint, children, className = '' }) {
  return (
    <label className={`block ${className}`}>
      <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1.5 border-2 border-foreground rounded-md bg-card px-4 py-2.5 focus-within:shadow-[4px_4px_0_0_#c9f23c] focus-within:-translate-y-px transition-all">
        {children}
      </div>
      {hint && (
        <span className="block text-xs text-muted-foreground mt-1.5">
          {hint}
        </span>
      )}
    </label>
  );
}

export function Avatar({ name, size = 40 }) {
  return (
    <div
      className="rounded-full bg-accent text-accent-foreground border-2 border-foreground grid place-items-center font-display font-extrabold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </div>
  );
}

export function Empty({ icon, title, text }) {
  return (
    <div className="border-2 border-dashed border-foreground/40 rounded-md p-8 text-center">
      {icon && (
        <div className="mx-auto w-fit text-muted-foreground">{icon}</div>
      )}
      <p className="font-display font-bold text-xl mt-3">{title}</p>
      {text && (
        <p className="text-muted-foreground mt-1 max-w-md mx-auto">{text}</p>
      )}
    </div>
  );
}

export function TableWrap({ children, min = 640 }) {
  return (
    <div className="border-2 border-foreground rounded-md bg-card overflow-x-auto no-scrollbar">
      <table className="w-full text-sm" style={{ minWidth: min }}>
        {children}
      </table>
    </div>
  );
}
