import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

const LineChartComponent = ({ data }) => {

  const days = data.map(item => item.day);
  const matchedNumbers = data.map(item => item.matched_number);
  const unmatchedNumbers = data.map(item => item.unmatched_number);
  const unprocessedNumbers = data.map(item => item.unprocessed_number);

  const lineData = {
    labels: days,
    datasets: [
      {
        label: 'Unmatched',
        data: unmatchedNumbers,
        borderColor: 'rgba(255, 99, 132, 0.5)',
        backgroundColor: 'rgba(255, 99, 132, 1)',
      },
      {
        label: 'Unprocessed',
        data: unprocessedNumbers,
        borderColor: 'rgba(255, 206, 86, 0.5)',
        backgroundColor: 'rgba(255, 206, 86, 1)',
      },
      {
        label: 'Matched',
        data: matchedNumbers,
        borderColor: 'rgba(75, 192, 192, 0.5)',
        backgroundColor: 'rgba(75, 192, 192, 1)',
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
    },
  };

  return <Line data={lineData} options={options} />;
};

export default LineChartComponent;
