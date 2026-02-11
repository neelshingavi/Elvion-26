"use client";

import React, { useCallback, useEffect, useState } from 'react';
import { 
  ReactFlow, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  Edge,
  Node,
  useReactFlow,
  ReactFlowProvider,
  Panel,
  OnSelectionChangeParams
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from "@/context/AuthContext";
import { nodeTypes, StrategyNodeData } from './startup-nodes';
import { NodeEditorPanel } from './node-editor';
import { Loader2, Sparkles, Plus } from 'lucide-react';
import { toast } from 'sonner';

// Initial Nodes for "Zero to One"
const initialNodes: Node<StrategyNodeData>[] = [
  { 
    id: '1', 
    type: 'strategy', 
    position: { x: 250, y: 0 }, 
    data: { 
      label: 'Market Validation Survey', 
      category: 'strategy',
      status: 'completed'
    } 
  },
  { 
    id: '2', 
    type: 'human_loop', 
    position: { x: 250, y: 150 }, 
    data: { 
      label: 'Decision: Pivot or Proceed?', 
      category: 'human_loop',
      status: 'in-progress'
    } 
  },
  { 
    id: '3', 
    type: 'strategy', 
    position: { x: 100, y: 300 }, 
    data: { 
      label: 'Build MVP (v0.1)', 
      category: 'strategy',
      status: 'pending'
    } 
  },
  { 
    id: '4', 
    type: 'networking', 
    position: { x: 400, y: 300 }, 
    data: { 
      label: 'Contact 5 Potential Co-founders', 
      category: 'networking',
      status: 'pending'
    } 
  },
   { 
    id: '5', 
    type: 'automation', 
    position: { x: 650, y: 150 }, 
    data: { 
      label: 'Weekly Competitor Scan', 
      category: 'automation',
      status: 'completed'
    } 
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: '1', target: '2', animated: true },
  { id: 'e2-3', source: '2', target: '3' },
  { id: 'e2-4', source: '2', target: '4' },
];

function CanvasFlow() {
  const { user } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node<StrategyNodeData> | null>(null);
  
  const { screenToFlowPosition: _screenToFlowPosition } = useReactFlow();
  // kept reference for future use but commented out to clean lint
  // const { screenToFlowPosition, getNodes } = useReactFlow();

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  // Handle Selection
  const onSelectionChange = useCallback(({ nodes }: OnSelectionChangeParams) => {
    if (nodes.length > 0) {
      // Cast the node data to StrategyNodeData to match our type
      // We know it's compatible because we set it up that way
      setSelectedNode(nodes[0] as Node<StrategyNodeData>);
    } else {
      setSelectedNode(null);
    }
  }, []);

  // Simulate loading existing graph from Supabase
  useEffect(() => {
    if (user) {
        // In a real app, we would fetch from Supabase here
        setLoading(false);
    }
  }, [user]);

  // Handle Add Node
  const handleAddNode = () => {
    const id = `node-${Date.now()}`;
    const newNode: Node<StrategyNodeData> = {
      id,
      type: 'strategy',
      position: { x: 400, y: 200 }, // Default position, ideally centered on view
      data: {
        label: 'New Strategy Node',
        category: 'strategy',
        status: 'pending',
        metadata: { description: '' }
      },
    };
    
    setNodes((nds) => [...nds, newNode]);
    toast.success("New node added");
    
    // Auto-select the new node
    setTimeout(() => setSelectedNode(newNode), 100);
  };

  // Handle Update Node (from Editor)
  const handleUpdateNode = (id: string, data: Partial<StrategyNodeData>) => {
    setNodes((nds) => nds.map((node) => {
      if (node.id === id) {
        return { ...node, data: { ...node.data, ...data } };
      }
      return node;
    }));
    toast.success("Node updated");
    // Keep selected node in sync
    setSelectedNode((prev) => prev ? { ...prev, data: { ...prev.data, ...data } } : null);
  };

  // Handle Delete Node
  const handleDeleteNode = (id: string) => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setSelectedNode(null);
    toast.success("Node deleted");
  };

  const handleAutoGenerate = async () => {
    setGenerating(true);
    toast.info("Architect Agent is analyzing your startup...");
    
    try {
        const response = await fetch('/api/architect', {
            method: 'POST',
            body: JSON.stringify({ 
                description: "D2C Saree Brand", 
                market: "Tier 2 India" 
            })
        });
        
        const data = await response.json();
        
        if (data.nodes && data.edges) {
            setNodes(data.nodes);
            setEdges(data.edges);
            toast.success("Roadmap generated successfully!");
        }
    } catch (error) {
        console.error("Failed to generate", error);
        toast.error("Failed to generate roadmap.");
    } finally {
        setGenerating(false);
    }
  };

  if (loading) {
     return (
        <div className="h-screen w-full flex items-center justify-center bg-[#0a0a0a]">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
     );
  }

  return (
    <div className="h-screen w-full bg-[#0a0a0a] relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        fitView
        className="bg-[#0a0a0a]"
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} color="#333" />
        <Controls className="!bg-[#1a1a1a] !border-[#333] !fill-white" />
        <MiniMap 
            nodeColor={(node) => {
                switch (node.type) {
                    case 'strategy': return '#3b82f6';
                    case 'human_loop': return '#ef4444';
                    case 'networking': return '#22c55e';
                    case 'funding': return '#eab308';
                    case 'automation': return '#a855f7';
                    default: return '#eee';
                }
            }}
            className="!bg-[#1a1a1a] !border-[#333]" 
            maskColor="rgba(0, 0, 0, 0.7)"
        />
        
        <Panel position="top-right" className="flex gap-2">
            <button 
                onClick={handleAutoGenerate}
                disabled={generating}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium border border-purple-500/30 shadow-[0_0_15px_-3px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Auto-Architect
            </button>
            <button 
                onClick={handleAddNode}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium border border-blue-500/30"
            >
                <Plus className="w-4 h-4" />
                Add Node
            </button>
        </Panel>

        <Panel position="top-left" className="bg-[#1a1a1a]/80 backdrop-blur border border-white/10 p-4 rounded-xl pointer-events-none select-none">
            <h1 className="text-xl font-black text-white tracking-tight">Strategy Canvas</h1>
            <p className="text-xs text-white/50">FounderFlow 2.0 • Visual Engine</p>
        </Panel>

      </ReactFlow>

      {/* NodeEditorPanel with key to force re-mount on selection change */}
      {selectedNode && (
        <NodeEditorPanel 
          key={selectedNode.id}
          selectedNode={selectedNode} 
          onClose={() => setSelectedNode(null)}
          onUpdate={handleUpdateNode}
          onDelete={handleDeleteNode}
        />
      )}
    </div>
  );
}

export default function CanvasPage() {
    return (
        <ReactFlowProvider>
            <CanvasFlow />
        </ReactFlowProvider>
    );
}
