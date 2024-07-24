import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Title, Tooltip, Legend);

const BarChartComponent = ({ data }) => {

  const months = data.map(item => item.month);
  const matchedNumbers = data.map(item => item.matched_number);
  const unmatchedNumbers = data.map(item => item.unmatched_number);
  const unprocessedNumbers = data.map(item => item.unprocessed_number);

  const newData ={
      labels: months,
      datasets: [
        {
          label: 'Matched Number',
          data: matchedNumbers,
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
        {
          label: 'Unmatched Number',
          data: unmatchedNumbers,
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          borderColor: 'rgba(255, 99, 132, 1)',
          borderWidth: 1,
        },
        {
          label: 'Unprocessed Number',
          data: unprocessedNumbers,
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        }
      ],
  }


  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Bar Chart',
      },
    },
    scales: {
      x: {
        stacked: true, // Para apilar las barras si lo prefieres
      },
      y: {
        stacked: true, // Para apilar las barras si lo prefieres
      },
    },
  };

  return <Bar data={newData} options={options} />;
};

export default BarChartComponent;
