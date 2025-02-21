'use client'

import { useEffect, useState } from 'react'
import { FinancesBarChart } from './FinancesBarChart'
import { FinancialRecord, YearlyFinancialData } from './types'
import { transformFinancialData } from './dataTransformer'
import { csvHeaderMap } from './csvHeaderMap'
import Papa from 'papaparse'

interface FinancesWrapperProps {
  dataPath: string
}

export default function FinancesWrapper({ dataPath }: FinancesWrapperProps) {
  const [data, setData] = useState<YearlyFinancialData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('Attempting to fetch:', dataPath)
    fetch(dataPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        return response.text()
      })
      .then((csvText) => {
        const parsedData = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: ';',
          transformHeader: (header) => csvHeaderMap[header] || header,
          transform: (value) => {
            // Convert comma-decimal numbers to standard decimal format
            if (/^-?\d+,\d+$/.test(value)) {
              return parseFloat(value.replace(',', '.'))
            }
            // Handle regular numbers
            if (/^-?\d+$/.test(value)) {
              return parseInt(value)
            }
            return value
          },
        })

        if (parsedData.data.length === 0) {
          throw new Error('No data was parsed from the CSV')
        }

        const transformed = transformFinancialData(parsedData.data as FinancialRecord[])
        if (!transformed || transformed.length === 0) {
          throw new Error('Data transformation returned empty result')
        }

        const transformedData = transformed[0]
        if (!transformedData) {
          throw new Error('First year data is undefined')
        }

        setData(transformedData)
      })
      .catch((err) => {
        console.error('Failed to load:', err)
        setError(`Failed to load data: ${err.message}`)
      })
  }, [dataPath])

  if (error) return <div>Error: {error}</div>
  if (!data) return <div>Loading...</div>

  return (
    <>
      <div>Debug info:</div>
      {/* <pre>{JSON.stringify(data, null, 2)}</pre> */}
      <FinancesBarChart data={data} />
    </>
  )
}
