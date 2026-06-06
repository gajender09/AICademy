import React, { memo, useEffect, useMemo, useState, useCallback } from "react";
import ReactFlow, {
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from "reactflow";
import {
  FaExpand,
  FaCompress,
  FaPlus,
  FaMinus,
  FaTimes,
  FaFolderMinus,
  FaFolderOpen,
  FaCrosshairs,
} from "react-icons/fa";
import "reactflow/dist/style.css";
import { convertTreeToGraph, getLayoutedElements } from "./graphUtils";

// Custom Node Component styled inside the mindmap graph
const MindmapNode = memo(({ data }) => {
  const { label, description, depth, id, hasChildren, isCollapsed, onToggleCollapse } = data;
  const isRoot = depth === 0;

  // Determine left border styling based on depth using theme colors
  const borderStyles = [
    { borderLeft: "4px solid var(--forest)" },
    { borderLeft: "4px solid var(--forest)" },
    { borderLeft: "4px solid #5a9e7a" },
    { borderLeft: "4px solid var(--cream-3)" },
  ];

  const cardStyle = isRoot ? {} : (borderStyles[depth] || borderStyles[3]);

  const handleToggle = (e) => {
    e.stopPropagation(); // Avoid selecting the node or opening detail panel
    if (onToggleCollapse) {
      onToggleCollapse(id);
    }
  };

  return (
    <div
      className={`mindmap-flow-node mindmap-node--depth-${Math.min(depth, 3)} ${
        isRoot ? "mindmap-flow-node--root" : ""
      }`}
      style={cardStyle}
    >
      {/* Target Handle on the left side of the card for LR layout */}
      {depth > 0 && (
        <Handle
          type="target"
          position={Position.Left}
          className="mindmap-flow-handle mindmap-flow-handle--target"
        />
      )}

      <div className="mindmap-flow-card">
        <span className="mindmap-flow-card-label">{label}</span>
        {description && <p className="mindmap-flow-card-desc">{description}</p>}
      </div>

      {/* Interactive fold toggle on the right edge if children exist */}
      {hasChildren && (
        <button
          type="button"
          className={`mindmap-node-toggle ${isCollapsed ? "is-collapsed" : ""}`}
          onClick={handleToggle}
          title={isCollapsed ? "Expand branch" : "Collapse branch"}
          aria-label={isCollapsed ? "Expand branch" : "Collapse branch"}
        >
          {isCollapsed ? "+" : "−"}
        </button>
      )}

      {/* Source Handle on the right side of the card for LR layout */}
      <Handle
        type="source"
        position={Position.Right}
        className="mindmap-flow-handle mindmap-flow-handle--source"
        style={{
          visibility: hasChildren ? "visible" : "hidden",
          right: hasChildren ? "-4px" : "-6px",
        }}
      />
    </div>
  );
});

MindmapNode.displayName = "MindmapNode";

const nodeTypes = {
  mindmap: MindmapNode,
};

const defaultEdgeOptions = {
  type: "smoothstep",
  animated: true,
};

const RoadmapMindmapContent = ({ roadmap }) => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [collapsedNodeIds, setCollapsedNodeIds] = useState(new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  // Extract all branch node IDs recursively to support Collapse All (excluding the root)
  const getBranchNodeIds = useCallback((node, pathIndex = "root") => {
    const ids = [];
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    if (hasChildren) {
      if (pathIndex !== "root") {
        ids.push(pathIndex);
      }
      node.children.forEach((child, index) => {
        ids.push(...getBranchNodeIds(child, `${pathIndex}-${index}`));
      });
    }
    return ids;
  }, []);

  const handleToggleCollapse = useCallback((id) => {
    setCollapsedNodeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleCollapseAll = () => {
    if (!roadmap) return;
    const branchIds = getBranchNodeIds(roadmap);
    setCollapsedNodeIds(new Set(branchIds));
  };

  const handleExpandAll = () => {
    setCollapsedNodeIds(new Set());
  };

  const { initialNodes, initialEdges } = useMemo(() => {
    if (!roadmap) return { initialNodes: [], initialEdges: [] };
    const { nodes, edges } = convertTreeToGraph(roadmap, collapsedNodeIds);
    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(nodes, edges);

    // Bind action callback to node data
    const boundNodes = layoutedNodes.map((n) => ({
      ...n,
      data: {
        ...n.data,
        onToggleCollapse: handleToggleCollapse,
      },
    }));

    return { initialNodes: boundNodes, initialEdges: layoutedEdges };
  }, [roadmap, collapsedNodeIds, handleToggleCollapse]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Update nodes and edges dynamically when roadmap object or collapse states change
  useEffect(() => {
    if (roadmap) {
      const { nodes: newNodes, edges: newEdges } = convertTreeToGraph(roadmap, collapsedNodeIds);
      const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(newNodes, newEdges);

      const boundNodes = layoutedNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          onToggleCollapse: handleToggleCollapse,
        },
      }));

      setNodes(boundNodes);
      setEdges(layoutedEdges);

      // Perform a smooth fit view calculation after the DOM re-layouts
      setTimeout(() => {
        fitView({ padding: 0.18, duration: 400 });
      }, 50);
    }
  }, [roadmap, collapsedNodeIds, setNodes, setEdges, handleToggleCollapse, fitView]);

  // Escape key handler for fullscreen mode exit
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullscreen]);

  // Custom details builder inside side panel
  const renderInspectorContent = () => {
    if (!selectedNode) return null;
    const { label, description, depth } = selectedNode;

    let badgeText = "Learning Hub";
    let badgeClass = "badge-root";
    let objectiveText = "Overview of the entire learning journey. Drag and zoom the canvas to inspect core phases.";

    if (depth === 1) {
      badgeText = "Phase Goal";
      badgeClass = "badge-phase";
      objectiveText = "This is a major milestone of your course. Focus on completing all modules within this segment.";
    } else if (depth === 2) {
      badgeText = "Topic Milestone";
      badgeClass = "badge-topic";
      objectiveText = "Actionable skill-building focus. Master this core concept through study and assessments.";
    } else if (depth > 2) {
      badgeText = "Granular Focus";
      badgeClass = "badge-subtopic";
      objectiveText = "Deep-dive topic. Review specific glossary definitions, sample files, and sub-concepts.";
    }

    return (
      <div className="mindmap-inspector-body">
        <header className="mindmap-inspector-header">
          <div className="mindmap-inspector-header-text">
            <span className={`mindmap-inspector-badge ${badgeClass}`}>{badgeText}</span>
            <h3 className="mindmap-inspector-title">{label}</h3>
          </div>
          <button
            type="button"
            className="mindmap-inspector-close"
            onClick={() => setSelectedNode(null)}
            aria-label="Close inspector panel"
          >
            <FaTimes />
          </button>
        </header>

        <div className="mindmap-inspector-section">
          <span className="mindmap-inspector-label">Overview & Purpose</span>
          <p className="mindmap-inspector-desc">{description || "No description provided."}</p>
        </div>

        <div className="mindmap-inspector-section">
          <span className="mindmap-inspector-label">💡 Learning Strategy</span>
          <p className="mindmap-inspector-strategy">{objectiveText}</p>
        </div>

        <div className="mindmap-inspector-section">
          <span className="mindmap-inspector-label">🎯 Action Items</span>
          <ul className="mindmap-inspector-checklist">
            <li>
              <span className="checklist-bullet">✓</span> Review study guide material
            </li>
            <li>
              <span className="checklist-bullet">✓</span> Execute sample exercises
            </li>
            <li>
              <span className="checklist-bullet">✓</span> Complete module quiz
            </li>
          </ul>
        </div>
      </div>
    );
  };

  const handleToggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
    // Smooth view auto-centering after dimensions settle
    setTimeout(() => {
      fitView({ padding: 0.18, duration: 450 });
    }, 150);
  };

  return (
    <div className={`mindmap-wrap ${isFullscreen ? "is-fullscreen" : ""}`}>
      <div className="mindmap-toolbar">
        <div className="mindmap-toolbar-info">
          <h3 className="mindmap-toolbar-title">
            {isFullscreen ? "Interactive Learning Mindmap Explorer" : "Learning Mind Map"}
          </h3>
          <span className="mindmap-toolbar-meta">
            {isFullscreen
              ? "Hold & drag to pan · Click nodes to view strategies · Use tree folding buttons"
              : "AI-built interactive path — zoom, pan, fold branches, and click nodes."}
          </span>
        </div>

        <div className="mindmap-toolbar-actions">
          {/* Dynamic Expand/Collapse Controls */}
          <button
            type="button"
            className="mindmap-action-btn"
            onClick={handleExpandAll}
            title="Expand all branches"
          >
            <FaFolderOpen />
            <span>Expand All</span>
          </button>
          <button
            type="button"
            className="mindmap-action-btn"
            onClick={handleCollapseAll}
            title="Collapse all branches"
          >
            <FaFolderMinus />
            <span>Collapse All</span>
          </button>

          <span className="toolbar-divider" />

          {/* Navigation Zoom utilities */}
          <button
            type="button"
            className="mindmap-action-btn"
            onClick={() => zoomIn()}
            title="Zoom In"
            aria-label="Zoom in"
          >
            <FaPlus />
          </button>
          <button
            type="button"
            className="mindmap-action-btn"
            onClick={() => zoomOut()}
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <FaMinus />
          </button>
          <button
            type="button"
            className="mindmap-action-btn"
            onClick={() => fitView({ padding: 0.18, duration: 400 })}
            title="Fit View to Screen"
            aria-label="Fit view"
          >
            <FaCrosshairs />
          </button>

          <span className="toolbar-divider" />

          {/* Full Screen Toggler */}
          <button
            type="button"
            className="mindmap-action-btn mindmap-action-btn--primary"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit Full Screen (ESC)" : "Explore Full Screen"}
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
            <span>{isFullscreen ? "Exit" : "Full Screen"}</span>
          </button>
        </div>
      </div>

      <div className="mindmap-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={(_, node) => setSelectedNode(node.data)}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ padding: 0.18 }}
          minZoom={0.05}
          maxZoom={2.0}
          nodesConnectable={false}
          nodesDraggable={true}
          elementsSelectable={true}
        >
          <Background color="var(--cream-3)" gap={20} size={1.5} />
          <Controls showInteractive={false} />
        </ReactFlow>

        {/* Sliding drawer situated absolutely inside the flow wrapper for responsive coverage */}
        <div className={`mindmap-inspector-sidebar ${selectedNode ? "is-open" : ""}`}>
          {renderInspectorContent()}
        </div>
      </div>
    </div>
  );
};

const RoadmapMindmap = ({ roadmap }) => {
  return (
    <ReactFlowProvider>
      <RoadmapMindmapContent roadmap={roadmap} />
    </ReactFlowProvider>
  );
};

export default RoadmapMindmap;
