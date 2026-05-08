import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  ResponsiveContainer,
} from 'recharts';

// Pad data so the last `days` days (including today) are always present,
// filling missing days with zeros. Backend only returns days with records,
// so without this yesterday is dropped if it had no invoices.
const padLastDays = (data, days = 7) => {
  const map = new Map((data || []).map((d) => [d.day, d]));
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push(
      map.get(key) || {
        day: key,
        matched_number: 0,
        unmatched_number: 0,
        unprocessed_number: 0,
        total_number: 0,
      }
    );
  }
  return result;
};

const LineChartComponent = ({ data, padDays }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-sm text-muted-foreground">No data available</div>;
  }

  const chartData = padDays ? padLastDays(data, padDays) : data;

  return (
    <ResponsiveContainer width="100%" height="100%" minHeight={240}>
      <LineChart data={chartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
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
          dot={{ r: 4, fill: 'rgba(255, 99, 132, 1)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList dataKey="unmatched_number" position="top" fontSize={10} fill="rgba(255, 99, 132, 1)" />
        </Line>
        <Line
          type="monotone"
          dataKey="unprocessed_number"
          name="Unprocessed"
          stroke="rgba(255, 206, 86, 1)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'rgba(255, 206, 86, 1)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList dataKey="unprocessed_number" position="top" fontSize={10} fill="rgba(180, 140, 0, 1)" />
        </Line>
        <Line
          type="monotone"
          dataKey="matched_number"
          name="Matched"
          stroke="rgba(75, 192, 192, 1)"
          strokeWidth={2}
          dot={{ r: 4, fill: 'rgba(75, 192, 192, 1)' }}
          activeDot={{ r: 6 }}
        >
          <LabelList dataKey="matched_number" position="top" fontSize={10} fill="rgba(45, 140, 140, 1)" />
        </Line>
      </LineChart>
    </ResponsiveContainer>
  );
};

export default LineChartComponent;
