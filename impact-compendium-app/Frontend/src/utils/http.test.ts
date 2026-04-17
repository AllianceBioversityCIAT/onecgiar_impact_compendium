import { describe, expect, it } from 'vitest';

import { parseFilename } from './http';

describe('parseFilename', () => {
  it('parses quoted filenames', () => {
    expect(parseFilename('attachment; filename="foo.xlsx"')).toBe('foo.xlsx');
  });

  it('parses unquoted filenames', () => {
    expect(parseFilename('attachment; filename=foo.xlsx')).toBe('foo.xlsx');
  });

  it('parses utf-8 encoded filenames', () => {
    expect(parseFilename("attachment; filename*=UTF-8''foo%20bar.xlsx")).toBe(
      'foo bar.xlsx'
    );
  });

  it('returns null for missing content disposition', () => {
    expect(parseFilename(null)).toBeNull();
  });
});
