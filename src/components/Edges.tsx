import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer, Edge } from '@xyflow/react';
import { RelationType } from '../types';

type GenogramEdgeData = Edge<{ relationType: RelationType }, 'genogram'>;

export const GenogramEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
  data,
}: EdgeProps<GenogramEdgeData>) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const relationType = data?.relationType || RelationType.BLOOD;

  let strokeColor = '#64748b'; // slate-500
  let strokeWidth = 2;
  let strokeDasharray = '';
  let animation = '';

  switch (relationType) {
    case RelationType.MARRIAGE:
      strokeColor = '#475569'; // slate-600
      strokeWidth = 2;
      break;
    case RelationType.DIVORCE:
      strokeColor = '#475569';
      strokeDasharray = '5,5';
      break;
    case RelationType.CONFLICT:
      strokeColor = '#ef4444'; // red-500
      strokeWidth = 3;
      // Zigzag simulation via dasharray isn't perfect but works for simple viz
      strokeDasharray = '2,2'; 
      animation = 'animate-pulse';
      break;
    case RelationType.CLOSE:
      strokeColor = '#22c55e'; // green-500
      strokeWidth = 4;
      break;
    case RelationType.DISTANT:
      strokeColor = '#94a3b8'; // slate-400
      strokeDasharray = '10,10';
      break;
  }

  return (
    <>
      <BaseEdge
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...(style as React.CSSProperties),
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
        }}
        className={animation}
      />
      {relationType === RelationType.DIVORCE && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 12,
              pointerEvents: 'all',
            }}
            className="nodrag nopan bg-white px-1 rounded border border-slate-200 text-slate-500 font-mono"
          >
            //
          </div>
        </EdgeLabelRenderer>
      )}
      {relationType === RelationType.CONFLICT && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 16,
              pointerEvents: 'all',
            }}
            className="nodrag nopan text-red-500"
          >
            ⚡
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
