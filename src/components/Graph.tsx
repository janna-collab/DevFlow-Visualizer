import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { ArchitectureAnalysis } from '../services/geminiService';

interface GraphProps {
  data: ArchitectureAnalysis;
  onNodeClick: (nodeName: string) => void;
}

export const Graph: React.FC<GraphProps> = ({ data, onNodeClick }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = React.useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setDimensions({
          width: entries[0].contentRect.width,
          height: entries[0].contentRect.height
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!svgRef.current || !data || !data.components || !data.dataFlow || dimensions.width === 0) return;

    const { width, height } = dimensions;

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("style", "max-width: 100%; height: auto;");

    const nodeIds = new Set(data.components.map(c => c.name.trim()));
    const nodes = data.components.map(d => ({ 
      id: d.name.trim(), 
      layer: d.layer || "Core Logic",
      ...d 
    }));

    // Add missing nodes from dataFlow to prevent D3 errors
    data.dataFlow.forEach(flow => {
      const from = flow.from.trim();
      const to = flow.to.trim();
      if (!nodeIds.has(from)) {
        nodes.push({ id: from, name: from, layer: "Core Logic", description: "Inferred component", dependencies: [] } as any);
        nodeIds.add(from);
      }
      if (!nodeIds.has(to)) {
        nodes.push({ id: to, name: to, layer: "Core Logic", description: "Inferred component", dependencies: [] } as any);
        nodeIds.add(to);
      }
    });

    const dataFlowLinks = data.dataFlow
      .filter(d => d.from.trim() && d.to.trim())
      .map(d => ({ source: d.from.trim(), target: d.to.trim(), label: d.description, type: 'dataflow' }));

    const dependencyLinks: any[] = [];
    data.components.forEach(comp => {
      comp.dependencies.forEach(dep => {
        const depName = dep.trim();
        if (nodeIds.has(depName)) {
          dependencyLinks.push({ source: comp.name.trim(), target: depName, type: 'dependency' });
        }
      });
    });

    const links = [...dataFlowLinks, ...dependencyLinks];

    // Layer positioning logic
    const layers = ["Frontend", "Core Logic", "Backend", "Infrastructure", "Database", "External"];
    const layerHeight = height / (layers.length + 1);
    
    const layerY = (layer: string) => {
      const index = layers.indexOf(layer);
      return (index + 1) * layerHeight;
    };

    // Group nodes by layer to calculate horizontal positions
    const nodesByLayer: { [key: string]: any[] } = {};
    layers.forEach(l => nodesByLayer[l] = []);
    nodes.forEach(n => {
      const layer = n.layer || "Core Logic";
      if (nodesByLayer[layer]) {
        nodesByLayer[layer].push(n);
      } else {
        nodesByLayer["Core Logic"].push(n);
      }
    });

    // Assign static positions with multi-row support for crowded layers
    nodes.forEach((n: any) => {
      const layer = n.layer || "Core Logic";
      const siblings = nodesByLayer[layer];
      const index = siblings.indexOf(n);
      const layerNodesCount = siblings.length;
      
      const nodesPerRow = 4;
      const row = Math.floor(index / nodesPerRow);
      const col = index % nodesPerRow;
      const rowCount = Math.ceil(layerNodesCount / nodesPerRow);
      const nodesInThisRow = Math.min(nodesPerRow, layerNodesCount - row * nodesPerRow);

      // Adjust Y based on row within layer
      const rowSpacing = 60;
      n.y = layerY(layer) + (row - (rowCount - 1) / 2) * rowSpacing;
      
      // Center nodes horizontally within the row
      const spacing = width / (nodesInThisRow + 1);
      n.x = (col + 1) * spacing;
    });

    // Background Layer Labels
    const layerBg = svg.append("g").attr("class", "layer-bg");
    layers.forEach((layer, i) => {
      const y = layerY(layer);
      
      // Layer band background - subtle alternating shades
      const isLightBg = i % 2 === 0;
      layerBg.append("rect")
        .attr("x", 0)
        .attr("y", y - layerHeight / 2)
        .attr("width", width)
        .attr("height", layerHeight)
        .attr("fill", isLightBg ? "#F8FAFC" : "#020617")
        .attr("fill-opacity", 0.02);

      // Layer separator line
      layerBg.append("line")
        .attr("x1", 0)
        .attr("y1", y - layerHeight / 2)
        .attr("x2", width)
        .attr("y2", y - layerHeight / 2)
        .attr("stroke", "#F8FAFC")
        .attr("stroke-opacity", 0.03);

      // Layer Label - Moved to the far right and made very subtle
      const labelGroup = layerBg.append("g")
        .attr("transform", `translate(${width - 20}, ${y - layerHeight / 2 + 15})`);

      labelGroup.append("text")
        .text(layer.toUpperCase())
        .attr("fill", isLightBg ? "#020617" : "#F8FAFC")
        .attr("fill-opacity", 0.1)
        .attr("font-size", "7px")
        .attr("font-family", "var(--font-mono)")
        .attr("font-weight", "bold")
        .attr("letter-spacing", "0.4em")
        .attr("text-anchor", "end");
    });

    // Arrowhead markers
    const defs = svg.append("defs");
    
    defs.append("marker")
      .attr("id", "arrowhead-dataflow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#F8FAFC");

    defs.append("marker")
      .attr("id", "arrowhead-dependency")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 10)
      .attr("refY", 0)
      .attr("orient", "auto")
      .attr("markerWidth", 5)
      .attr("markerHeight", 5)
      .append("svg:path")
      .attr("d", "M 0,-5 L 10 ,0 L 0,5")
      .attr("fill", "#4F46E5");

    const link = svg.append("g")
      .selectAll("g")
      .data(links)
      .join("g");

    link.append("path")
      .attr("d", (d: any) => {
        const sourceNode = nodes.find(n => n.id === d.source) as any;
        const targetNode = nodes.find(n => n.id === d.target) as any;
        if (!sourceNode || !targetNode) return "";
        
        const x1 = sourceNode.x;
        const y1 = sourceNode.y;
        const x2 = targetNode.x;
        const y2 = targetNode.y;
        
        // Offset to stop at node edge (node is 90x26)
        const nodeHalfWidth = 45;
        const nodeHalfHeight = 13;
        
        const dx = x2 - x1;
        const dy = y2 - y1;
        
        // Simple vertical offset for layered layout
        const targetYOffset = dy > 0 ? -nodeHalfHeight : nodeHalfHeight;
        const sourceYOffset = dy > 0 ? nodeHalfHeight : -nodeHalfHeight;

        const midY = (y1 + y2) / 2;
        return `M${x1},${y1 + sourceYOffset} C${x1},${midY} ${x2},${midY} ${x2},${y2 + targetYOffset}`;
      })
      .attr("fill", "none")
      .attr("stroke", (d: any) => d.type === 'dataflow' ? "#F8FAFC" : "#4F46E5")
      .attr("stroke-opacity", (d: any) => d.type === 'dataflow' ? 0.3 : 0.15)
      .attr("stroke-width", (d: any) => d.type === 'dataflow' ? 1.5 : 1)
      .attr("stroke-dasharray", (d: any) => d.type === 'dependency' ? "4,2" : "none")
      .attr("marker-end", (d: any) => `url(#arrowhead-${d.type})`);

    const node = svg.append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .attr("transform", (d: any) => `translate(${d.x},${d.y})`)
      .style("cursor", "pointer")
      .on("click", (event, d: any) => onNodeClick(d.id));

    // Node shadow/glow
    node.append("rect")
      .attr("x", -45)
      .attr("y", -13)
      .attr("width", 90)
      .attr("height", 26)
      .attr("rx", 4)
      .attr("fill", "#020617")
      .attr("filter", "blur(8px)")
      .attr("opacity", 0.4);

    node.append("rect")
      .attr("x", -45)
      .attr("y", -13)
      .attr("width", 90)
      .attr("height", 26)
      .attr("rx", 4)
      .attr("fill", (d: any) => data.bottlenecks.includes(d.id) ? "#C084FC" : "#1E1B4B")
      .attr("stroke", (d: any) => data.bottlenecks.includes(d.id) ? "#C084FC" : "#F8FAFC")
      .attr("stroke-width", 1)
      .attr("stroke-opacity", (d: any) => data.bottlenecks.includes(d.id) ? 0.8 : 0.2);

    node.append("text")
      .attr("text-anchor", "middle")
      .attr("y", "0.35em")
      .text((d: any) => d.id.length > 15 ? d.id.substring(0, 12) + "..." : d.id)
      .attr("font-size", "9px")
      .attr("font-weight", "500")
      .attr("font-family", "var(--font-mono)")
      .attr("fill", "#F8FAFC")
      .attr("fill-opacity", 0.9);

    return () => {};
  }, [data, dimensions, onNodeClick]);

  return (
    <div ref={containerRef} className="w-full h-full border border-white/5 bg-parchment relative overflow-hidden">
      <svg ref={svgRef} className="w-full h-full" />
      <div className="absolute bottom-4 right-4 pointer-events-none flex gap-6 px-6 py-3 bg-ink/5 backdrop-blur-md border border-ink/10 rounded-full">
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] opacity-40 font-mono text-ink">
          <div className="w-2 h-2 rounded-full bg-ink" />
          <span>Component</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] opacity-40 font-mono text-ink">
          <div className="w-2 h-2 rounded-full bg-accent" />
          <span>Bottleneck</span>
        </div>
        <div className="flex items-center gap-2 text-[9px] uppercase tracking-[0.2em] opacity-40 font-mono text-ink">
          <div className="w-4 h-[1px] bg-ink" />
          <span>Flow</span>
        </div>
      </div>
    </div>
  );
};
