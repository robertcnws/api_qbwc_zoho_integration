import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const PieChartComponent = ({ data }) => {
  const newData = {
    labels: ['Matched', 'Unmatched', 'Unproccessed'],
    datasets: [
      {
        label: '% of Items',
        data: [
          (parseFloat(data.matched_per_cent) * 100).toFixed(2),
          (parseFloat(data.unmatched_per_cent) * 100).toFixed(2),
          (parseFloat(data.unprocessed_per_cent) * 100).toFixed(2),
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.2)',
          'rgba(255, 99, 132, 0.2)',
          'rgba(255, 206, 86, 0.2)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    plugins: {
      
      legend: {
        position: 'right', // Cambia la posición de la leyenda a la derecha
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            // Muestra el valor en el tooltip
            let label = context.label || '';
            if (context.parsed !== null) {
              label += `: ${context.parsed}%`;
            }
            return label;
          }
        }
      },
      datalabels: {
        color: '#fff',
        display: true,
        formatter: (value) => {
          return `${value}`; // Muestra el valor directamente
        },
        font: {
          weight: 'bold',
          size: 14,
        },
        backgroundColor: (context) => {
          return context.dataset.backgroundColor[context.dataIndex];
        },
        borderRadius: 4,
        padding: 6,
      },
    },
  };

  return <Pie data={newData} options={options}/>;
};

export default PieChartComponent;