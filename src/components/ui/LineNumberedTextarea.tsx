import * as React from "react";

type Props = {
  value?: string;                 // controlled value (optional)
  defaultValue?: string;          // uncontrolled initial value (optional)
  onChange?: (next: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;             // extra container classes
  textareaClassName?: string;     // extra textarea classes
};

export default function LineNumberedTextarea({
  value,
  defaultValue,
  onChange,
  placeholder,
  disabled,
  className = "",
  textareaClassName = "",
}: Props) {
  // support controlled or uncontrolled
  const isControlled = value !== undefined;
  const [inner, setInner] = React.useState<string>(defaultValue ?? "");

  // keep local in sync when controlled
  React.useEffect(() => {
    if (isControlled) setInner(value!);
  }, [isControlled, value]);

  const text = isControlled ? value! : inner;

  const taRef = React.useRef<HTMLTextAreaElement>(null);
  const gutterRef = React.useRef<HTMLDivElement>(null);

  // compute line numbers (cheap)
  const lineCount = React.useMemo(() => {
    // show at least 1 line number even when empty
    return Math.max(1, (text.match(/\n/g)?.length ?? 0) + 1);
  }, [text]);

  // sync scroll (textarea -> gutter)
  const onScroll = () => {
    if (gutterRef.current && taRef.current) {
      gutterRef.current.scrollTop = taRef.current.scrollTop;
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    if (!isControlled) setInner(next);
    onChange?.(next);
  };

  return (
    <div
      className={[
        "relative flex rounded-md border border-gray-200 bg-white",
        disabled ? "opacity-50" : "",
        className,
      ].join(" ")}
    >
      {/* Gutter */}
      <div
        ref={gutterRef}
        aria-hidden
        className="select-none overflow-hidden rounded-l-md border-r border-gray-200 bg-gray-50 text-right text-[10px] leading-5 text-gray-400"
        style={{ width: 40 }}
      >
        {/* pad with the same line-height as textarea for alignment */}
        <div className="px-1.5 py-2">
          {Array.from({ length: lineCount }).map((_, i) => (
            <div key={i} className="tabular-nums">
              {i + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Textarea */}
      <textarea
        ref={taRef}
        value={isControlled ? value : inner}
        onChange={handleChange}
        onScroll={onScroll}
        disabled={disabled}
        placeholder={placeholder}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
        inputMode="text"
        className={[
          "min-h-64 w-full resize-y rounded-r-md bg-white p-2 font-mono text-xs leading-5",
          "outline-none focus:ring-2 focus:ring-indigo-500",
          "placeholder:text-gray-400",
          textareaClassName,
        ].join(" ")}
        // visually align with gutter padding
        style={{ paddingLeft: 8 }}
      />
    </div>
  );
}
