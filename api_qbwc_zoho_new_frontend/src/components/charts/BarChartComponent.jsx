import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const BarChartComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <BarChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Bar
          dataKey="matched_number"
          name="Matched"
          stackId="a"
          fill="rgba(75, 192, 192, 0.8)"
        />
        <Bar
          dataKey="unmatched_number"
          name="Unmatched"
          stackId="a"
          fill="rgba(255, 99, 132, 0.8)"
        />
        <Bar
          dataKey="unprocessed_number"
          name="Unprocessed"
          stackId="a"
          fill="rgba(255, 206, 86, 0.8)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default BarChartComponent;
