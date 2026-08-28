// Display formatting. Keep every number and date format here so the whole app
// shows values the same way.

export const formatMoney = (amount, currency = 'USD', mode) => {
  if (amount == null) return '-';
  const formatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  return mode === 'RENT' ? `${formatted}/mo` : formatted;
};

// The database stores square metres; buyers and agents here think in square feet.
const SQFT_PER_SQM = 10.7639;

export const formatArea = (sqm) => {
  if (sqm == null) return '-';
  return `${Math.round(sqm * SQFT_PER_SQM).toLocaleString('en-US')} sq ft`;
};

// For the staff forms: convert between the stored m2 and the sq ft agents type in.
export const sqmToSqft = (sqm) => (sqm == null ? '' : Math.round(sqm * SQFT_PER_SQM));
export const sqftToSqm = (sqft) =>
  sqft === '' || sqft == null ? null : Number((Number(sqft) / SQFT_PER_SQM).toFixed(2));

export const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
};

export const formatTime = (value) =>
  value
    ? new Date(value).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : '-';

// ISO string <-> the value an <input type="datetime-local"> expects (local time).
export const toDateTimeLocal = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};

// Grouping helpers for the appointments list.
export const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

export const formatBytes = (n) => {
  if (n == null) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${Math.round(n / 1024)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
};

export const dayLabel = (iso) => {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const sameDay = (a, b) => a.toDateString() === b.toDateString();
  if (sameDay(d, today)) return 'Today';
  if (sameDay(d, tomorrow)) return 'Tomorrow';
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
};
