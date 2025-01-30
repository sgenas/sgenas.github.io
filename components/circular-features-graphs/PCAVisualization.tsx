'use client'

import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

interface PCData {
  experiment_name: string
  model_config: string
  display_labels: string[]
  states_pca: number[][]
  base_items?: string[]
  string_modifiers?: string[]
}

interface LayerData {
  [key: string]: PCData
}

interface Props {
  data?: LayerData
  experimentConfig?: {
    name: string
    base_items: string[]
    display_labels: string[]
    string_modifiers?: string[]
  }
  width?: number
  height?: number
}

// Default data to prevent undefined errors
const defaultData: LayerData = {
  layer_1: {
    experiment_name: 'colour',
    model_config: 'Gemma-2-2B',
    display_labels: ['Violet', 'Blue', 'Cyan', 'Green', 'Yellow', 'Orange', 'Red'],
    states_pca: [
      [57.76558303833008, 32.144588470458984],
      [-11.107534408569336, 0.37020039558410645],
      [25.111370086669922, -58.3227424621582],
      [-22.679500579833984, -3.9491796493530273],
      [-20.315980911254883, 6.824947357177734],
      [-6.49876594543457, 10.885591506958008],
      [-22.27518653869629, 12.046592712402344],
    ],
  },
}

const PCAVisualization: React.FC<Props> & {
  fromJSON: (jsonPath: string) => Promise<React.ReactElement>
} = ({ data = defaultData, experimentConfig, width = 800, height = 600 }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [currentLayer, setCurrentLayer] = useState(1)
  const [maxLayer, setMaxLayer] = useState(1)

  const margin = { top: 60, right: 50, bottom: 50, left: 50 }

  useEffect(() => {
    if (!data) return
    const layers = Object.keys(data).map((key) => parseInt(key.replace('layer_', '')))
    setMaxLayer(Math.max(...layers))
  }, [data])

  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || !data) return

    // Clear previous SVG content
    d3.select(svgRef.current).selectAll('*').remove()

    const svg = d3.select(svgRef.current)

    // Create separate groups for axes and zoomable content
    const axisGroup = svg.append('g').attr('class', 'axis-group')

    const zoomGroup = svg.append('g').attr('class', 'zoom-group')

    const mainGroup = zoomGroup.append('g')
    const tooltip = d3.select(tooltipRef.current)

    // Create color scale based on the experiment type
    const getColorScale = () => {
      const currentData = data[`layer_${currentLayer}`]
      if (!currentData) return d3.scaleOrdinal(d3.schemeCategory10)

      const experimentName = currentData.experiment_name
      switch (experimentName) {
        case 'musical_note':
        case 'musical_note_flat_sharp':
          return d3
            .scaleOrdinal<string>()
            .domain(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
            .range(d3.schemeCategory10)
        case 'colour':
        case 'hsv_colour':
        case 'hsv_colour_tertiary':
          return d3
            .scaleOrdinal<string>()
            .domain(['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Magenta', 'Violet'])
            .range([
              '#FF0000',
              '#FFA500',
              '#FFFF00',
              '#00FF00',
              '#00FFFF',
              '#0000FF',
              '#FF00FF',
              '#8A2BE2',
            ])
        default:
          return d3.scaleOrdinal<string>(d3.schemeCategory10)
      }
    }

    const colorScale = getColorScale()

    // Create clip path with extra padding
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'plot-area')
      .append('rect')
      .attr('x', margin.left - 20) // Extra space for points
      .attr('y', margin.top - 20) // Extra space for labels
      .attr('width', width - margin.left - margin.right + 40) // Compensate for padding
      .attr('height', height - margin.top - margin.bottom + 40)

    // Create initial scales with padding
    const layerData = data[`layer_${currentLayer}`]

    // Calculate the full data extent and add padding
    const xExtent = d3.extent(layerData.states_pca, (d) => d[0]) as [number, number]
    const yExtent = d3.extent(layerData.states_pca, (d) => d[1]) as [number, number]

    // Add padding by expanding the domain by a percentage
    const xRange = xExtent[1] - xExtent[0]
    const yRange = yExtent[1] - yExtent[0]
    const xPadding = xRange * 0.2 // 20% padding
    const yPadding = yRange * 0.2

    const xScale = d3
      .scaleLinear()
      .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
      .range([margin.left, width - margin.right])
      .nice()

    const yScale = d3
      .scaleLinear()
      .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
      .range([height - margin.bottom, margin.top])
      .nice()

    // Define zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.5, 5]) // Min and max zoom scales
      .extent([
        [margin.left, margin.top],
        [width - margin.right, height - margin.bottom],
      ])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform)

        // Update axes with zoomed scales
        const newXScale = event.transform.rescaleX(xScale)
        const newYScale = event.transform.rescaleY(yScale)

        // Update axes to match zoom level but keep them at the edges
        axisGroup.select('.x-axis').call(
          d3.axisBottom(newXScale).tickFormat((d) => {
            // Format tick labels to handle potentially large numbers
            return typeof d === 'number' ? d.toFixed(2) : ''
          }) as any
        )
        ;(axisGroup.select('.y-axis') as d3.Selection<SVGGElement, unknown, null, undefined>).call(
          d3.axisLeft(newYScale).tickFormat((d) => {
            return typeof d === 'number' ? d.toFixed(2) : ''
          })
        )
      })

    // Apply zoom behavior to SVG
    svg.call(zoom as any)

    // Add zoom reset button
    d3.select(svgRef.current.parentNode as HTMLElement)
      .append('button')
      .attr(
        'class',
        'absolute top-4 right-4 px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm'
      )
      .text('Reset Zoom')
      .on('click', () => {
        svg
          .transition()
          .duration(750)
          .call(zoom.transform as any, d3.zoomIdentity)
      })

    const updateVisualization = (layerKey: string) => {
      const layerData = data[layerKey]
      if (!layerData) return

      // Update scales with padding
      const xExtent = d3.extent(layerData.states_pca, (d) => d[0]) as [number, number]
      const yExtent = d3.extent(layerData.states_pca, (d) => d[1]) as [number, number]

      const xRange = xExtent[1] - xExtent[0]
      const yRange = yExtent[1] - yExtent[0]
      const xPadding = xRange * 0.2
      const yPadding = yRange * 0.2

      xScale.domain([xExtent[0] - xPadding, xExtent[1] + xPadding]).nice()
      yScale.domain([yExtent[0] - yPadding, yExtent[1] + yPadding]).nice()

      // Clear previous elements
      mainGroup.selectAll('*').remove()

      // Add axes to the fixed axis group
      // First remove old axes
      axisGroup.selectAll('.axis').remove()

      // Add new axes
      axisGroup
        .append('g')
        .attr('class', 'x-axis axis')
        .attr('transform', `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale))

      axisGroup
        .append('g')
        .attr('class', 'y-axis axis')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))

      // Add zero lines
      const gClip = mainGroup.append('g').attr('clip-path', 'url(#plot-area)')

      const zeroLines = gClip.append('g').attr('class', 'zero-lines')

      const extendedLength = Math.max(width, height) * 100

      ;[
        { x1: -extendedLength, x2: extendedLength, y1: yScale(0), y2: yScale(0) },
        { x1: xScale(0), x2: xScale(0), y1: -extendedLength, y2: extendedLength },
      ].forEach((line) => {
        zeroLines
          .append('line')
          .attr('class', 'zero-line')
          .attr('x1', line.x1)
          .attr('x2', line.x2)
          .attr('y1', line.y1)
          .attr('y2', line.y2)
          .attr('stroke', '#000')
          .attr('stroke-dasharray', '4')
          .attr('stroke-width', '1')
          .attr('opacity', '0.3')
      })

      // Points group
      const pointsGroup = gClip.append('g').attr('class', 'points-group')

      const getPointColor = (label: string) => {
        if (layerData.experiment_name.includes('colour')) {
          return colorScale(label)
        }
        if (layerData.experiment_name.includes('musical_note')) {
          return colorScale(label.charAt(0))
        }
        return colorScale(label)
      }

      // Helper function to get point ID
      const getPointId = (label: string) => `point-${label.replace(/\s+/g, '-')}`

      // Update points with transitions
      const points = pointsGroup.selectAll('circle').data(
        layerData.display_labels.map((label, i) => ({
          label,
          x: layerData.states_pca[i][0],
          y: layerData.states_pca[i][1],
        })),
        (d: { label: string; x: number; y: number }) => getPointId(d.label)
      )

      // Enter new points
      const pointsEnter = points
        .enter()
        .append('circle')
        .attr('id', (d) => getPointId(d.label))
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', 8)
        .attr('fill', (d) => getPointColor(d.label))
        .attr('fill-opacity', '0.8')
        .attr('stroke', '#fff')
        .attr('stroke-width', '1')

      // Update existing points
      points
        .transition()
        .duration(750)
        .ease(d3.easeQuadInOut)
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))

      // Handle point labels
      const labels = pointsGroup.selectAll('text').data(
        layerData.display_labels.map((label, i) => ({
          label,
          x: layerData.states_pca[i][0],
          y: layerData.states_pca[i][1],
        })),
        (d: { label: string; x: number; y: number }) => `label-${getPointId(d.label)}`
      )

      // Enter new labels
      labels
        .enter()
        .append('text')
        .attr('x', (d) => xScale(d.x))
        .attr('y', (d) => yScale(d.y) - 12)
        .attr('text-anchor', 'middle')
        .attr('font-size', '10px')
        .style('pointer-events', 'none')
        .text((d) => d.label)

      // Update existing labels
      labels
        .transition()
        .duration(750)
        .ease(d3.easeQuadInOut)
        .attr('x', (d) => xScale(d.x))
        .attr('y', (d) => yScale(d.y) - 12)

      // Remove old elements
      points.exit().remove()
      labels.exit().remove()

      // Update mouse events
      pointsGroup
        .selectAll('circle')
        .on('mouseover', (event, d: { label: string; x: number; y: number }) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('r', 10)
            .attr('fill-opacity', '1')

          tooltip
            .style('opacity', '1')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY - 10}px`)
            .text(d.label)
        })
        .on('mouseout', (event) => {
          d3.select(event.currentTarget)
            .transition()
            .duration(200)
            .attr('r', 8)
            .attr('fill-opacity', '0.8')

          tooltip.style('opacity', '0')
        })
    }

    // Add static elements (titles)
    svg
      .append('text')
      .attr('x', width / 2)
      .attr('y', height - margin.bottom / 3)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text('PCA Component 1')

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(height / 2))
      .attr('y', margin.left / 3)
      .attr('text-anchor', 'middle')
      .attr('font-size', '14px')
      .text('PCA Component 2')

    // Initialize visualization
    updateVisualization(`layer_${currentLayer}`)
  }, [currentLayer, data, width, height])

  const currentExperiment = data[`layer_${currentLayer}`]?.experiment_name || 'PCA'
  const formattedExperimentName = currentExperiment
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg border bg-white shadow-sm">
      <div className="border-b p-6">
        <h2 className="text-xl font-semibold">{formattedExperimentName} Visualization</h2>
      </div>
      <div className="p-6">
        <div className="mb-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Layer:</span>
            <span className="text-sm" id="layer-number">
              {currentLayer}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max={maxLayer}
            value={currentLayer}
            onChange={(e) => setCurrentLayer(parseInt(e.target.value))}
            className="h-2 w-64 cursor-pointer appearance-none rounded-lg bg-gray-200"
          />
        </div>
        <div className="relative">
          <svg ref={svgRef} width={width} height={height} className="mx-auto" />
          <div
            ref={tooltipRef}
            className="pointer-events-none absolute rounded border border-gray-200 bg-white px-2 py-1 text-xs opacity-0 shadow"
          />
        </div>
      </div>
    </div>
  )
}

// Static method remains the same
PCAVisualization.fromJSON = async (jsonPath: string): Promise<React.ReactElement> => {
  try {
    const response = await fetch(jsonPath)
    const data = await response.json()
    return <PCAVisualization data={data} />
  } catch (error) {
    console.error('Error loading PCA data:', error)
    throw error
  }
}

export default PCAVisualization
