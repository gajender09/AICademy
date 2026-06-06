import dagre from "dagre";

/**
 * Converts a nested tree object { label, description, children[] }
 * into flat nodes and edges arrays for React Flow.
 */
export const convertTreeToGraph = (tree, collapsedNodeIds = new Set()) => {
  const nodes = [];
  const edges = [];

  const traverse = (node, parentId = null, depth = 0, pathIndex = "root") => {
    const id = pathIndex;
    const hasChildren = Array.isArray(node.children) && node.children.length > 0;
    const isCollapsed = collapsedNodeIds.has(id);

    nodes.push({
      id,
      type: "mindmap", // custom node type mapped in React Flow
      data: {
        label: node.label || "Unnamed",
        description: node.description || "",
        depth,
        id,
        hasChildren,
        isCollapsed,
      },
      position: { x: 0, y: 0 }, // position computed dynamically by Dagre
    });

    if (parentId) {
      edges.push({
        id: `edge_${parentId}_to_${id}`,
        source: parentId,
        target: id,
        type: "smoothstep",
        animated: true,
      });
    }

    if (hasChildren && !isCollapsed) {
      node.children.forEach((child, index) => {
        traverse(child, id, depth + 1, `${id}-${index}`);
      });
    }
  };

  if (tree) {
    traverse(tree);
  }

  return { nodes, edges };
};

/**
 * Positions React Flow elements dynamically using the Dagre layout engine.
 * Direction defaults to 'LR' (Left-to-Right) for clean mindmap structures.
 */
export const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));

  dagreGraph.setGraph({
    rankdir: direction,
    nodesep: 50,    // node gap vertically
    ranksep: 260,   // gap between depths horizontally (slightly wider to accommodate 220px width node)
    marginx: 40,
    marginy: 40,
  });

  // Verify and record node configurations
  const nodeMap = new Map();
  nodes.forEach((node) => {
    nodeMap.set(node.id, node);
    // Approximate size of our styled card nodes
    dagreGraph.setNode(node.id, { width: 220, height: 90 });
  });

  // Defensive check: Only pass edges to dagre where both source and target exist
  const validEdges = [];
  edges.forEach((edge) => {
    if (nodeMap.has(edge.source) && nodeMap.has(edge.target)) {
      dagreGraph.setEdge(edge.source, edge.target);
      validEdges.push(edge);
    } else {
      console.warn(`Skipping invalid edge: source or target missing.`, edge);
    }
  });

  try {
    dagre.layout(dagreGraph);

    // Apply layout positions back to React Flow nodes
    const layoutedNodes = nodes.map((node) => {
      const dagreNode = dagreGraph.node(node.id);
      if (!dagreNode) return node;

      return {
        ...node,
        position: {
          x: dagreNode.x - 110, // Center coordinate adjustment (half of 220 width)
          y: dagreNode.y - 45,  // Center coordinate adjustment (half of 90 height)
        },
      };
    });

    return { nodes: layoutedNodes, edges: validEdges };
  } catch (error) {
    console.error("Dagre layout engine error. Executing fallback layout...", error);

    // Fallback layout: Depth-based absolute horizontal grid spacing
    const fallbackNodes = nodes.map((node, index) => {
      const depth = node.data.depth || 0;
      return {
        ...node,
        position: {
          x: depth * 280, // Space out columns based on tree depth
          y: index * 110, // Space out nodes vertically
        },
      };
    });

    return { nodes: fallbackNodes, edges };
  }
};
