import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer,
} from 'recharts';

const AreaChartComponent = ({ data, xKey = 'month' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="matchedArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.35} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="unmatchedArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="totalArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Area
          type="monotone"
          dataKey="matched_number"
          name="Matched"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#matchedArea)"
          dot={{ r: 3, fill: '#6366f1' }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="unmatched_number"
          name="Unmatched"
          stroke="#f43f5e"
          strokeWidth={2}
          fill="url(#unmatchedArea)"
          dot={{ r: 3, fill: '#f43f5e' }}
          activeDot={{ r: 5 }}
        />
        <Area
          type="monotone"
          dataKey="total_number"
          name="Total"
          stroke="#06b6d4"
          strokeWidth={2}
          strokeDasharray="4 2"
          fill="url(#totalArea)"
          dot={false}
          activeDot={{ r: 5 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
};

export default AreaChartComponent;
