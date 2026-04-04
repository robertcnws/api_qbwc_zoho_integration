import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const LineChartComponent = ({ data }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data available</div>;
  }

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <Tooltip />
        <Legend />
        <Line
          type="monotone"
          dataKey="unmatched_number"
          name="Unmatched"
          stroke="rgba(255, 99, 132, 1)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="unprocessed_number"
          name="Unprocessed"
          stroke="rgba(255, 206, 86, 1)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="matched_number"
          name="Matched"
          stroke="rgba(75, 192, 192, 1)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;
