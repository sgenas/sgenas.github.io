'use client'

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';


interface PCData {
    experiment_name: string;
    model_config: string;
    display_labels: string[];
    states_pca: number[][];
    base_items?: string[];
    string_modifiers?: string[];
}

interface LayerData {
    [key: string]: PCData;
}

interface Props {
    data?: LayerData;
    experimentConfig?: {
        name: string;
        base_items: string[];
        display_labels: string[];
        string_modifiers?: string[];
    };
    width?: number;
    height?: number;
}

// Default data to prevent undefined errors
const defaultData: LayerData = {
    "layer_1": {
        "experiment_name": "colour",
        "model_config": "Gemma-2-2B",
        "display_labels": ["Violet","Blue","Cyan","Green","Yellow","Orange","Red"],
        "states_pca": [
            [57.76558303833008,32.144588470458984],
            [-11.107534408569336,0.37020039558410645],
            [25.111370086669922,-58.3227424621582],
            [-22.679500579833984,-3.9491796493530273],
            [-20.315980911254883,6.824947357177734],
            [-6.49876594543457,10.885591506958008],
            [-22.27518653869629,12.046592712402344]
        ]
    }
};

const PCAVisualization: React.FC<Props> = ({ 
    data = defaultData, 
    experimentConfig,
    width = 800, 
    height = 600 
}) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const [currentLayer, setCurrentLayer] = useState(1);
    const [maxLayer, setMaxLayer] = useState(1);
    
    const margin = { top: 60, right: 50, bottom: 50, left: 50 };

    useEffect(() => {
        if (!data) return;
        // Find the highest layer number in the data
        const layers = Object.keys(data).map(key => 
            parseInt(key.replace('layer_', ''))
        );
        setMaxLayer(Math.max(...layers));
    }, [data]);

    useEffect(() => {
        if (!svgRef.current || !tooltipRef.current || !data) return;

        // Clear previous SVG content
        d3.select(svgRef.current).selectAll("*").remove();

        const svg = d3.select(svgRef.current);
        const mainGroup = svg.append("g");
        const tooltip = d3.select(tooltipRef.current);

        // Create color scale based on the experiment type
        const getColorScale = () => {
            const currentData = data[`layer_${currentLayer}`];
            if (!currentData) return d3.scaleOrdinal(d3.schemeCategory10);

            const experimentName = currentData.experiment_name;
            switch (experimentName) {
                case 'musical_note':
                case 'musical_note_flat_sharp':
                    return d3.scaleOrdinal<string>()
                        .domain(['C', 'D', 'E', 'F', 'G', 'A', 'B'])
                        .range(d3.schemeCategory10);
                case 'colour':
                case 'hsv_colour':
                case 'hsv_colour_tertiary':
                    return d3.scaleOrdinal<string>()
                        .domain(['Red', 'Orange', 'Yellow', 'Green', 'Cyan', 'Blue', 'Magenta', 'Violet'])
                        .range(['#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#8A2BE2']);
                default:
                    return d3.scaleOrdinal<string>(d3.schemeCategory10);
            }
        };

        const colorScale = getColorScale();

        // Create clip path
        svg.append("defs")
            .append("clipPath")
            .attr("id", "plot-area")
            .append("rect")
            .attr("x", margin.left)
            .attr("y", margin.top)
            .attr("width", width - margin.left - margin.right)
            .attr("height", height - margin.top - margin.bottom);

        const updateVisualization = (layerKey: string) => {
            const layerData = data[layerKey];
            if (!layerData) return;

            // Create scales
            const xScale = d3.scaleLinear()
                .domain(d3.extent(layerData.states_pca, d => d[0]) as [number, number])
                .range([margin.left, width - margin.right])
                .nice();

            const yScale = d3.scaleLinear()
                .domain(d3.extent(layerData.states_pca, d => d[1]) as [number, number])
                .range([height - margin.bottom, margin.top])
                .nice();

            // Clear previous elements
            mainGroup.selectAll("*").remove();

            // Add axes
            mainGroup.append("g")
                .attr("class", "x-axis")
                .attr("transform", `translate(0,${height - margin.bottom})`)
                .call(d3.axisBottom(xScale));

            mainGroup.append("g")
                .attr("class", "y-axis")
                .attr("transform", `translate(${margin.left},0)`)
                .call(d3.axisLeft(yScale));

            // Add zero lines
            const gClip = mainGroup.append("g")
                .attr("clip-path", "url(#plot-area)");

            const zeroLines = gClip.append("g")
                .attr("class", "zero-lines");

            const extendedLength = Math.max(width, height) * 100;

            // Add horizontal and vertical zero lines
            [
                { x1: -extendedLength, x2: extendedLength, y1: yScale(0), y2: yScale(0) },
                { x1: xScale(0), x2: xScale(0), y1: -extendedLength, y2: extendedLength }
            ].forEach(line => {
                zeroLines.append("line")
                    .attr("class", "zero-line")
                    .attr("x1", line.x1)
                    .attr("x2", line.x2)
                    .attr("y1", line.y1)
                    .attr("y2", line.y2)
                    .attr("stroke", "#000")
                    .attr("stroke-dasharray", "4")
                    .attr("stroke-width", "1")
                    .attr("opacity", "0.3");
            });

            // Add points
            const pointsGroup = gClip.append("g")
                .attr("class", "points-group");

            // Helper function to get point color
            const getPointColor = (label: string) => {
                if (layerData.experiment_name.includes('colour')) {
                    return colorScale(label);
                }
                if (layerData.experiment_name.includes('musical_note')) {
                    return colorScale(label.charAt(0));
                }
                return colorScale(label);
            };

            // Add points with labels
            layerData.states_pca.forEach((point, i) => {
                const label = layerData.display_labels[i];
                
                // Add point
                pointsGroup.append("circle")
                    .attr("cx", xScale(point[0]))
                    .attr("cy", yScale(point[1]))
                    .attr("r", 8)
                    .attr("fill", getPointColor(label))
                    .attr("fill-opacity", "0.8")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", "1")
                    .on("mouseover", (event: MouseEvent) => {
                        d3.select(event.currentTarget)
                            .transition()
                            .duration(200)
                            .attr("r", 10)
                            .attr("fill-opacity", "1");

                        tooltip
                            .style("opacity", "1")
                            .style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY - 10}px`)
                            .text(label);
                    })
                    .on("mouseout", (event: MouseEvent) => {
                        d3.select(event.currentTarget)
                            .transition()
                            .duration(200)
                            .attr("r", 8)
                            .attr("fill-opacity", "0.8");

                        tooltip.style("opacity", "0");
                    });

                // Add label
                pointsGroup.append("text")
                    .attr("x", xScale(point[0]))
                    .attr("y", yScale(point[1]) - 12)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "10px")
                    .style("pointer-events", "none")
                    .text(label);
            });
        };

        // Add static elements
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - margin.bottom / 3)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("PCA Component 1");

        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(height / 2))
            .attr("y", margin.left / 3)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .text("PCA Component 2");

        // Initialize visualization
        updateVisualization(`layer_${currentLayer}`);

    }, [currentLayer, data, width, height]);

    const currentExperiment = data[`layer_${currentLayer}`]?.experiment_name || 'PCA';
    const formattedExperimentName = currentExperiment
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    return (
        <div className="w-full max-w-4xl mx-auto bg-white rounded-lg border shadow-sm">
            <div className="p-6 border-b">
                <h2 className="text-xl font-semibold">
                    {formattedExperimentName} Visualization
                </h2>
            </div>
            <div className="p-6">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <span className="text-sm font-medium">Layer:</span>
                        <span className="text-sm" id="layer-number">{currentLayer}</span>
                    </div>
                    <input
                        type="range"
                        min="1"
                        max={maxLayer}
                        value={currentLayer}
                        onChange={(e) => setCurrentLayer(parseInt(e.target.value))}
                        className="w-64 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                </div>
                <div className="relative">
                    <svg
                        ref={svgRef}
                        width={width}
                        height={height}
                        className="mx-auto"
                    />
                    <div
                        ref={tooltipRef}
                        className="absolute opacity-0 bg-white px-2 py-1 text-xs rounded shadow pointer-events-none border border-gray-200"
                    />
                </div>
            </div>
        </div>
    );
};

export default PCAVisualization;