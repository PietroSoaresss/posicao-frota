const MIN_MOTORISTA_AGE = 18;

function isoLocalDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function maxBirthDate(minAge = MIN_MOTORISTA_AGE): string {
  const d = new Date();
  d.setFullYear(d.getFullYear() - minAge);
  return isoLocalDate(d);
}

export function isBirthDateValid(date: string, minAge = MIN_MOTORISTA_AGE): boolean {
  if (!date) return false;
  return date <= maxBirthDate(minAge);
}
