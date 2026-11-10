import { useEffect, useState } from 'react';
import { X, Star, Inbox } from 'lucide-react';

export const brandGreen = '#064e3b';

export function StatTile({ label, value, hint, icon: Icon, color = brandGreen, bg = 'rgba(6, 78, 59, 0.08)', onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      style={{
        flex: '1 1 200px',
        minWidth: '180px',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '14px 16px',
        background: '#ffffff',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 6px 14px rgba(0,0,0,0.07)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        if (!onClick) return;
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
        e.currentTarget.style.borderColor = 'var(--glass-border)';
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '10px',
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {Icon ? <Icon size={18} strokeWidth={2.2} /> : <Star size={18} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
          {label}
        </div>
        <div style={{ fontFamily: 'var(--heading-font)', fontSize: '1.35rem', fontWeight: 700, lineHeight: 1.25, color: 'var(--text-primary)' }}>
          {value}
        </div>
        {hint && (
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.3 }}>{hint}</div>
        )}
      </div>
    </button>
  );
}

export function Pill({ children, tone = 'neutral' }) {
  const tones = {
    neutral: { bg: '#f1f5f9', color: '#475569' },
    green: { bg: '#dcfce7', color: '#15803d' },
    amber: { bg: '#fef3c7', color: '#b45309' },
    red: { bg: '#fee2e2', color: '#b91c1c' },
    blue: { bg: '#dbeafe', color: '#1d4ed8' },
    purple: { bg: '#ede9fe', color: '#6d28d9' },
  };
  const palette = tones[tone] || tones.neutral;
  return (
    <span className="ckr-pill" style={{ background: palette.bg, color: palette.color }}>
      {children}
    </span>
  );
}

export function Stars({ value = 0, size = 12, showValue = false }) {
  const rounded = Math.round(Number(value) || 0);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={size}
          strokeWidth={2}
          fill={star <= rounded ? '#f59e0b' : 'none'}
          color={star <= rounded ? '#f59e0b' : '#cbd5e1'}
        />
      ))}
      {showValue && (
        <span style={{ marginLeft: '4px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
          {(Number(value) || 0).toFixed(1)}
        </span>
      )}
    </span>
  );
}

export function Modal({ open, title, subtitle, onClose, children, footer, width = 620 }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        zIndex: 1000,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: `${width}px`,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 48px -20px rgba(15, 23, 42, 0.4)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '12px',
            padding: '14px 18px',
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
            {subtitle && <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{subtitle}</p>}
          </div>
          <button type="button" className="ckr-icon-btn" onClick={onClose} title="Close">
            <X size={14} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', overflowY: 'auto', flex: 1 }}>{children}</div>

        {footer && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '8px',
              padding: '12px 18px',
              borderTop: '1px solid var(--glass-border)',
              background: '#f8fafc',
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, description, icon: Icon = Inbox, action }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '36px 20px',
        border: '1px dashed var(--glass-border)',
        borderRadius: 'var(--radius-md)',
        background: '#ffffff',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          background: 'var(--accent-light)',
          color: 'var(--accent-primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</div>
      {description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', maxWidth: '420px' }}>{description}</p>}
      {action}
    </div>
  );
}

export function PageHeader({ title, description, actions }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0, flex: '1 1 260px' }}>
        <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h2>
        {description && <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>{description}</p>}
      </div>
      {actions && <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

export function Field({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0 }}>
      <label style={{ fontSize: '11.5px', fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
        {label}
      </label>
      {children}
      {hint && <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{hint}</span>}
    </div>
  );
}

export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}
