import React from 'react';
import {
  RadialBarChart, RadialBar, Legend, ResponsiveContainer, Tooltip,
} from 'recharts';

const RadialMatchChart = ({ customersStats, itemsStats }) => {
  if (!customersStats?.trend || !itemsStats?.trend) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  const custPct = parseFloat(customersStats.trend.per_cent_matched) || 0;
  const itemPct = parseFloat(itemsStats.trend.per_cent_matched) || 0;

  const data = [
    {
      name: 'Items Matched',
      value: itemPct,
      fill: 'url(#itemsGradient)',
    },
    {
      name: 'Customers Matched',
      value: custPct,
      fill: 'url(#customersGradient)',
    },
  ];

  const renderLegend = () => (
    <div className="flex flex-col gap-2 mt-2 text-xs">
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-indigo-500" />
        <span className="text-muted-foreground">Customers Matched:</span>
        <span className="font-bold text-indigo-700">{custPct.toFixed(1)}%</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="inline-block w-3 h-3 rounded-full bg-cyan-500" />
        <span className="text-muted-foreground">Items Matched:</span>
        <span className="font-bold text-cyan-700">{itemPct.toFixed(1)}%</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <ResponsiveContainer width="100%" height={200}>
        <RadialBarChart
          cx="50%"
          cy="50%"
          innerRadius="30%"
          outerRadius="90%"
          barSize={18}
          data={data}
          startAngle={90}
          endAngle={-270}
        >
          <defs>
            <linearGradient id="customersGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="itemsGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
          <RadialBar
            minAngle={5}
            background={{ fill: '#f1f5f9' }}
            clockWise
            dataKey="value"
            cornerRadius={6}
          />
          <Tooltip
            formatter={(value) => `${value.toFixed(1)}%`}
            contentStyle={{ fontSize: 12, borderRadius: 8 }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      {renderLegend()}
    </div>
  );
};

export default RadialMatchChart;
