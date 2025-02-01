'use client'
import { LayerData, PCData, ExperimentType, experimentNameMap, Props, PointData } from './types'
import { createColorScale } from './colors'
import React, { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

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

type ZoomTransform = d3.ZoomTransform

const PCAVisualization: React.FC<Props> & {
  fromJSON: (jsonPath: string) => Promise<React.ReactElement>
} = ({ data = defaultData, experimentConfig, width: propWidth, height: propHeight }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const [currentLayer, setCurrentLayer] = useState(1)
  const [maxLayer, setMaxLayer] = useState(1)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })

  // Responsive margins that scale with screen size
  const getMargins = (width: number) => ({
    top: Math.max(30, Math.min(60, width * 0.075)),
    right: Math.max(25, Math.min(50, width * 0.0625)),
    bottom: Math.max(30, Math.min(50, width * 0.0625)),
    left: Math.max(30, Math.min(50, width * 0.0625)),
  })

  // Update dimensions on mount and window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (!containerRef.current) return

      const containerWidth = containerRef.current.clientWidth
      const baseHeight = Math.min(containerWidth * 0.75, window.innerHeight * 0.7)

      setDimensions({
        width: containerWidth,
        height: baseHeight,
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  const getScales = (layerData: PCData) => {
    const margin = getMargins(dimensions.width)
    const xExtent = d3.extent(layerData.states_pca, (d) => d[0]) as [number, number]
    const yExtent = d3.extent(layerData.states_pca, (d) => d[1]) as [number, number]

    const [xRange, yRange] = [xExtent[1] - xExtent[0], yExtent[1] - yExtent[0]]
    const [xPadding, yPadding] = [xRange * 0.2, yRange * 0.2]

    return {
      xScale: d3
        .scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([margin.left, dimensions.width - margin.right])
        .nice(),
      yScale: d3
        .scaleLinear()
        .domain([yExtent[0] - yPadding, yExtent[1] + yPadding])
        .range([dimensions.height - margin.bottom, margin.top])
        .nice(),
    }
  }

  const getPointColor = (layerData: PCData, label: string) => {
    const colorScale = createColorScale(
      layerData.experiment_name as ExperimentType,
      layerData.display_labels
    )
    //if (layerData.experiment_name.includes('colour')) return colorScale(label)
    //if (layerData.experiment_name.includes('musical_note')) return colorScale(label.charAt(0))
    return colorScale(label)
  }

  const getPointId = (label: string) => `point-${label.replace(/\s+/g, '-')}`

  // Update max layer when data changes
  useEffect(() => {
    if (!data) return
    const layers = Object.keys(data).map((key) => parseInt(key.replace('layer_', '')))
    setMaxLayer(Math.max(...layers))
  }, [data])

  // Update visualization when data or current layer changes
  useEffect(() => {
    if (!svgRef.current || !tooltipRef.current || !data) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = getMargins(dimensions.width)
    const layerData = data[`layer_${currentLayer}`]
    const { xScale, yScale } = getScales(layerData)

    // Adjust font sizes based on container width
    const getFontSize = (baseSize: number) => {
      const scale = Math.min(dimensions.width / 800, 1)
      return Math.max(baseSize * scale, baseSize * 0.75)
    }

    // Setup groups and clip path
    const axisGroup = svg.append('g').attr('class', 'axis-group')
    const zoomGroup = svg.append('g').attr('class', 'zoom-group')
    const mainGroup = zoomGroup.append('g')
    const tooltip = d3.select(tooltipRef.current)

    // Create clip path
    svg
      .append('defs')
      .append('clipPath')
      .attr('id', 'plot-area')
      .append('rect')
      .attr('x', margin.left - 20)
      .attr('y', margin.top - 20)
      .attr('width', dimensions.width - margin.left - margin.right + 40)
      .attr('height', dimensions.height - margin.top - margin.bottom + 40)

    // Setup zoom behavior with adjusted extents
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.5, 5])
      .extent([
        [margin.left, margin.top],
        [dimensions.width - margin.right, dimensions.height - margin.bottom],
      ])
      .on('zoom', (event) => {
        zoomGroup.attr('transform', event.transform.toString())
        const [newXScale, newYScale] = [
          event.transform.rescaleX(xScale),
          event.transform.rescaleY(yScale),
        ]

        // Update axes with responsive tick sizes
        axisGroup
          .select<SVGGElement>('.x-axis')
          .call(
            d3
              .axisBottom(newXScale)
              .tickFormat((d) => (typeof d === 'number' ? d.toFixed(2) : ''))
              .tickSize(-6)
          )
          .selectAll('text')
          .style('font-size', `${getFontSize(10)}px`)

        axisGroup
          .select<SVGGElement>('.y-axis')
          .call(
            d3
              .axisLeft(newYScale)
              .tickFormat((d) => (typeof d === 'number' ? d.toFixed(2) : ''))
              .tickSize(-6)
          )
          .selectAll('text')
          .style('font-size', `${getFontSize(10)}px`)
      })

    svg.call(zoom)

    const updateVisualization = () => {
      mainGroup.selectAll('*').remove()
      axisGroup.selectAll('.axis').remove()

      // Add axes with responsive styling
      axisGroup
        .append('g')
        .attr('class', 'x-axis axis')
        .attr('transform', `translate(0,${dimensions.height - margin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll('text')
        .style('font-size', `${getFontSize(10)}px`)

      axisGroup
        .append('g')
        .attr('class', 'y-axis axis')
        .attr('transform', `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale))
        .selectAll('text')
        .style('font-size', `${getFontSize(10)}px`)

      // Add zero lines
      const gClip = mainGroup.append('g').attr('clip-path', 'url(#plot-area)')
      const extendedLength = Math.max(dimensions.width, dimensions.height) * 100

      gClip
        .append('g')
        .attr('class', 'zero-lines')
        .selectAll('line')
        .data([
          { x1: -extendedLength, x2: extendedLength, y1: yScale(0), y2: yScale(0) },
          { x1: xScale(0), x2: xScale(0), y1: -extendedLength, y2: extendedLength },
        ])
        .enter()
        .append('line')
        .attr('class', 'zero-line')
        .attr('x1', (d) => d.x1)
        .attr('x2', (d) => d.x2)
        .attr('y1', (d) => d.y1)
        .attr('y2', (d) => d.y2)
        .attr('stroke', '#000')
        //.attr('stroke-dasharray', '4')
        .attr('stroke-width', '0.5')
        .attr('opacity', '0.3')
      // Add points with responsive sizes
      const pointsData = layerData.display_labels.map((label, i) => ({
        label,
        x: layerData.states_pca[i][0],
        y: layerData.states_pca[i][1],
      }))

      const pointRadius = Math.max(4, Math.min(8, dimensions.width / 100))
      const pointsGroup = mainGroup.append('g').attr('clip-path', 'url(#plot-area)')

      pointsGroup
        .selectAll<SVGCircleElement, PointData>('circle')
        .data(pointsData)
        .enter()
        .append('circle')
        .attr('cx', (d) => xScale(d.x))
        .attr('cy', (d) => yScale(d.y))
        .attr('r', pointRadius)
        .attr('fill', (d) => getPointColor(layerData, d.label))
        .attr('fill-opacity', '0.8')
        //.attr('stroke', '#fff')
        //.attr('stroke-width', '1')
        .on('mouseover', (event: MouseEvent, d: PointData) => {
          d3.select(event.currentTarget as SVGCircleElement)
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
        .on('mouseout', (event: MouseEvent) => {
          d3.select(event.currentTarget as SVGCircleElement)
            .transition()
            .duration(200)
            .attr('r', 8)
            .attr('fill-opacity', '0.8')

          tooltip.style('opacity', '0')
        })

      // Add labels
      pointsGroup
        .selectAll<SVGTextElement, PointData>('text')
        .data(pointsData)
        .enter()
        .append('text')
        .attr('x', (d) => xScale(d.x))
        .attr('y', (d) => yScale(d.y) - pointRadius - 4)
        .attr('text-anchor', 'middle')
        .style('font-size', `${getFontSize(10)}px`)
        .style('pointer-events', 'none')
        .text((d) => d.label)
    }

    // Add axis labels with responsive positioning and font sizes
    svg
      .append('text')
      .attr('x', dimensions.width / 2)
      .attr('y', dimensions.height - margin.bottom / 3)
      .attr('text-anchor', 'middle')
      .style('font-size', `${getFontSize(14)}px`)
      .text('PCA Component 1')

    svg
      .append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(dimensions.height / 2))
      .attr('y', margin.left / 3)
      .attr('text-anchor', 'middle')
      .style('font-size', `${getFontSize(14)}px`)
      .text('PCA Component 2')

    updateVisualization()
  }, [currentLayer, data, dimensions])

  const currentExperiment = data[`layer_${currentLayer}`]?.experiment_name || 'PCA'
  const formattedExperimentName =
    experimentNameMap[currentExperiment as ExperimentType] ||
    currentExperiment
      .split('_')
      .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')

  const currentModel = data[`layer_${currentLayer}`]?.model_config || 'Unknown Model'

  return (
    <div className="mx-auto w-full max-w-4xl rounded-lg border bg-white shadow-sm dark:bg-stone-700">
      <div className="border-b p-4 sm:p-6">
        <h2 className="text-lg font-semibold sm:text-xl">
          {formattedExperimentName} Visualization | {currentModel}
        </h2>
      </div>
      <div className="p-4 sm:p-6" ref={containerRef}>
        <div className="mb-6 flex flex-col items-center gap-4 sm:mb-8">
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
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="mx-auto"
          />
          <div
            ref={tooltipRef}
            className="pointer-events-none absolute rounded border border-gray-200 bg-white px-2 py-1 text-xs opacity-0 shadow"
          />
        </div>
      </div>
    </div>
  )
}

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
