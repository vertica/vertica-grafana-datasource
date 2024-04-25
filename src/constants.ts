export const SELECT_OPTIONS = [
  {
    label: 'Aggregate Functions',
    value: 'aggregate',
    options: [
      { label: 'Average', value: 'Aggregate|avg|aggregate' },
      { label: 'Count', value: 'Aggregate|count|aggregate' },
      { label: 'Maximum', value: 'Aggregate|max|aggregate' },
      { label: 'Minimum', value: 'Aggregate|min|aggregate' },
      { label: 'Sum', value: 'Aggregate|sum|aggregate' },
      { label: 'Standard deviation', value: 'Aggregate|stddev|aggregate' },
      { label: 'Variance', value: 'Aggregate|variance|aggregate' },
    ],
  },
  {
    label: 'Windows Functions',
    value: 'window',
    options: [
      { label: 'Delta', value: 'Window|delta|window' },
      { label: 'Increase', value: 'Window|increase|window' },
      { label: 'Rate', value: 'Window|rate|window' },
      { label: 'Sum', value: 'Window|sum|window' },
      { label: 'Moving Average', value: 'Moving Window|moving_window|moving_window' },
    ],
  },
  { label: 'Alias', value: 'Alias|alias|alias' },
  { label: 'Column', value: 'Column|column|column' },
];

export const WHERE_OPTIONS = [
  {
    label: '$__timeFilter',
    value: 'macro',
  },
  {
    label: 'Expression',
    value: 'expression',
  },
];

export const FORMAT_OPTIONS = [
  { label: 'Time Series', value: 'time_series' },
  { label: 'Table', value: 'table' },
];

export const SSL_MODE_OPTIONS = [
  { label: 'none', value: 'none' },
  { label: 'server', value: 'server' },
  { label: 'server-strict', value: 'server-strict' },
];
