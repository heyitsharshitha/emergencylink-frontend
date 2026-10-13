import { useId } from 'react';
import Icon from './Icon';

export function Button({ variant = 'primary', size, icon, loading, block, children, className = '', type = 'button', ...rest }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', !children && 'btn-icon', className].filter(Boolean).join(' ');
  return (
    <button type={type} className={cls} disabled={loading || rest.disabled} aria-busy={loading || undefined} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon ? <Icon name={icon} /> : null}
      {children}
    </button>
  );
}

export function Field({ label, required, help, error, children, className = '' }) {
  const id = useId();
  const describedBy = [help && `${id}-h`, error && `${id}-e`].filter(Boolean).join(' ') || undefined;
  const child = children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined, 'aria-required': required || undefined });
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}{required && <span className="req" aria-hidden="true">*</span>}{required && <span className="sr-only"> (required)</span>}</label>
      {child}
      {help && !error && <span id={`${id}-h`} className="field-help">{help}</span>}
      {error && <span id={`${id}-e`} className="field-error" role="alert"><Icon name="AlertCircle" size={14} style={{ marginTop: 2, flex: 'none' }} />{error}</span>}
    </div>
  );
}

export function Input({ label, required, help, error, icon, className = '', ...rest }) {
  return (
    <Field label={label} required={required} help={help} error={error} className={className}>
      {(p) => (icon
        ? <div className="input-icon"><Icon name={icon} size={16} /><input className="input" {...p} {...rest} /></div>
        : <input className="input" {...p} {...rest} />)}
    </Field>
  );
}

export function Textarea({ label, required, help, error, className = '', ...rest }) {
  return <Field label={label} required={required} help={help} error={error} className={className}>{(p) => <textarea className="textarea" {...p} {...rest} />}</Field>;
}

export function Select({ label, required, help, error, options = [], placeholder, className = '', ...rest }) {
  return (
    <Field label={label} required={required} help={help} error={error} className={className}>
      {(p) => (
        <select className="select" {...p} {...rest}>
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => { const [v, l] = Array.isArray(o) ? o : [o, o]; return <option key={v} value={v}>{l}</option>; })}
        </select>
      )}
    </Field>
  );
}

export function Check({ checked, onChange, title, sub, disabled }) {
  return (
    <label className={`check ${checked ? 'on' : ''}`}>
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} disabled={disabled} />
      <span><span className="check-title">{title}</span>{sub && <span className="check-sub" style={{ display: 'block' }}>{sub}</span>}</span>
    </label>
  );
}

export function Segmented({ value, onChange, options, label }) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map(([v, l, icon]) => (
        <button key={v} type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{icon && <Icon name={icon} />}{l}</button>
      ))}
    </div>
  );
}
