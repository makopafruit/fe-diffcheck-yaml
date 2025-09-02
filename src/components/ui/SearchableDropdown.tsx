import * as React from "react";

type Option = { value: string; label: string };

type Props = {
  id?: string;
  value: string;                                 // '' when none
  onChange: (next: string) => void;              // option.value or ''
  options: ReadonlyArray<Option>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onClear?: () => void;                          // optional hook on clear
  filterFn?: (opt: Option, q: string) => boolean;// custom filter
  renderOption?: (opt: Option, state: { active: boolean; selected: boolean }) => React.ReactNode;
};

const SearchableDropdown = React.forwardRef<HTMLInputElement, Props>(
  (
    {
      id,
      value,
      onChange,
      options,
      placeholder = "Search…",
      disabled = false,
      className = "",
      onClear,
      filterFn,
      renderOption,
    },
    ref
  ) => {
    const autoId = React.useId();
    const inputId = id ?? `search-dd-${autoId}`;
    const listboxId = `${inputId}-listbox`;

    // derive selected option
    const selected = React.useMemo(
      () => options.find((o) => o.value === value) ?? null,
      [options, value]
    );

    // local input text; seed from selected label
    const [inputValue, setInputValue] = React.useState(selected?.label ?? "");
    const [open, setOpen] = React.useState(false);
    const [activeIdx, setActiveIdx] = React.useState<number>(-1);
    const [isComposing, setIsComposing] = React.useState(false);

    // ref plumbing
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // keep input text synced when parent selection changes (track the whole selected object)
    React.useEffect(() => {
      setInputValue(selected?.label ?? "");
    }, [selected]);

    // filtering (defer the query for responsiveness)
    const deferredQuery = React.useDeferredValue(inputValue);
    const filtered = React.useMemo(() => {
      const q = deferredQuery.trim().toLowerCase();
      if (!q) return options;

      if (filterFn) return options.filter((o) => filterFn(o, q));

      return options.filter(
        (o) =>
          o.label.toLowerCase().includes(q) ||
          o.value.toLowerCase().includes(q)
      );
    }, [options, deferredQuery, filterFn]);

    // open/filtered changes reset activeIdx
    React.useEffect(() => {
      if (!open) return;
      setActiveIdx(filtered.length ? 0 : -1);
    }, [open, filtered.length]);

    // keep active option scrolled into view
    React.useEffect(() => {
      if (!open || activeIdx < 0) return;
      const el = document.getElementById(`${inputId}-opt-${activeIdx}`);
      el?.scrollIntoView({ block: "nearest" });
    }, [open, activeIdx, inputId]);

    // click/tap/pointer outside to close (better mobile support)
    const rootRef = React.useRef<HTMLDivElement>(null);
    React.useEffect(() => {
      if (!open) return;
      const onDocDown = (e: PointerEvent) => {
        if (!rootRef.current) return;
        if (!rootRef.current.contains(e.target as Node)) setOpen(false);
      };
      document.addEventListener("pointerdown", onDocDown);
      return () => document.removeEventListener("pointerdown", onDocDown);
    }, [open]);

    const commitSelection = React.useCallback(
      (opt: Option | null) => {
        onChange(opt ? opt.value : "");
        if (!opt) onClear?.();
        setInputValue(opt?.label ?? "");
        setOpen(false);
        inputRef.current?.focus();
      },
      [onChange, onClear]
    );

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (disabled || isComposing) return;

      switch (e.key) {
        case "ArrowDown": {
          e.preventDefault();
          if (!open) {
            setOpen(true);
            return;
          }
          if (!filtered.length) return;
          setActiveIdx((i) => (i + 1) % filtered.length);
          break;
        }
        case "ArrowUp": {
          e.preventDefault();
          if (!open) {
            setOpen(true);
            return;
          }
          if (!filtered.length) return;
          setActiveIdx((i) => (i - 1 + filtered.length) % filtered.length);
          break;
        }
        case "Home": {
          if (open && filtered.length) {
            e.preventDefault();
            setActiveIdx(0);
          }
          break;
        }
        case "End": {
          if (open && filtered.length) {
            e.preventDefault();
            setActiveIdx(filtered.length - 1);
          }
          break;
        }
        case "Enter": {
          if (open && activeIdx >= 0 && activeIdx < filtered.length) {
            e.preventDefault();
            commitSelection(filtered[activeIdx]);
          }
          break;
        }
        case "Tab": {
          // Optional convenience: commit active on Tab when open
          if (open && activeIdx >= 0 && activeIdx < filtered.length) {
            commitSelection(filtered[activeIdx]);
          }
          break;
        }
        case "Escape": {
          if (open) {
            e.preventDefault();
            setOpen(false);
          } else if (inputValue) {
            setInputValue("");
          }
          break;
        }
        case "Backspace": {
          // if query is empty AND we have a selection, clear it
          if (inputValue === "" && value !== "") {
            e.preventDefault();
            commitSelection(null);
          }
          break;
        }
      }
    };

    // IME-safe events
    const onCompositionStart = () => setIsComposing(true);
    const onCompositionEnd = () => setIsComposing(false);

    const handleInputFocus = () => {
      if (!disabled) setOpen(true);
    };

    return (
      <div
        ref={rootRef}
        className={`relative ${className}`}
        data-state={open ? "open" : "closed"}
        data-disabled={disabled ? "true" : "false"}
      >
        <div
          className={[
            "flex items-center gap-2 rounded-lg border",
            disabled
              ? "bg-gray-100 text-gray-400 border-gray-200"
              : "bg-white border-gray-200",
            "px-2 py-2 focus-within:ring-2 focus-within:ring-indigo-500",
          ].join(" ")}
        >
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            role="combobox"
            aria-haspopup="listbox"
            aria-controls={open ? listboxId : undefined}
            aria-expanded={open}
            aria-autocomplete="list"
            aria-activedescendant={
              open && activeIdx >= 0 ? `${inputId}-opt-${activeIdx}` : undefined
            }
            className={[
              "w-full outline-none text-sm placeholder-gray-400 bg-transparent",
              disabled ? "cursor-not-allowed" : "",
            ].join(" ")}
            placeholder={placeholder}
            autoComplete="off"
            value={inputValue}
            disabled={disabled}
            onFocus={handleInputFocus}
            onBlur={(e) => {
              // if next focus is inside listbox, keep open (click selection)
              const next = e.relatedTarget as HTMLElement | null;
              if (next && next.dataset.role === "search-dd-option") return;
              setOpen(false);
            }}
            onChange={(e) => {
              setInputValue(e.target.value);
              if (!open) setOpen(true);
            }}
            onKeyDown={onKeyDown}
            onCompositionStart={onCompositionStart}
            onCompositionEnd={onCompositionEnd}
          />

          {/* Clear button (visible when selected and input mirrors label) */}
          {!disabled && value && inputValue === (selected?.label ?? "") && (
            <button
              type="button"
              className="rounded-md px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
              aria-label="Clear selection"
              title="Clear"
              onMouseDown={(e) => e.preventDefault()} // keep focus
              onClick={() => commitSelection(null)}
            >
              ×
            </button>
          )}
        </div>

        {/* Options popover */}
        {open && !disabled && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            {filtered.length === 0 ? (
              <li
                className="px-3 py-2 text-sm text-gray-500 select-none"
                aria-disabled="true"
              >
                <span role="status" aria-live="polite">No results</span>
              </li>
            ) : (
              filtered.map((opt, idx) => {
                const active = idx === activeIdx;
                const isSelected = opt.value === value;
                return (
                  <li
                    key={opt.value}
                    id={`${inputId}-opt-${idx}`}
                    role="option"
                    aria-selected={isSelected}
                    tabIndex={-1}
                    data-role="search-dd-option"
                    className={[
                      "px-3 py-2 text-sm cursor-pointer focus:outline-none",
                      active ? "bg-indigo-50" : "",
                      isSelected ? "font-medium" : "font-normal",
                    ].join(" ")}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => e.preventDefault()} // prevent blur
                    onClick={() => commitSelection(opt)}
                  >
                    {renderOption
                      ? renderOption(opt, { active, selected: isSelected })
                      : opt.label}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    );
  }
);

SearchableDropdown.displayName = "SearchableDropdown";

export default SearchableDropdown;
