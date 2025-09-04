export function uid() {
  return 'id-' + Date.now();
}

export function nowISO() {
  return new Date().toISOString();
}
