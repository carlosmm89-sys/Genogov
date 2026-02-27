import React from 'react';
import { Handle, Position, NodeProps, Node } from '@xyflow/react';
import { Gender, RiskLevel } from '../types';
import { User, UserRound, Baby, AlertTriangle, ShieldAlert } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type IndividualNodeData = Node<{ 
  label: string; 
  gender: Gender; 
  riskLevel?: RiskLevel;
  isDeceased?: boolean;
  isPrivacyMode?: boolean;
}, 'individual'>;

type FamilyNodeData = Node<{ label?: string }, 'family'>;

export const IndividualNode = ({ data, selected }: NodeProps<IndividualNodeData>) => {
  const isMale = data.gender === Gender.MALE;
  const isFemale = data.gender === Gender.FEMALE;
  const isDeceased = data.isDeceased;
  const riskLevel = data.riskLevel || RiskLevel.NONE;
  const isPrivacyMode = data.isPrivacyMode;

  const getRiskColor = (level: RiskLevel) => {
    switch (level) {
      case RiskLevel.HIGH: return 'border-red-500 ring-red-200 bg-red-50';
      case RiskLevel.MEDIUM: return 'border-orange-500 ring-orange-200 bg-orange-50';
      case RiskLevel.LOW: return 'border-yellow-500 ring-yellow-200 bg-yellow-50';
      default: return isMale ? "border-blue-500" : isFemale ? "border-pink-500" : "border-gray-400";
    }
  };

  const maskName = (name: string) => {
    if (!isPrivacyMode) return name;
    return name.split(' ').map(n => n[0] + '***').join(' ');
  };

  const baseBorderColor = isMale ? "border-blue-500" : isFemale ? "border-pink-500" : "border-gray-400";
  const riskBorderColor = riskLevel !== RiskLevel.NONE ? getRiskColor(riskLevel) : baseBorderColor;

  return (
    <div className={cn(
      "relative px-4 py-3 shadow-md rounded-lg bg-white border-2 transition-all min-w-[140px]",
      riskBorderColor,
      selected && "ring-2 ring-offset-2 ring-indigo-500",
      isDeceased && "opacity-90"
    )}>
      <Handle type="target" position={Position.Top} className="w-2.5 h-2.5 !bg-slate-400 border-2 border-white" />
      
      {/* Deceased Cross Overlay */}
      {isDeceased && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <svg viewBox="0 0 100 100" className="w-full h-full opacity-30">
            <line x1="0" y1="0" x2="100" y2="100" stroke="black" strokeWidth="2" />
            <line x1="100" y1="0" x2="0" y2="100" stroke="black" strokeWidth="2" />
          </svg>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className={cn(
          "p-2 rounded-full relative",
          isMale ? "bg-blue-100 text-blue-600" : isFemale ? "bg-pink-100 text-pink-600" : "bg-gray-100 text-gray-600"
        )}>
          {isMale ? <User size={18} /> : isFemale ? <UserRound size={18} /> : <Baby size={18} />}
          
          {riskLevel !== RiskLevel.NONE && (
            <div className="absolute -top-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <AlertTriangle size={12} className={cn(
                riskLevel === RiskLevel.HIGH ? "text-red-600 fill-red-600" : 
                riskLevel === RiskLevel.MEDIUM ? "text-orange-500 fill-orange-500" : "text-yellow-500 fill-yellow-500"
              )} />
            </div>
          )}
        </div>
        
        <div className="flex flex-col">
          <div className="text-sm font-bold text-slate-800 leading-tight">
            {maskName(data.label)}
          </div>
          <div className="text-[10px] font-medium text-slate-500 uppercase tracking-wide">
            {isDeceased ? 'Fallecido' : 'Activo'}
          </div>
        </div>
      </div>

      {riskLevel === RiskLevel.HIGH && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
          <ShieldAlert size={10} />
          RIESGO ALTO
        </div>
      )}

      <Handle type="source" position={Position.Bottom} className="w-2.5 h-2.5 !bg-slate-400 border-2 border-white" />
    </div>
  );
};

export const FamilyNode = ({ data }: NodeProps<FamilyNodeData>) => {
  return (
    <div className="w-3 h-3 rounded-full bg-slate-800 border-2 border-white shadow-md flex items-center justify-center">
      <Handle type="target" position={Position.Top} className="!w-1 !h-1 !bg-slate-400 !border-none" />
      <Handle type="source" position={Position.Bottom} className="!w-1 !h-1 !bg-slate-400 !border-none" />
      <Handle type="left" position={Position.Left} className="!w-1 !h-1 !bg-slate-400 !border-none" />
      <Handle type="right" position={Position.Right} className="!w-1 !h-1 !bg-slate-400 !border-none" />
    </div>
  );
};
