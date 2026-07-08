import { describe, expect, it } from 'vitest';

import { parseFilename } from './exportHelpers';

describe('parseFilename', () => {
  it('parses quoted filenames', () => {
    expect(parseFilename('attachment; filename="x.xlsx"')).toBe('x.xlsx');
  });

  it('parses unquoted filenames', () => {
    expect(parseFilename('attachment; filename=x.xlsx')).toBe('x.xlsx');
  });

  it('parses utf-8 encoded filenames', () => {
    expect(
      parseFilename("attachment; filename*=UTF-8''spaced%20name.xlsx")
    ).toBe('spaced name.xlsx');
  });

  it('returns null for null input', () => {
    expect(parseFilename(null)).toBeNull();
  });
});
