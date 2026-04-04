import React from 'react';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, Cell,
} from 'recharts';

const ComposedChartComponent = ({ data, xKey = 'month' }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
        No data available
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.matched_number || 0));

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={220}>
      <ComposedChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="barMatchedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#34d399" stopOpacity={0.6} />
          </linearGradient>
          <linearGradient id="barUnmatchedGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip
          contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="matched_number" name="Matched" fill="url(#barMatchedGrad)" radius={[4, 4, 0, 0]} barSize={18}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.matched_number === maxVal ? '#059669' : 'url(#barMatchedGrad)'}
              opacity={entry.matched_number === maxVal ? 1 : 0.85}
            />
          ))}
        </Bar>
        <Bar dataKey="unmatched_number" name="Unmatched" fill="url(#barUnmatchedGrad)" radius={[4, 4, 0, 0]} barSize={18} />
        <Line
          type="monotone"
          dataKey="total_number"
          name="Total"
          stroke="#6366f1"
          strokeWidth={2.5}
          dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
          activeDot={{ r: 6 }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default ComposedChartComponent;
