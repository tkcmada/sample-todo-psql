import React from 'react';

type Props<T> = {
  values: T[];
  selected: T[] | undefined;
  onChange: (selected: T[] | undefined) => void;
  renderLabel: (value: T) => React.ReactNode;
};

export function ColumnFilterOptions<T>({ values, selected, onChange, renderLabel }: Props<T>) {
  const allChecked = !selected || selected.length === values.length;

  const toggleAll = (checked: boolean) => {
    if (checked) {
      onChange(undefined);
    } else {
      onChange([]);
    }
  };

  const toggle = (value: T) => {
    const base = new Set(selected ?? values);
    if (base.has(value)) {
      base.delete(value);
    } else {
      base.add(value);
    }
    const arr = Array.from(base);
    onChange(arr.length === values.length ? undefined : arr);
  };

  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1">
        <input
          type="checkbox"
          checked={allChecked}
          onChange={(e) => toggleAll(e.target.checked)}
          aria-label="全て"
        />
        <span>全て</span>
      </label>
      {values.map((option) => {
        const isChecked = allChecked || (selected?.includes(option) ?? false);
        return (
          <label key={String(option)} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => toggle(option)}
              aria-label={String(renderLabel(option))}
            />
            <span>{renderLabel(option)}</span>
          </label>
        );
      })}
    </div>
  );
}

export default ColumnFilterOptions;
