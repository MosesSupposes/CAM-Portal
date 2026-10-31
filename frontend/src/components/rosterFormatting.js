const GENDER_LABELS = new Map([
  ['m', 'Male'],
  ['male', 'Male'],
  ['f', 'Female'],
  ['female', 'Female'],
  ['nb', 'Non-binary'],
  ['non-binary', 'Non-binary'],
  ['nonbinary', 'Non-binary'],
  ['nb/f', 'Non-binary'],
  ['nb/m', 'Non-binary'],
]);

export function formatGender(value) {
  const key = String(value ?? '').trim().toLowerCase();
  return GENDER_LABELS.get(key) || '—';
}

export function formatCsvRow(values) {
  return values
    .map(value => `"${String(value ?? '').replaceAll('"', '""')}"`)
    .join(',');
}