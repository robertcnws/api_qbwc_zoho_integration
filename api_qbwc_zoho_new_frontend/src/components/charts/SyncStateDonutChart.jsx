import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Colors aligned with SyncStateBadge variants so the donut and the badges in
// the invoices list use the same palette.
const STATE_META = [
  { key: 'confirmed',         label: 'Synced',          color: 'rgba(16, 185, 129, 0.85)' },
  { key: 'pending',           label: 'Pending',         color: 'rgba(148, 163, 184, 0.85)' },
  { key: 'sent',              label: 'Sending',         color: 'rgba(59, 130, 246, 0.85)' },
  { key: 'failed',            label: 'Failed',          color: 'rgba(239, 68, 68, 0.85)' },
  { key: 'skipped_duplicate', label: 'Already in QB',   color: 'rgba(245, 158, 11, 0.85)' },
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

const SyncStateDonutChart = ({ data }) => {
  if (!data || typeof data !== 'object') {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data available</div>;
  }

  const chartData = STATE_META
    .map(({ key, label, color }) => ({ name: label, value: data[key] || 0, color }))
    .filter((d) => d.value > 0);

  if (chartData.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data available</div>;
  }

  const total = chartData.reduce((acc, d) => acc + d.value, 0);

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="40%"
          cy="50%"
          innerRadius="45%"
          outerRadius="75%"
          paddingAngle={1}
          dataKey="value"
          labelLine={false}
          label={renderCustomizedLabel}
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
          <text x="40%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={18} fontWeight="bold" fill="#0f172a">
            {total.toLocaleString()}
          </text>
          <text x="40%" y="50%" dy={18} textAnchor="middle" dominantBaseline="central" fontSize={11} fill="#64748b">
            invoices
          </text>
        </Pie>
        <Tooltip formatter={(value) => `${value.toLocaleString()} invoices`} />
        <Legend layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default SyncStateDonutChart;
