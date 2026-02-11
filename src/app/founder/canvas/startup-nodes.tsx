import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { 
  Briefcase, 
  Users, 
  Network, 
  DollarSign, 
  Bot, 
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Node Data Interface
export interface StrategyNodeData extends Record<string, unknown> {
  label: string;
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
  category: 'strategy' | 'human_loop' | 'networking' | 'funding' | 'automation';
  metadata?: Record<string, any>;
}

const NodeWrapper = ({ 
  children, 
  selected, 
  className,
  category
}: { 
  children: React.ReactNode;
  selected?: boolean;
  className?: string;
  category: StrategyNodeData['category'];
}) => {
  const glowColors = {
    strategy: 'shadow-[0_0_20px_-5px_rgba(59,130,246,0.5)] border-blue-500/50',
    human_loop: 'shadow-[0_0_20px_-5px_rgba(239,68,68,0.5)] border-red-500/50',
    networking: 'shadow-[0_0_20px_-5px_rgba(34,197,94,0.5)] border-green-500/50',
    funding: 'shadow-[0_0_20px_-5px_rgba(234,179,8,0.5)] border-yellow-500/50',
    automation: 'shadow-[0_0_20px_-5px_rgba(168,85,247,0.5)] border-purple-500/50',
  };

  const bgColors = {
    strategy: 'bg-blue-950/80 backdrop-blur-xl',
    human_loop: 'bg-red-950/80 backdrop-blur-xl',
    networking: 'bg-green-950/80 backdrop-blur-xl',
    funding: 'bg-yellow-950/80 backdrop-blur-xl',
    automation: 'bg-purple-950/80 backdrop-blur-xl',
  };

  return (
    <div className={cn(
      "px-4 py-3 rounded-xl border min-w-[200px] transition-all duration-300",
      bgColors[category],
      glowColors[category],
      selected ? "ring-2 ring-white/50 scale-105" : "hover:scale-105",
      className
    )}>
      {children}
    </div>
  );
};

const StatusIcon = ({ status }: { status: StrategyNodeData['status'] }) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="w-3 h-3 text-green-400" />;
    case 'in-progress': return <Clock className="w-3 h-3 text-blue-400 animate-pulse" />;
    case 'blocked': return <AlertCircle className="w-3 h-3 text-red-400" />;
    default: return <div className="w-3 h-3 rounded-full border border-white/20" />;
  }
};

const NodeHeader = ({ 
  label, 
  icon: Icon,
  status
}: { 
  label: string; 
  icon: any;
  status?: StrategyNodeData['status'];
}) => {
  return (
    <div className="flex items-start gap-3">
      <div className="p-2 rounded-lg bg-white/5 border border-white/10 shrink-0">
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-white truncate leading-tight">{label}</h3>
        <div className="flex items-center gap-1.5 mt-1.5">
          <StatusIcon status={status} />
          <span className="text-[10px] uppercase font-medium tracking-wider text-white/50">
            {status || 'Pending'}
          </span>
        </div>
      </div>
    </div>
  );
};

// 1. Strategy Node (Blue)
export const StrategyNode = memo(({ data, selected }: { data: StrategyNodeData; selected?: boolean }) => {
  return (
    <NodeWrapper selected={selected} category="strategy">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-blue-500 !border-2 !border-black" />
      <NodeHeader label={data.label} icon={Briefcase} status={data.status} />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500 !border-2 !border-black" />
    </NodeWrapper>
  );
});
StrategyNode.displayName = 'StrategyNode';

// 2. Human-in-the-Loop Node (Red)
export const HumanNode = memo(({ data, selected }: { data: StrategyNodeData; selected?: boolean }) => {
  return (
    <NodeWrapper selected={selected} category="human_loop">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-red-500 !border-2 !border-black" />
      <NodeHeader label={data.label} icon={Users} status={data.status} />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-red-500 !border-2 !border-black" />
    </NodeWrapper>
  );
});
HumanNode.displayName = 'HumanNode';

// 3. Networking Node (Green)
export const NetworkingNode = memo(({ data, selected }: { data: StrategyNodeData; selected?: boolean }) => {
  return (
    <NodeWrapper selected={selected} category="networking">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-green-500 !border-2 !border-black" />
      <NodeHeader label={data.label} icon={Network} status={data.status} />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-500 !border-2 !border-black" />
    </NodeWrapper>
  );
});
NetworkingNode.displayName = 'NetworkingNode';

// 4. Funding Node (Yellow)
export const FundingNode = memo(({ data, selected }: { data: StrategyNodeData; selected?: boolean }) => {
  return (
    <NodeWrapper selected={selected} category="funding">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-yellow-500 !border-2 !border-black" />
      <NodeHeader label={data.label} icon={DollarSign} status={data.status} />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-yellow-500 !border-2 !border-black" />
    </NodeWrapper>
  );
});
FundingNode.displayName = 'FundingNode';

// 5. Automation Node (Purple)
export const AutomationNode = memo(({ data, selected }: { data: StrategyNodeData; selected?: boolean }) => {
  return (
    <NodeWrapper selected={selected} category="automation">
      <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-purple-500 !border-2 !border-black" />
      <NodeHeader label={data.label} icon={Bot} status={data.status} />
      <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-purple-500 !border-2 !border-black" />
    </NodeWrapper>
  );
});
AutomationNode.displayName = 'AutomationNode';

export const nodeTypes = {
  strategy: StrategyNode,
  human_loop: HumanNode,
  networking: NetworkingNode,
  funding: FundingNode,
  automation: AutomationNode,
};
