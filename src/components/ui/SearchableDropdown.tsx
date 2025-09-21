import * as React from "react";

type Option = { value: string; label: string };

type Props = {
  id?: string;
  value: string;                                   // Controlled value: '' when none
  onChange: (next: string) => void;                // Emits option.value or ''
  options: ReadonlyArray<Option>;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  onClear?: () => void;                            // Optional hook when cleared
  filterFn?: (opt: Option, q: string) => boolean;  // Optional custom filter
  renderOption?: (
    opt: Option,
    state: { active: boolean; selected: boolean }
  ) => React.ReactNode;
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

    // Selected option derived from controlled value
    const selected = React.useMemo(
      () => options.find((o) => o.value === value) ?? null,
      [options, value]
    );

    // Local UI state
    const [inputValue, setInputValue] = React.useState(selected?.label ?? "");
    const [open, setOpen] = React.useState(false);
    const [activeIdx, setActiveIdx] = React.useState<number>(-1);
    const [isComposing, setIsComposing] = React.useState(false);

    // Ref plumbing
    const inputRef = React.useRef<HTMLInputElement>(null);
    React.useImperativeHandle(ref, () => inputRef.current as HTMLInputElement);

    // Keep input text in sync with external selection
    React.useEffect(() => {
      setInputValue(selected?.label ?? "");
    }, [selected]);

    // Filter options (defer query for responsiveness)
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

    // Reset active index when list opens or results change
    React.useEffect(() => {
      if (!open) return;
      setActiveIdx(filtered.length ? 0 : -1);
    }, [open, filtered.length]);

    // Keep the active item visible as the user navigates
    React.useEffect(() => {
      if (!open || activeIdx < 0) return;
      const el = document.getElementById(`${inputId}-opt-${activeIdx}`);
      el?.scrollIntoView({ block: "nearest" });
    }, [open, activeIdx, inputId]);

    // Close on outside pointer down (mobile-friendly)
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

    // Commit a selection (null = clear)
    const commitSelection = React.useCallback(
      (opt: Option | null) => {
        onChange(opt ? opt.value : "");
        if (!opt) {
          onClear?.();
          setInputValue("");
          setOpen(false);
          // Remove focus when clearing
          requestAnimationFrame(() => inputRef.current?.blur());
          return;
        }
        // Keep focus after choosing an option (preserves your current UX)
        setInputValue(opt.label);
        setOpen(false);
        inputRef.current?.focus();
      },
      [onChange, onClear]
    );

    // Keyboard interactions (a11y + power-user flows)
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
          // Optional: commit active on Tab when open
          if (open && activeIdx >= 0 && activeIdx < filtered.length) {
            commitSelection(filtered[activeIdx]);
          }
          break;
        }
        case "Escape": {
          e.preventDefault();
          if (open) {
            setOpen(false);
          } else if (inputValue) {
            setInputValue("");
            onChange?.(""); // propagate clear (optional)
            onClear?.();    // notify clear (optional)
          }
          // Always blur on Escape
          requestAnimationFrame(() => inputRef.current?.blur());
          break;
        }
        case "Backspace": {
          // If query is empty but a selection exists, clear it
          if (inputValue === "" && value !== "") {
            e.preventDefault();
            commitSelection(null);
          }
          break;
        }
      }
    };

    // IME composition (don’t handle keys mid-composition)
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
              "w-full bg-transparent text-sm placeholder-gray-400 outline-none",
              disabled ? "cursor-not-allowed" : "",
            ].join(" ")}
            placeholder={placeholder}
            autoComplete="off"
            value={inputValue}
            disabled={disabled}
            onFocus={handleInputFocus}
            onBlur={(e) => {
              // Keep open if the next focus target is a listbox option (click selection)
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
            inputMode="search"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
          />

          {/* Clear button (shown when a selection exists and input mirrors its label) */}
          {!disabled && value && inputValue === (selected?.label ?? "") && (
            <button
              type="button"
              className="rounded-md px-1.5 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
              aria-label="Clear selection"
              title="Clear"
              onMouseDown={(e) => e.preventDefault()} // Avoid losing focus before click
              onClick={() => commitSelection(null)}
            >
              ×
            </button>
          )}
        </div>

        {/* Options popup */}
        {open && !disabled && (
          <ul
            id={listboxId}
            role="listbox"
            className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg"
          >
            {filtered.length === 0 ? (
              <li
                className="select-none px-3 py-2 text-sm text-gray-500"
                aria-disabled="true"
              >
                <span role="status" aria-live="polite">
                  No results
                </span>
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
                      "cursor-pointer px-3 py-2 text-sm focus:outline-none",
                      active ? "bg-indigo-50" : "",
                      isSelected ? "font-medium" : "font-normal",
                    ].join(" ")}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onMouseDown={(e) => e.preventDefault()} // Prevent input blur before click
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
