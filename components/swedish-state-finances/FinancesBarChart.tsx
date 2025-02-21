'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { YearlyFinancialData } from './types'

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

interface FinancesBarChartProps {
  data: YearlyFinancialData
  width?: number
  height?: number
}

export function FinancesBarChart({ data, width = 800, height = 400 }: FinancesBarChartProps) {
  // Transform data for Chart.js
  const chartData = {
    labels: Object.values(data.categories).map((category) => category.name),
    datasets: [
      {
        label: 'Budget',
        data: Object.values(data.categories).map((category) => category.total),
        backgroundColor: '#69b3a2',
      },
      {
        label: 'Outcome',
        data: Object.values(data.categories).map((category) => category.total),
        backgroundColor: '#404080',
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        ticks: {
          callback: (value: number) => `${value} MSEK`,
        },
      },
    },
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
    },
  }

  return (
    <div style={{ width, height }}>
      <Bar data={chartData} options={options} />
    </div>
  )
}
