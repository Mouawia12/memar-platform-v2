import { describe, expect, it } from 'vitest';

import { applyOrder, reorderedIds } from './boardDnd';

describe('reorderedIds', () => {
  it('moving down lands after the card it was dropped on', () => {
    expect(reorderedIds([1, 2, 3, 4], 1, 3)).toEqual([2, 3, 1, 4]);
  });

  it('moving up lands before the card it was dropped on', () => {
    expect(reorderedIds([1, 2, 3, 4], 4, 2)).toEqual([1, 4, 2, 3]);
  });

  it('returns null when nothing changes or ids are foreign', () => {
    expect(reorderedIds([1, 2, 3], 2, 2)).toBeNull();
    expect(reorderedIds([1, 2, 3], 9, 2)).toBeNull();
  });
});

describe('applyOrder', () => {
  it('reorders only the column members, in their own slots', () => {
    const list = [{ id: 1 }, { id: 10 }, { id: 2 }, { id: 3 }, { id: 20 }];
    // العمود = 1،2،3 — الغرباء (10، 20) يبقون في أماكنهم
    expect(applyOrder(list, [3, 1, 2]).map((x) => x.id)).toEqual([3, 10, 1, 2, 20]);
  });
});
