import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = [
  'rgba(75, 192, 192, 0.8)',
  'rgba(255, 99, 132, 0.8)',
  'rgba(255, 206, 86, 0.8)',
];

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  if (percent < 0.03) return null;
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={13} fontWeight="bold">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

const PieChartComponent = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data available</div>;
  }

  const chartData = [
    { name: 'Matched', value: parseFloat((parseFloat(data.matched_per_cent) * 100).toFixed(2)) },
    { name: 'Unmatched', value: parseFloat((parseFloat(data.unmatched_per_cent) * 100).toFixed(2)) },
    { name: 'Unprocessed', value: parseFloat((parseFloat(data.unprocessed_per_cent) * 100).toFixed(2)) },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <PieChart>
        <Pie
          data={chartData}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={renderCustomizedLabel}
          outerRadius="70%"
          dataKey="value"
        >
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(value) => `${value}%`} />
        <Legend layout="vertical" align="right" verticalAlign="middle" />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default PieChartComponent;
