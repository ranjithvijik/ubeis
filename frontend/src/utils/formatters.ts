export const formatValue = (value: number, unit: string): string => {
  if (unit === 'percent') {
    return `${(value * 100).toFixed(1)}%`;
  }
  if (unit === 'dollars') {
    return `$${value.toLocaleString()}`;
  }
  return `${value.toLocaleString()}${unit ? ` ${unit}` : ''}`;
};

export const formatPercent = (value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '–';
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(1)}%`;
};

