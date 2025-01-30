'use client'

import { useEffect, useState } from 'react'
import PCAVisualization from '@/components/circular-features-graphs/PCAVisualization'

interface PCAWrapperProps {
  dataPath: string
}

export default function PCAWrapper({ dataPath }: PCAWrapperProps) {
  const [viz, setViz] = useState<React.ReactElement | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Attempting to fetch:', dataPath) // Debug log

    fetch(dataPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.json()
      })
      .then((data) => {
        console.log('Data loaded:', data) // Debug log
        return PCAVisualization.fromJSON(dataPath)
      })
      .then((viz) => {
        console.log('Visualization created') // Debug log
        setViz(viz)
      })
      .catch((err) => {
        console.error('Failed to load:', err)
        setError(`${err.message} (from ${dataPath})`)
      })
  }, [dataPath])

  if (error) return <div>Error loading visualization: {error}</div>
  if (!viz) return <div>Loading visualization... from {dataPath}</div>
  return viz
}
