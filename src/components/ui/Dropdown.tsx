type Option<T extends string> = Readonly<{
  value: T;
  label: string;
}>;

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: ReadonlyArray<Option<T>>;
  id?: string;
  name?: string;
  label?: string;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Optional tooltip shown when disabled */
  disabledHint?: string;
};

export default function Select<T extends string>({
  value,
  onChange,
  options,
  id,
  name,
  label,
  className = "",
  placeholder,
  disabled = false,
  disabledHint,
}: Props<T>) {
  // wrapper styles: gray out section when disabled
  const wrapperClasses = [
    className,
    "flex flex-col",
    disabled ? "opacity-50 select-none" : "", // visually gray out
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={wrapperClasses}
      aria-disabled={disabled || undefined}
      title={disabled ? disabledHint || "Complete previous filters first" : undefined}
    >
      {label && (
        <label
          htmlFor={id}
          className="mb-1 block text-xs font-medium text-gray-700"
        >
          {label}
        </label>
      )}

      <select
        id={id}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        disabled={disabled}
        className={[
          "block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm outline-none",
          "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
          // disabled visuals
          "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed",
        ].join(" ")}
      >
        {/* Placeholder only shows when value === "" */}
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}

        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
