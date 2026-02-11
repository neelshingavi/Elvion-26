import React, { useState } from 'react';
import { X, Save, Trash2 } from 'lucide-react';
import { StrategyNodeData } from './startup-nodes';
import { Node } from '@xyflow/react';

interface NodeEditorPanelProps {
  selectedNode: Node<StrategyNodeData> | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<StrategyNodeData>) => void;
  onDelete: (id: string) => void;
}

export const NodeEditorPanel = ({ selectedNode, onClose, onUpdate, onDelete }: NodeEditorPanelProps) => {
  // Safe to assume selectedNode is present due to parent conditional rendering,
  // but we keep the type check or just cast.
  if (!selectedNode) return null; // Kept for safety, but since parent checks, hooks below won't be violated if we strictly follow "render hooks before return"
  // ... Actually, to strictly satisfy "hooks must be called in same order", 
  // we MUST NOT return early before hooks IF the parent didn't conditionally render. 
  // Since parent DOES conditionally render, this component is never mounted if null.
  // So this check is technically dead code but safe. However, to be 100% partial to linter:
  
  // We will trust the parent logic and move hooks up, 
  // OR just remove this check completely because 'selectedNode' is typed as 'Node | null' 
  // but logic dictates it's not null here.
  
  // Better approach:
  // The parent renders it ONLY if selectedNode is truthy. 
  // So we can assume it's valid. 
  
  // Wait, I cannot remove the check if the Type says it can be null.
  // But if I move hooks up, I need default values.
  
  const [label, setLabel] = useState(selectedNode?.data.label || '');
  const [status, setStatus] = useState<StrategyNodeData['status']>(selectedNode?.data.status || 'pending');
  const [category, setCategory] = useState<StrategyNodeData['category']>(selectedNode?.data.category || 'strategy');
  const [description, setDescription] = useState(selectedNode?.data.metadata?.description || '');

  // Now we can return if null (though it shouldn't happen)
  if (!selectedNode) return null;

  const handleSave = () => {
    onUpdate(selectedNode.id, {
      label,
      status,
      category,
      metadata: {
        ...selectedNode.data.metadata,
        description
      }
    });
  };

  return (
    <div className="absolute top-4 right-4 w-80 bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col z-50 animate-in slide-in-from-right-10">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-white/5">
        <h3 className="font-bold text-white text-sm tracking-wide">Edit Node</h3>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded-lg text-white/50 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[80vh]">
        {/* Label */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Label</label>
          <input 
            type="text" 
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors"
            placeholder="Node Label"
          />
        </div>

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Category</label>
          <select 
            value={category}
            onChange={(e) => setCategory(e.target.value as StrategyNodeData['category'])}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
          >
             <option value="strategy">🔵 Strategy</option>
             <option value="human_loop">🔴 Human Loop</option>
             <option value="networking">🟢 Networking</option>
             <option value="funding">🟡 Funding</option>
             <option value="automation">🟣 Automation</option>
          </select>
        </div>

        {/* Status */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {(['pending', 'in-progress', 'completed', 'blocked'] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  status === s 
                    ? 'bg-blue-500/20 border-blue-500 text-blue-400' 
                    : 'bg-white/5 border-transparent text-white/50 hover:bg-white/10'
                }`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-white/50 uppercase tracking-widest">Description</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500/50 transition-colors min-h-[100px] resize-none"
            placeholder="Describe this step..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/10 bg-white/5 flex items-center justify-between gap-2">
        <button 
          onClick={() => onDelete(selectedNode.id)}
          className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          title="Delete Node"
        >
          <Trash2 className="w-4 h-4" />
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
      </div>
    </div>
  );
};
