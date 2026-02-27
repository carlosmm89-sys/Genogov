import React, { useState, useCallback, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Connection,
  Edge,
  Panel,
  Node,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { Individual, Family, Gender, RelationType, RiskLevel, createIndividual, createFamily } from './types';
import { IndividualNode, FamilyNode } from './components/Nodes';
import { GenogramEdge } from './components/Edges';
import { GoogleGenAI } from "@google/genai";
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Plus,
  Users,
  UserPlus,
  Trash2,
  Download,
  Settings,
  LayoutGrid,
  Table as TableIcon,
  Search,
  ChevronRight,
  Save,
  FileText,
  AlertTriangle,
  Printer,
  Building2,
  Eye,
  EyeOff,
  Sparkles,
  Loader2
} from 'lucide-react';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const nodeTypes = {
  individual: IndividualNode,
  family: FamilyNode,
};

const edgeTypes = {
  genogram: GenogramEdge,
};

export default function App() {
  const [individuals, setIndividuals] = useState<Individual[]>([]);
  const [families, setFamilies] = useState<Family[]>([]);
  const [viewMode, setViewMode] = useState<'visual' | 'table'>('visual');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isLinkWizardOpen, setIsLinkWizardOpen] = useState(false);

  // Link Wizard State
  const [linkSourceId, setLinkSourceId] = useState("");
  const [linkTargetId, setLinkTargetId] = useState("");
  const [linkType, setLinkType] = useState<RelationType>(RelationType.BLOOD);

  // Family Wizard State
  const [wizardFather, setWizardFather] = useState("");
  const [wizardMother, setWizardMother] = useState("");
  const [wizardChildren, setWizardChildren] = useState<{ name: string, gender: Gender }[]>([]);

  // Municipality Context State
  const [caseNumber, setCaseNumber] = useState("EXP-2024-8921");
  const [neighborhood, setNeighborhood] = useState("Centro - Casco Antiguo");
  const [socialWorker] = useState("Ana García (TS-45)");
  const [caseStatus] = useState("Activo / Seguimiento");
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiDiagnosis, setAiDiagnosis] = useState<string | null>(null);

  // React Flow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // Sync Privacy Mode to nodes
  React.useEffect(() => {
    setNodes(nds => nds.map(n => ({
      ...n,
      data: { ...n.data, isPrivacyMode }
    })));
  }, [isPrivacyMode, setNodes]);

  // Persistence
  const saveTree = async () => {
    try {
      const response = await fetch('/api/trees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: caseNumber,
          name: `Expediente ${caseNumber}`,
          case_number: caseNumber,
          data: { nodes, edges, individuals, families }
        })
      });
      if (response.ok) {
        await logAction("Guardado", "Se ha guardado una nueva versión del genograma.");
        alert("Expediente guardado correctamente en la base de datos municipal.");
      }
    } catch (error) {
      console.error("Save error:", error);
    }
  };

  const logAction = async (action: string, details: string) => {
    try {
      await fetch(`/api/trees/${caseNumber}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_email: "CarlosMM89@gmail.com",
          action,
          details
        })
      });
      fetchLogs();
    } catch (error) {
      console.error("Log error:", error);
    }
  };

  const fetchLogs = async () => {
    try {
      const response = await fetch(`/api/trees/${caseNumber}/logs`);
      const data = await response.json();
      setAuditLogs(data);
    } catch (error) {
      console.error("Fetch logs error:", error);
    }
  };

  React.useEffect(() => {
    fetchLogs();

    // Load initial data from Supabase if available
    const loadTree = async () => {
      try {
        const response = await fetch(`/api/trees/${caseNumber}`);
        if (response.ok) {
          const data = await response.json();
          if (data && data.data) {
            setNodes(data.data.nodes || []);
            setEdges(data.data.edges || []);
            setIndividuals(data.data.individuals || []);
            setFamilies(data.data.families || []);
          }
        }
      } catch (error) {
        console.error("Error loading tree data:", error);
      }
    };

    loadTree();
  }, [caseNumber, setNodes, setEdges]);

  const generateReport = () => {
    setIsReportOpen(true);
  };

  const runAiDiagnosis = async () => {
    if (individuals.length === 0) return;
    setIsAnalyzing(true);
    await logAction("IA Diagnosis", "Se ha solicitado un diagnóstico social asistido por IA.");
    try {
      const prompt = `Actúa como un experto en Trabajo Social. Analiza el siguiente genograma familiar y proporciona un diagnóstico social profesional, identificando riesgos, fortalezas y sugerencias de intervención municipal.
      
      Datos de la familia:
      ${JSON.stringify(individuals.map(i => ({
        nombre: i.firstName,
        genero: i.gender,
        riesgo: i.riskLevel,
        fallecido: i.isDeceased,
        notas: i.notes
      })))}
      
      Relaciones:
      ${JSON.stringify(edges.map(e => ({
        tipo: e.data?.relationType
      })))}
      
      Proporciona el diagnóstico en formato Markdown estructurado.`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: prompt,
      });

      setAiDiagnosis(response.text || "No se pudo generar el diagnóstico.");
    } catch (error) {
      console.error("AI Error:", error);
      setAiDiagnosis("Error al conectar con el motor de IA municipal.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const exportGedcom = () => {
    logAction("Exportación", "Se ha exportado el expediente en formato GEDCOM.");
    const gedcomContent = `0 HEAD
1 SOUR GenoGov
1 GEDC
2 VERS 5.5
1 CHAR UTF-8
${individuals.map(i => `0 @I${i.id}@ INDI
1 NAME ${i.firstName} /${i.lastName}/
1 SEX ${i.gender === Gender.MALE ? 'M' : 'F'}
1 BIRT
2 DATE ${i.birthDate || 'UNKNOWN'}`).join('\n')}
0 TRLR`;

    const blob = new Blob([gedcomContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${caseNumber}.ged`;
    link.click();
  };

  const riskSummary = useMemo(() => {
    return individuals.reduce((acc, curr) => {
      acc[curr.riskLevel] = (acc[curr.riskLevel] || 0) + 1;
      return acc;
    }, { [RiskLevel.HIGH]: 0, [RiskLevel.MEDIUM]: 0, [RiskLevel.LOW]: 0, [RiskLevel.NONE]: 0 });
  }, [individuals]);

  const onConnect = useCallback(
    (params: Connection) => {
      const newEdge = {
        ...params,
        id: `e-${params.source}-${params.target}`,
        type: 'genogram',
        data: { relationType: RelationType.BLOOD }
      };
      setEdges((eds) => addEdge(newEdge, eds));
    },
    [setEdges]
  );

  const addPerson = (gender: Gender) => {
    const newPerson = createIndividual({
      firstName: gender === Gender.MALE ? 'Nuevo Hombre' : 'Nueva Mujer',
      gender
    });

    logAction("Creación", `Añadido nuevo individuo: ${newPerson.firstName}`);

    const newNode: Node = {
      id: newPerson.id,
      type: 'individual',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: `${newPerson.firstName}`,
        gender: newPerson.gender,
        riskLevel: newPerson.riskLevel,
        isDeceased: newPerson.isDeceased
      },
    };

    setIndividuals(prev => [...prev, newPerson]);
    setNodes(nds => [...nds, newNode]);

    return newPerson;
  };

  const deleteSelected = () => {
    if (selectedId) {
      const person = individuals.find(i => i.id === selectedId);
      logAction("Eliminación", `Eliminado individuo: ${person?.firstName}`);
      setNodes(nds => nds.filter(n => n.id !== selectedId));
      setEdges(eds => eds.filter(e => e.source !== selectedId && e.target !== selectedId));
      setIndividuals(prev => prev.filter(i => i.id !== selectedId));
      setSelectedId(null);
    } else if (selectedEdgeId) {
      setEdges(eds => eds.filter(e => e.id !== selectedEdgeId));
      setSelectedEdgeId(null);
    }
  };

  const onNodeClick = (_: any, node: Node) => {
    setSelectedId(node.id);
    setSelectedEdgeId(null);
  };

  const onEdgeClick = (_: any, edge: Edge) => {
    setSelectedEdgeId(edge.id);
    setSelectedId(null);
  };

  // Keyboard shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key.toLowerCase() === 'w') addPerson(Gender.MALE);
      if (e.key.toLowerCase() === 'e') addPerson(Gender.FEMALE);
      if (e.key.toLowerCase() === 'f') setIsWizardOpen(true);
      if (e.key === 'Delete' || e.key === 'Backspace') deleteSelected();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [addPerson, deleteSelected]);

  return (
    <div className="flex h-screen w-full bg-[#F8F9FA] overflow-hidden font-sans text-slate-900">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-slate-200 flex flex-col shadow-sm z-10">
        <div className="p-6 border-bottom border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Building2 size={22} />
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tight leading-tight">GenoGov</h1>
              <p className="text-[10px] uppercase tracking-widest font-semibold text-slate-400">Ayuntamiento</p>
            </div>
          </div>

          {/* Case Context Card */}
          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 mb-2">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={14} className="text-indigo-600" />
              <span className="text-xs font-bold text-slate-700">{caseNumber}</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Barrio:</span>
                <span className="font-medium text-slate-700">{neighborhood}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Trabajador:</span>
                <span className="font-medium text-slate-700">{socialWorker}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Estado:</span>
                <span className="font-medium text-emerald-600">{caseStatus}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Herramientas</div>

          <button
            onClick={() => addPerson(Gender.MALE)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors group"
          >
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md group-hover:bg-blue-100 transition-colors">
              <UserPlus size={16} />
            </div>
            Nuevo Hombre (W)
          </button>

          <button
            onClick={() => addPerson(Gender.FEMALE)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors group"
          >
            <div className="p-1.5 bg-pink-50 text-pink-600 rounded-md group-hover:bg-pink-100 transition-colors">
              <UserPlus size={16} />
            </div>
            Nueva Mujer (E)
          </button>

          <button
            onClick={() => setIsLinkWizardOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors group"
          >
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-md group-hover:bg-emerald-100 transition-colors">
              <Users size={16} />
            </div>
            Nuevo Vínculo Manual
          </button>

          <button
            onClick={() => setIsWizardOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors group"
          >
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md group-hover:bg-indigo-100 transition-colors">
              <Plus size={16} />
            </div>
            Asistente Familiar (F)
          </button>

          <button
            onClick={() => setIsLogsOpen(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-colors group"
          >
            <div className="p-1.5 bg-slate-50 text-slate-600 rounded-md group-hover:bg-slate-100 transition-colors">
              <FileText size={16} />
            </div>
            Historial de Cambios
          </button>

          <div className="pt-6">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Vistas</div>
            <button
              onClick={() => setViewMode('visual')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'visual' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <LayoutGrid size={18} />
              Árbol Visual
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              <TableIcon size={18} />
              Hoja de Datos
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={deleteSelected}
            disabled={!selectedId}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-all"
          >
            <Trash2 size={16} />
            Eliminar Selección
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {/* Header */}
        <header className="h-16 border-b border-slate-100 flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Buscar individuo..."
                className="pl-10 pr-4 py-2 bg-slate-50 border-none rounded-full text-sm w-64 focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
            <button
              onClick={() => setIsPrivacyMode(!isPrivacyMode)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${isPrivacyMode ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}
            >
              {isPrivacyMode ? <EyeOff size={14} /> : <Eye size={14} />}
              {isPrivacyMode ? 'MODO PRIVACIDAD ON' : 'MODO PRIVACIDAD OFF'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={exportGedcom}
              title="Exportar GEDCOM"
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
            >
              <Download size={20} />
            </button>
            <button
              onClick={generateReport}
              className="flex items-center gap-2 px-3 py-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all text-sm font-medium"
            >
              <Printer size={18} />
              <span className="hidden sm:inline">Informe Social</span>
            </button>
            <div className="h-8 w-[1px] bg-slate-100 mx-2" />
            <button
              onClick={saveTree}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all"
            >
              <Save size={16} />
              Guardar Expediente
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 relative">
          {viewMode === 'visual' ? (
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              defaultEdgeOptions={{ type: 'genogram' }}
              fitView
              className="bg-slate-50"
            >
              <Background color="#E2E8F0" gap={20} />
              <Controls className="!bg-white !border-slate-200 !shadow-sm" />
              <MiniMap
                nodeStrokeColor={(n) => {
                  if (n.type === 'individual') return '#6366f1';
                  return '#1e293b';
                }}
                nodeColor={(n) => {
                  if (n.type === 'individual') return '#fff';
                  return '#1e293b';
                }}
                className="!bg-white !border-slate-200 !shadow-lg"
              />
              <Panel position="top-right" className="bg-white p-3 rounded-xl border border-slate-200 shadow-xl m-4 max-w-xs h-[calc(100vh-140px)] overflow-y-auto w-80">
                <h3 className="font-bold text-sm mb-4 flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Settings size={14} className="text-indigo-600" />
                    Propiedades
                  </div>
                  <button
                    onClick={runAiDiagnosis}
                    disabled={isAnalyzing}
                    className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-all disabled:opacity-50"
                    title="Diagnóstico con IA"
                  >
                    {isAnalyzing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  </button>
                </h3>

                {aiDiagnosis && (
                  <div className="mb-4 p-3 bg-indigo-50 border border-indigo-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-[10px] font-bold text-indigo-600 uppercase flex items-center gap-1">
                        <Sparkles size={10} />
                        Sugerencia IA
                      </h4>
                      <button onClick={() => setAiDiagnosis(null)} className="text-indigo-400 hover:text-indigo-600">
                        <Plus size={12} className="rotate-45" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-700 leading-relaxed whitespace-pre-wrap italic">
                      {aiDiagnosis}
                    </div>
                  </div>
                )}

                {selectedId ? (
                  <div className="space-y-4">
                    {/* Basic Info */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Datos Personales</h4>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nombre</label>
                        <input
                          type="text"
                          value={individuals.find(i => i.id === selectedId)?.firstName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setIndividuals(prev => prev.map(i => i.id === selectedId ? { ...i, firstName: val } : i));
                            setNodes(nds => nds.map(n => n.id === selectedId ? { ...n, data: { ...n.data, label: val } } : n));
                          }}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">DNI / NIE</label>
                        <input
                          type="text"
                          placeholder="12345678X"
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                      </div>
                    </div>

                    {/* Social Risk Assessment */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={10} />
                        Valoración Social
                      </h4>

                      <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Nivel de Riesgo</label>
                        <select
                          value={individuals.find(i => i.id === selectedId)?.riskLevel || RiskLevel.NONE}
                          onChange={(e) => {
                            const val = e.target.value as RiskLevel;
                            setIndividuals(prev => prev.map(i => i.id === selectedId ? { ...i, riskLevel: val } : i));
                            setNodes(nds => nds.map(n => n.id === selectedId ? { ...n, data: { ...n.data, riskLevel: val } } : n));
                          }}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        >
                          <option value={RiskLevel.NONE}>Sin Riesgo Detectado</option>
                          <option value={RiskLevel.LOW}>Riesgo Bajo (Seguimiento)</option>
                          <option value={RiskLevel.MEDIUM}>Riesgo Medio (Intervención)</option>
                          <option value={RiskLevel.HIGH}>Riesgo Alto (Urgente)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="isDeceased"
                          checked={individuals.find(i => i.id === selectedId)?.isDeceased || false}
                          onChange={(e) => {
                            const val = e.target.checked;
                            setIndividuals(prev => prev.map(i => i.id === selectedId ? { ...i, isDeceased: val } : i));
                            setNodes(nds => nds.map(n => n.id === selectedId ? { ...n, data: { ...n.data, isDeceased: val } } : n));
                          }}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <label htmlFor="isDeceased" className="text-sm text-slate-700">Persona Fallecida</label>
                      </div>
                    </div>

                    {/* Resources & Aids */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <Building2 size={10} />
                        Recursos y Ayudas Municipales
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {['RMI', 'Dependencia', 'Teleasistencia', 'Ayuda Domicilio'].map(aid => {
                          const person = individuals.find(i => i.id === selectedId);
                          const hasAid = person?.resources?.includes(aid);
                          return (
                            <button
                              key={aid}
                              onClick={() => {
                                setIndividuals(prev => prev.map(i => {
                                  if (i.id !== selectedId) return i;
                                  const resources = i.resources || [];
                                  return {
                                    ...i,
                                    resources: hasAid ? resources.filter(r => r !== aid) : [...resources, aid]
                                  };
                                }));
                              }}
                              className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-bold border transition-all",
                                hasAid ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-indigo-300"
                              )}
                            >
                              {aid}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Vulnerabilities */}
                    <div className="space-y-3 pt-2 border-t border-slate-100">
                      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                        <AlertTriangle size={10} />
                        Vulnerabilidades Específicas
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {['Discapacidad', 'Desempleo', 'Desahucio', 'Violencia', 'Adicciones'].map(vuln => {
                          const person = individuals.find(i => i.id === selectedId);
                          const hasVuln = person?.vulnerabilities?.includes(vuln);
                          return (
                            <button
                              key={vuln}
                              onClick={() => {
                                setIndividuals(prev => prev.map(i => {
                                  if (i.id !== selectedId) return i;
                                  const vulnerabilities = i.vulnerabilities || [];
                                  return {
                                    ...i,
                                    vulnerabilities: hasVuln ? vulnerabilities.filter(v => v !== vuln) : [...vulnerabilities, vuln]
                                  };
                                }));
                              }}
                              className={cn(
                                "px-2 py-1 rounded-md text-[10px] font-bold border transition-all",
                                hasVuln ? "bg-red-600 text-white border-red-600 shadow-sm" : "bg-white text-slate-500 border-slate-200 hover:border-red-300"
                              )}
                            >
                              {vuln}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2 pt-2 border-t border-slate-100">
                      <label className="block text-xs font-medium text-slate-600">Notas de Intervención</label>
                      <textarea
                        rows={4}
                        placeholder="Observaciones del trabajador social..."
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
                      />
                    </div>
                  </div>
                ) : selectedEdgeId ? (
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo de Relación</h4>
                    <div>
                      <label className="block text-xs font-medium text-slate-600 mb-1">Vínculo Familiar / Social</label>
                      <select
                        value={edges.find(e => e.id === selectedEdgeId)?.data?.relationType as string || RelationType.BLOOD}
                        onChange={(e) => {
                          const val = e.target.value as RelationType;
                          setEdges(eds => eds.map(edge => edge.id === selectedEdgeId ? { ...edge, data: { ...edge.data, relationType: val } } : edge));
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value={RelationType.BLOOD}>Consanguinidad (Hijo/a)</option>
                        <option value={RelationType.MARRIAGE}>Matrimonio / Pareja de Hecho</option>
                        <option value={RelationType.COHABITATION}>Convivencia</option>
                        <option value={RelationType.CONFLICT}>Relación Conflictiva</option>
                        <option value={RelationType.CLOSE}>Relación Muy Estrecha</option>
                        <option value={RelationType.DISTANT}>Relación Distante</option>
                        <option value={RelationType.DIVORCE}>Divorcio / Ruptura</option>
                        <option value={RelationType.SEPARATION}>Separación</option>
                      </select>
                    </div>
                    <p className="text-[10px] text-slate-400 italic leading-relaxed">
                      El tipo de relación define la representación visual en el genograma según los estándares de intervención social.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-center p-4 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    <Users className="text-slate-300 mb-2" size={24} />
                    <p className="text-xs text-slate-400">Selecciona un individuo o una relación para gestionar el expediente.</p>
                  </div>
                )}
              </Panel>
            </ReactFlow>
          ) : (
            <div className="p-8 overflow-auto h-full bg-slate-50">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Individuo</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Género</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Nacimiento</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Estado</th>
                      <th className="px-6 py-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {individuals.map(person => (
                      <tr key={person.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${person.gender === Gender.MALE ? 'bg-blue-100 text-blue-600' : 'bg-pink-100 text-pink-600'}`}>
                              {person.firstName[0]}
                            </div>
                            <span className="font-medium text-slate-700">{person.firstName} {person.lastName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-500 capitalize">{person.gender}</td>
                        <td className="px-6 py-4 text-sm text-slate-500">{person.birthDate || '-'}</td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase rounded-md">Activo</span>
                        </td>
                        <td className="px-6 py-4">
                          <button className="text-indigo-600 hover:text-indigo-800 font-semibold text-sm">Editar</button>
                        </td>
                      </tr>
                    ))}
                    {individuals.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 italic">No hay datos disponibles. Comienza agregando personas al árbol.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Family Wizard Modal */}
      {isWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Users className="text-indigo-600" size={24} />
                Asistente Familiar
              </h2>
              <button
                onClick={() => setIsWizardOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Plus size={20} className="rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                  <label className="block text-[10px] font-bold text-blue-600 uppercase mb-2">Padre</label>
                  <input
                    type="text"
                    value={wizardFather}
                    onChange={(e) => setWizardFather(e.target.value)}
                    placeholder="Nombre del padre"
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 text-slate-700"
                  />
                </div>
                <div className="p-4 bg-pink-50/50 rounded-xl border border-pink-100">
                  <label className="block text-[10px] font-bold text-pink-600 uppercase mb-2">Madre</label>
                  <input
                    type="text"
                    value={wizardMother}
                    onChange={(e) => setWizardMother(e.target.value)}
                    placeholder="Nombre de la madre"
                    className="w-full px-3 py-2 bg-white border border-pink-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 text-slate-700"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Hijos</label>
                  <button
                    onClick={() => setWizardChildren([...wizardChildren, { name: '', gender: Gender.MALE }])}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Plus size={14} />
                    Añadir Hijo
                  </button>
                </div>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {wizardChildren.map((child, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-sm relative pr-8">
                      <input
                        type="text"
                        value={child.name}
                        onChange={(e) => {
                          const newChildren = [...wizardChildren];
                          newChildren[idx].name = e.target.value;
                          setWizardChildren(newChildren);
                        }}
                        placeholder="Nombre del hijo/a"
                        className="flex-1 bg-transparent border-none text-sm outline-none text-slate-700"
                      />
                      <select
                        value={child.gender}
                        onChange={(e) => {
                          const newChildren = [...wizardChildren];
                          newChildren[idx].gender = e.target.value as Gender;
                          setWizardChildren(newChildren);
                        }}
                        className="bg-white border border-slate-200 rounded px-2 py-1 text-xs outline-none text-slate-600"
                      >
                        <option value={Gender.MALE}>Hombre</option>
                        <option value={Gender.FEMALE}>Mujer</option>
                        <option value={Gender.OTHER}>Desconocido</option>
                      </select>
                      <button
                        onClick={() => setWizardChildren(wizardChildren.filter((_, i) => i !== idx))}
                        className="absolute right-3 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                  {wizardChildren.length === 0 && (
                    <p className="text-[11px] text-slate-400 italic">No se han añadido hijos a este núcleo orgánico.</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setWizardFather("");
                  setWizardMother("");
                  setWizardChildren([]);
                  setIsWizardOpen(false);
                }}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  let fatherId = null;
                  let motherId = null;

                  if (wizardFather.trim()) {
                    const p = addPerson(Gender.MALE);
                    setIndividuals(prev => {
                      const updated = [...prev];
                      const target = updated.find(i => i.id === p.id);
                      if (target) target.firstName = wizardFather;
                      return updated;
                    });
                    setNodes(nds => nds.map(n => n.id === p.id ? { ...n, data: { ...n.data, label: wizardFather } } : n));
                    fatherId = p.id;
                  }

                  if (wizardMother.trim()) {
                    const p = addPerson(Gender.FEMALE);
                    setIndividuals(prev => {
                      const updated = [...prev];
                      const target = updated.find(i => i.id === p.id);
                      if (target) target.firstName = wizardMother;
                      return updated;
                    });
                    setNodes(nds => nds.map(n => n.id === p.id ? { ...n, data: { ...n.data, label: wizardMother } } : n));
                    motherId = p.id;
                  }

                  if (fatherId && motherId) {
                    const edgeId = `e-${fatherId}-${motherId}-${Date.now()}`;
                    setEdges(eds => addEdge({ id: edgeId, source: fatherId, target: motherId, type: 'genogram', data: { relationType: RelationType.MARRIAGE } }, eds));
                  }

                  wizardChildren.forEach(child => {
                    if (child.name.trim()) {
                      const p = addPerson(child.gender);
                      setIndividuals(prev => {
                        const updated = [...prev];
                        const target = updated.find(i => i.id === p.id);
                        if (target) target.firstName = child.name;
                        return updated;
                      });
                      setNodes(nds => nds.map(n => n.id === p.id ? { ...n, data: { ...n.data, label: child.name } } : n));

                      const parentSource = fatherId || motherId;
                      if (parentSource) {
                        const edgeId = `e-${parentSource}-${p.id}-${Date.now()}`;
                        setEdges(eds => addEdge({ id: edgeId, source: parentSource, target: p.id, type: 'genogram', data: { relationType: RelationType.BLOOD } }, eds));
                      }
                    }
                  });

                  logAction("Creación", "Familia generada a través del asistente (padres e hijos).");
                  setWizardFather("");
                  setWizardMother("");
                  setWizardChildren([]);
                  setIsWizardOpen(false);
                }}
                className="px-6 py-2 bg-[#5B4DF0] text-white rounded-lg text-sm font-bold hover:bg-indigo-700 transition-all"
              >
                Crear Familia
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Link Wizard Modal */}
      {isLinkWizardOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2 text-slate-800">
                <div className="text-emerald-500">
                  <UserPlus size={24} />
                </div>
                Vínculo Manual
              </h2>
              <button
                onClick={() => setIsLinkWizardOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Plus size={20} className="rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Persona Origen</label>
                <select
                  value={linkSourceId}
                  onChange={(e) => setLinkSourceId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                >
                  <option value="" disabled>Selecciona una persona...</option>
                  {individuals.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName || ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Persona Destino</label>
                <select
                  value={linkTargetId}
                  onChange={(e) => setLinkTargetId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                >
                  <option value="" disabled>Selecciona una persona...</option>
                  {individuals.map(i => <option key={i.id} value={i.id}>{i.firstName} {i.lastName || ''}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2">Tipo de Relación</label>
                <select
                  value={linkType}
                  onChange={(e) => setLinkType(e.target.value as RelationType)}
                  className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-emerald-500 text-slate-600"
                >
                  <option value={RelationType.BLOOD}>Consanguinidad (Hijo/a)</option>
                  <option value={RelationType.MARRIAGE}>Matrimonio / Pareja de Hecho</option>
                  <option value={RelationType.COHABITATION}>Convivencia</option>
                  <option value={RelationType.CONFLICT}>Relación Conflictiva</option>
                  <option value={RelationType.CLOSE}>Relación Muy Estrecha</option>
                  <option value={RelationType.DISTANT}>Relación Distante</option>
                  <option value={RelationType.DIVORCE}>Divorcio / Ruptura</option>
                  <option value={RelationType.SEPARATION}>Separación</option>
                </select>
              </div>
            </div>

            <div className="p-6 bg-white border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => setIsLinkWizardOpen(false)}
                className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (linkSourceId && linkTargetId && linkSourceId !== linkTargetId) {
                    const newEdge = {
                      id: `e-${linkSourceId}-${linkTargetId}-${Date.now()}`,
                      source: linkSourceId,
                      target: linkTargetId,
                      type: 'genogram',
                      data: { relationType: linkType }
                    };
                    setEdges((eds) => addEdge(newEdge, eds));
                    logAction("Vínculo", "Se ha creado un nuevo vínculo manual entre dos individuos.");
                    setLinkSourceId("");
                    setLinkTargetId("");
                    setLinkType(RelationType.BLOOD);
                    setIsLinkWizardOpen(false);
                  } else {
                    alert("Asegúrate de seleccionar dos personas distintas para crear un vínculo.");
                  }
                }}
                className="px-6 py-2 bg-[#75D2AC] text-white rounded-lg text-sm font-bold hover:bg-[#62BFA1] transition-all"
              >
                Establecer Vínculo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Audit Logs Modal */}
      {isLogsOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FileText className="text-indigo-600" size={24} />
                Historial de Auditoría
              </h2>
              <button
                onClick={() => setIsLogsOpen(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Plus size={20} className="rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="p-0 max-h-[60vh] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-slate-50 z-10">
                  <tr className="border-b border-slate-200">
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Usuario</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acción</th>
                    <th className="px-6 py-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Detalles</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.map(log => (
                    <tr key={log.id} className="text-sm hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('es-ES')}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-700">{log.user_email}</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          log.action === 'Guardado' ? "bg-emerald-50 text-emerald-600" :
                            log.action === 'Eliminación' ? "bg-red-50 text-red-600" :
                              log.action === 'IA Diagnosis' ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-600"
                        )}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{log.details}</td>
                    </tr>
                  ))}
                  {auditLogs.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center text-slate-400 italic">No hay registros de auditoría para este expediente.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                onClick={() => setIsLogsOpen(false)}
                className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-lg text-sm font-bold hover:bg-slate-50 transition-all"
              >
                Cerrar Historial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Report Modal */}
      {isReportOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h2 className="text-2xl font-bold text-slate-800">Informe de Valoración Social</h2>
                <p className="text-sm text-slate-500 mt-1">Generado automáticamente para el expediente {caseNumber}</p>
              </div>
              <button
                onClick={() => setIsReportOpen(false)}
                className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <Plus size={24} className="rotate-45 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 bg-red-50 rounded-xl border border-red-100 text-center">
                  <div className="text-2xl font-black text-red-600">{riskSummary[RiskLevel.HIGH]}</div>
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider">Riesgo Alto</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100 text-center">
                  <div className="text-2xl font-black text-orange-600">{riskSummary[RiskLevel.MEDIUM]}</div>
                  <div className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Riesgo Medio</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-100 text-center">
                  <div className="text-2xl font-black text-yellow-600">{riskSummary[RiskLevel.LOW]}</div>
                  <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-wider">Riesgo Bajo</div>
                </div>
              </div>

              {/* Detailed Findings */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Hallazgos Críticos</h3>
                {individuals.filter(i => i.riskLevel === RiskLevel.HIGH).length > 0 ? (
                  <div className="space-y-3">
                    {individuals.filter(i => i.riskLevel === RiskLevel.HIGH).map(person => (
                      <div key={person.id} className="flex items-start gap-4 p-4 bg-white border border-red-200 rounded-xl shadow-sm">
                        <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                          <AlertTriangle size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{person.firstName} {person.lastName}</p>
                          <p className="text-sm text-slate-600 mt-1">Se ha detectado una situación de vulnerabilidad extrema que requiere intervención inmediata por parte de los servicios sociales municipales.</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-slate-500 italic">No se han detectado individuos en situación de riesgo alto.</p>
                )}
              </div>

              {/* Family Dynamics */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-800 border-b pb-2">Dinámica Familiar</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  El núcleo familiar presenta un total de {individuals.length} miembros.
                  Se observa una estructura de {families.length} unidades familiares interconectadas.
                  {individuals.some(i => i.isDeceased) && " Se han identificado miembros fallecidos que podrían tener impacto en el duelo familiar."}
                </p>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-[10px] text-slate-400 italic">
                Este informe es confidencial y para uso exclusivo de los Servicios Sociales.
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsReportOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cerrar
                </button>
                <button
                  className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-2"
                >
                  <Download size={16} />
                  Exportar PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
