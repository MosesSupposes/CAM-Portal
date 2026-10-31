import { describe, expect, it } from 'vitest';
import { formatCsvRow, formatGender } from './rosterFormatting';

describe('roster formatting', () => {
  it.each([
    ['M', 'Male'],
    ['male', 'Male'],
    ['F', 'Female'],
    ['female', 'Female'],
    ['NB', 'Non-binary'],
    ['NB/F', 'Non-binary'],
    ['NB/M', 'Non-binary'],
    [' non-binary ', 'Non-binary'],
    ['', '—'],
    ['unexpected', '—'],
  ])('formats gender %s as %s', (value, expected) => {
    expect(formatGender(value)).toBe(expected);
  });

  it('escapes quotes and safely wraps commas and newlines in CSV cells', () => {
    expect(formatCsvRow(['Smith, Jane', 'said "hello"', 'line 1\nline 2', null]))
      .toBe('"Smith, Jane","said ""hello""","line 1\nline 2",""');
  });

  it('exports the assigned member ID as the first roster field', () => {
    expect(formatCsvRow([42, 'A Member', 'member@example.edu']))
      .toBe('"42","A Member","member@example.edu"');
  });
});