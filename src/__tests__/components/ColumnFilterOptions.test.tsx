import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ColumnFilterOptions } from '@/components/ColumnFilterOptions';

describe('ColumnFilterOptions', () => {
  it('toggles all options with root checkbox', () => {
    function Wrapper() {
      const [selected, setSelected] = React.useState<boolean[] | undefined>(
        undefined,
      );
      return (
        <ColumnFilterOptions
          values={[true, false]}
          selected={selected}
          onChange={setSelected as any}
          renderLabel={(v) => (v ? '完了' : '未完了')}
        />
      );
    }

    render(<Wrapper />);

    const all = screen.getByLabelText('全て');
    expect((all as HTMLInputElement).checked).toBe(true);

    fireEvent.click(all);
    expect((all as HTMLInputElement).checked).toBe(false);

    fireEvent.click(all);
    expect((all as HTMLInputElement).checked).toBe(true);
  });
});
