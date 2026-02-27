import React from 'react';
import { BaseEdge, EdgeProps, getSmoothStepPath, EdgeLabelRenderer, Edge } from '@xyflow/react';
import { Home } from 'lucide-react';
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
      strokeColor = '#0f172a'; // slate-900 
      strokeWidth = 2;
      break;
    case RelationType.ENGAGEMENT:
      strokeColor = '#0f172a'; // slate-900
      strokeDasharray = '8,8'; // dashed
      strokeWidth = 2;
      break;
    case RelationType.COHABITATION:
    case RelationType.LEGAL_COHABITATION:
      strokeColor = '#0f172a'; // slate-900
      strokeDasharray = '8,4,2,4'; // dash-dot
      strokeWidth = 2;
      break;
    case RelationType.SEPARATION_IN_FACT:
    case RelationType.LEGAL_SEPARATION:
      strokeColor = '#dc2626'; // red-600
      strokeWidth = 2;
      break;
    case RelationType.DIVORCE:
      strokeColor = '#dc2626'; // red-600
      strokeWidth = 2;
      break;
    case RelationType.NULLITY:
      strokeColor = '#dc2626'; // red-600
      strokeWidth = 2;
      break;
    case RelationType.LOVE_AFFAIR:
      strokeColor = '#f43f5e'; // rose-500
      strokeDasharray = '3,6'; // dotted
      strokeWidth = 2;
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
      {relationType === RelationType.LEGAL_COHABITATION && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: 'all',
              color: strokeColor,
            }}
            className="nodrag nopan bg-white p-0.5"
            title="Pareja de hecho (Convivencia legal)"
          >
            <Home size={14} strokeWidth={2.5} />
          </div>
        </EdgeLabelRenderer>
      )}
      {(relationType === RelationType.SEPARATION_IN_FACT || relationType === RelationType.LEGAL_SEPARATION) && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 16,
              pointerEvents: 'all',
              fontWeight: 'bold',
              color: strokeColor,
            }}
            className="nodrag nopan bg-white px-1 leading-none"
            title={relationType === RelationType.LEGAL_SEPARATION ? "Separación Legal" : "Separación de hecho"}
          >
            /
          </div>
        </EdgeLabelRenderer>
      )}
      {relationType === RelationType.DIVORCE && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 16,
              pointerEvents: 'all',
              fontWeight: 'bold',
              color: strokeColor,
            }}
            className="nodrag nopan bg-white px-1 leading-none"
            title="Divorcio"
          >
            //
          </div>
        </EdgeLabelRenderer>
      )}
      {relationType === RelationType.NULLITY && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              fontSize: 16,
              pointerEvents: 'all',
              fontWeight: 'bold',
              color: strokeColor,
            }}
            className="nodrag nopan bg-white px-1 leading-none"
            title="Nulidad Matrimonial"
          >
            ///
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
