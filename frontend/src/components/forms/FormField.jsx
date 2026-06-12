export default function FormField({
  label, name, type = 'number', value, onChange,
  step, min, max, hint, disabled, options,
}) {
  if (options) {
    return (
      <div>
        <label className="field-label" htmlFor={name}>{label}</label>
        <select
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="field-input appearance-none"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.text}</option>
          ))}
        </select>
        {hint && <p className="mt-1 text-xs text-slate-600 font-mono">{hint}</p>}
      </div>
    )
  }

  return (
    <div>
      <label className="field-label" htmlFor={name}>{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        step={step}
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="field-input"
      />
      {hint && <p className="mt-1 text-xs text-slate-600 font-mono">{hint}</p>}
    </div>
  )
}
