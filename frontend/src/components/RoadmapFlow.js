import React, { useState, useMemo } from 'react';
import { ReactFlow, MiniMap, Controls, Background, ReactFlowProvider, useReactFlow } from '@xyflow/react';
import dagre from 'dagre';
import '@xyflow/react/dist/style.css';

const FlowContent = ({ nodes, edges, onNodeClick, nodeTypes }) => {
  const { fitView } = useReactFlow();

  // Update fitView on node click
  const handleNodeClick = (event, node) => {
    onNodeClick(event, node);
    fitView({ nodes: [{ id: node.id }], duration: 500 });
  };

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodeClick={handleNodeClick}
      fitView
      minZoom={0.2}
      maxZoom={2}
    >
      <MiniMap
        nodeColor={(node) => node.id.startsWith('phase') ? '#28a745' : '#6ede87'}
        nodeStrokeWidth={3}
        zoomable
        pannable
      />
      <Controls />
      <Background color="#ccc" variant="dots" />
    </ReactFlow>
  );
};

const RoadmapFlow = ({ roadmap, courseId }) => {
  const [selectedNode, setSelectedNode] = useState(null);

  // Dagre layout function
  const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));
    dagreGraph.setGraph({ rankdir: direction, nodesep: 50, ranksep: 100 });

    nodes.forEach((node) => {
      dagreGraph.setNode(node.id, { width: node.id.startsWith('phase') ? 250 : 200, height: 80 });
    });

    edges.forEach((edge) => {
      dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    return {
      nodes: nodes.map((node) => ({
        ...node,
        position: {
          x: dagreGraph.node(node.id).x - (node.id.startsWith('phase') ? 125 : 100),
          y: dagreGraph.node(node.id).y - 40,
        },
      })),
      edges,
    };
  };

  // Transform roadmap into nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];

    roadmap.forEach((phaseObj, phaseIndex) => {
      const phaseId = `phase-${phaseIndex}`;
      nodes.push({
        id: phaseId,
        type: 'roadmap',
        data: { label: phaseObj.phase, description: '' },
        draggable: true,
        style: { backgroundColor: '#e6ffed', borderColor: '#28a745' },
      });

      phaseObj.steps.forEach((step, stepIndex) => {
        const stepId = `step-${phaseIndex}-${stepIndex}`;
        nodes.push({
          id: stepId,
          type: 'roadmap',
          data: { label: step, description: '' },
          draggable: true,
        });

        if (stepIndex === 0) {
          edges.push({
            id: `edge-phase-${phaseIndex}-step-${stepIndex}`,
            source: phaseId,
            target: stepId,
            type: 'smoothstep',
            style: { stroke: '#F6AD55', strokeWidth: 3 },
            animated: true,
          });
        }

        if (stepIndex > 0) {
          edges.push({
            id: `edge-step-${phaseIndex}-${stepIndex-1}-${stepIndex}`,
            source: `step-${phaseIndex}-${stepIndex-1}`,
            target: stepId,
            type: 'smoothstep',
            style: { stroke: '#F6AD55', strokeWidth: 3 },
            animated: true,
          });
        }
      });

      if (phaseIndex > 0) {
        const prevPhaseLastStep = `step-${phaseIndex-1}-${roadmap[phaseIndex-1].steps.length-1}`;
        const currentPhaseFirstStep = `step-${phaseIndex}-0`;
        edges.push({
          id: `edge-phase-${phaseIndex-1}-${phaseIndex}`,
          source: prevPhaseLastStep,
          target: currentPhaseFirstStep,
          type: 'smoothstep',
          style: { stroke: '#F6AD55', strokeWidth: 3 },
          animated: true,
        });
      }
    });

    return getLayoutedElements(nodes, edges, 'LR');
  }, [roadmap]);

  // Handle node click
  const onNodeClick = (event, node) => {
    setSelectedNode(node.id);
  };

  // Custom node component
  const RoadmapNode = ({ data, id, selected }) => (
    <div
      className={`roadmap-node ${id.startsWith('phase') ? 'phase-node' : 'step-node'} ${selected ? 'selected' : ''}`}
      aria-label={`Roadmap ${id.startsWith('phase') ? 'phase' : 'step'}: ${data.label}`}
    >
      <h3 className="roadmap-node-title">{data.label}</h3>
      {data.description && <p className="roadmap-node-description">{data.description}</p>}
      <div className="roadmap-handle roadmap-handle-top" />
      <div className="roadmap-handle roadmap-handle-bottom" />
    </div>
  );

  const nodeTypes = { roadmap: RoadmapNode };

  return (
    <div className="roadmap-flow-container">
      <ReactFlowProvider>
        <FlowContent
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
        />
      </ReactFlowProvider>
    </div>
  );
};

export default RoadmapFlow;