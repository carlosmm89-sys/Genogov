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
    borderRadius: 0,
  });

  const relationType = data?.relationType || RelationType.BLOOD;

  let strokeColor = '#0f172a'; // slate-900 (solid black/dark by default)
  let strokeWidth = 2;
  let strokeDasharray = '';
  let animation = '';
  let isDoubleLine = false;

  switch (relationType) {
    case RelationType.MARRIAGE:
      strokeColor = '#0284c7'; // blue-600
      strokeWidth = 2;
      break;
    case RelationType.DIVORCE:
      strokeColor = '#0284c7';
      break;
    case RelationType.SEPARATION:
      strokeColor = '#0284c7';
      break;
    case RelationType.COHABITATION:
      strokeColor = '#475569';
      strokeDasharray = '4,4';
      break;
    case RelationType.CONFLICT:
      strokeColor = '#ef4444'; // red-500
      strokeWidth = 2;
      strokeDasharray = '5,2,1,2'; // Zigzag simulation
      animation = 'animate-pulse';
      break;
    case RelationType.CLOSE:
      strokeColor = '#22c55e'; // green-500
      strokeWidth = 4;
      isDoubleLine = true;
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
      {isDoubleLine && (
        <BaseEdge
          path={edgePath}
          style={{
            stroke: 'white',
            strokeWidth: strokeWidth - 2,
          }}
        />
      )}
      {relationType === RelationType.DIVORCE && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 14,
              pointerEvents: 'all',
              fontWeight: 'bold',
              color: strokeColor,
            }}
            className="nodrag nopan bg-white px-1 leading-none"
          >
            //
          </div>
        </EdgeLabelRenderer>
      )}
      {relationType === RelationType.SEPARATION && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 14,
              pointerEvents: 'all',
              fontWeight: 'bold',
              color: strokeColor,
            }}
            className="nodrag nopan bg-white px-1 leading-none"
          >
            /
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
            className="nodrag nopan text-red-500 bg-white/50 rounded-full"
          >
            ⚡
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
