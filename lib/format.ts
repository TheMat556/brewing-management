const dateFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: "Europe/Berlin",
});

const dateTimeFormatter = new Intl.DateTimeFormat("de-DE", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Berlin",
});

export function formatNumber(value: number, maximumFractionDigits = 2): string {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits }).format(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return dateFormatter.format(new Date(value));
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) {
    return "—";
  }
  return dateTimeFormatter.format(new Date(value));
}

export function formatQuantity(value: number | null | undefined, unit: string): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${formatNumber(value)} ${unit}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${formatNumber(value)} %`;
}

export function formatPlato(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${formatNumber(value)} °P`;
}

export function formatLiters(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return `${formatNumber(value)} L`;
}

export function formatMinutes(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  if (value >= 1440) {
    return `${formatNumber(value / 1440)} Tage`;
  }
  if (value >= 60) {
    return `${formatNumber(value / 60)} Std.`;
  }
  return `${formatNumber(value)} Min.`;
}

export function formatSignedNumber(value: number): string {
  return new Intl.NumberFormat("de-DE", {
    maximumFractionDigits: 2,
    signDisplay: "exceptZero",
  }).format(value);
}
