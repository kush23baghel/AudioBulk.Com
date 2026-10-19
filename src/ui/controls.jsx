// Small building blocks for the redesigned pages: buttons, cards, choice chips, quality slider.
import { useId } from 'react';

const BUTTON_STYLES = {
  primary: 'bg-wine text-paper hover:bg-wine-deep disabled:bg-wine/50',
  secondary: 'bg-paper text-ink border border-line-strong hover:bg-sand disabled:opacity-50',
  quiet: 'text-muted hover:text-ink hover:bg-sand disabled:opacity-40',
};

export function Button({ variant = 'primary', className = '', children, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-[15px] font-semibold transition-[background-color,border-color,color,transform] duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100 ${BUTTON_STYLES[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ as: Tag = 'div', className = '', children, ...props }) {
  return (
    <Tag className={`rounded-2xl border border-line bg-paper p-5 sm:p-6 ${className}`} {...props}>
      {children}
    </Tag>
  );
}

// Pick one option from a short list. Real radio inputs underneath, so keyboards and screen readers work.
export function ChoiceChips({ label, options, value, onChange }) {
  const name = useId();
  const selected = options.find((o) => o.value === value);
  return (
    <fieldset className="space-y-3">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.value}
            className={`cursor-pointer select-none rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-wine ${
              o.value === value
                ? 'border-wine bg-wine text-paper'
                : 'border-line bg-cream text-ink hover:border-line-strong hover:bg-sand'
            }`}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={o.value === value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
      {selected?.hint && <p className="text-sm text-muted">{selected.hint}</p>}
    </fieldset>
  );
}

// A slider over named levels, e.g. Smaller file … Best sound. `levels` = [{ label, detail }].
export function QualitySlider({ label, levels, value, onChange, disabled = false, disabledNote }) {
  const id = useId();
  const fill = (value / (levels.length - 1)) * 100;
  const current = levels[value];
  return (
    <div className="space-y-3">
      <label htmlFor={id} className="sr-only">{label}</label>
      <input
        id={id}
        type="range"
        min={0}
        max={levels.length - 1}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${current.label}, ${current.detail}`}
        className="ab-range"
        style={{ '--fill': `${fill}%` }}
      />
      <div className="flex justify-between text-xs text-muted">
        {levels.map((l, i) => (
          <span key={l.label} className={i === value && !disabled ? 'font-semibold text-ink' : ''}>{l.label}</span>
        ))}
      </div>
      <p className="text-sm text-muted">
        {disabled ? disabledNote : <><span className="font-semibold text-ink">{current.label}</span> · {current.detail}</>}
      </p>
    </div>
  );
}
