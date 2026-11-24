import { Background, Controls, ReactFlow, type EdgeTypes, type NodeTypes } from "@xyflow/react";
import { FilePlus2, Plus, Route, ToggleLeft, ToggleRight } from "lucide-react";
import clsx from "clsx";
import "@xyflow/react/style.css";
import { useFlowPage } from "./hook";
import UtilityEdge, { DocumentNode } from "./node";
import { useTheme } from '../../theme/index';

const nodeTypes = { documentNode: DocumentNode } satisfies NodeTypes;
const edgeTypes = { utility_edge: UtilityEdge } satisfies EdgeTypes;

export const FlowSystem = () => {
    const {
        flows,
        documentsTypes,
        selectedFlow,
        selectedFlowId,
        setSelectedFlowId,
        flowForm,
        setFlowForm,
        flowFormVisible,
        setFlowFormVisible,
        selectedDocumentTypeId,
        setSelectedDocumentTypeId,
        actionName,
        setActionName,
        conditionRules,
        setConditionRules,
        loading,
        saving,
        error,
        nodes,
        onNodesChange,
        saveNodePosition,
        edges,
        onEdgesChange,
        createFlow,
        toggleFlowActive,
        addStep,
        onConnect,
    } = useFlowPage();
    const { theme } = useTheme()

    return (
        <div className="flex h-full min-h-0 flex-col bg-base-100">
            <header className="flex min-h-19 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4">
                <Route size={20} className="text-neutral" />
                <div>
                    <h1 className="font-bold">Editor de flujos</h1>
                    <p className="text-xs text-base-content/60">
                        Define los pasos y transiciones de tus ventas corporativas.
                    </p>
                </div>
                {selectedFlow && (
                    <button
                        type="button"
                        onClick={() => void toggleFlowActive()}
                        disabled={saving}
                        className={clsx("btn btn-sm ml-auto", selectedFlow.is_active ? "btn-success" : "btn-ghost")}
                    >
                        {selectedFlow.is_active ? <ToggleRight size={17} /> : <ToggleLeft size={17} />}
                        {selectedFlow.is_active ? "Flujo activo" : "Flujo inactivo"}
                    </button>
                )}
            </header>

            <section className="space-y-3 border-b border-base-300 bg-base-100 p-4">
                <div className="flex flex-wrap items-end gap-3">
                    <label className="flex min-w-56 flex-1 flex-col gap-1">
                        <span className="text-xs font-medium">Flujo de ventas</span>
                        <select
                            className="select select-sm"
                            value={selectedFlowId}
                            onChange={(event) => setSelectedFlowId(event.target.value)}
                            disabled={loading || flows.length === 0}
                        >
                            {flows.length === 0 && <option value="">Crea un flujo para comenzar</option>}
                            {flows.map((flow) => (
                                <option key={flow.id} value={flow.id}>
                                    {flow.name} ({flow.code})
                                </option>
                            ))}
                        </select>
                    </label>
                    <button
                        type="button"
                        className="btn btn-sm btn-outline"
                        onClick={() => setFlowFormVisible((visible) => !visible)}
                    >
                        <Plus size={15} />
                        {flowFormVisible ? "Cerrar formulario" : "Nuevo flujo"}
                    </button>
                </div>

                {flowFormVisible && (
                    <form onSubmit={createFlow} className="grid gap-3 rounded-sm border border-base-300 p-3 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_2fr_auto]">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Código</span>
                            <input
                                className="input input-sm"
                                value={flowForm.code}
                                onChange={(event) => setFlowForm((current) => ({ ...current, code: event.target.value }))}
                                required
                                maxLength={100}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Nombre</span>
                            <input
                                className="input input-sm"
                                value={flowForm.name}
                                onChange={(event) => setFlowForm((current) => ({ ...current, name: event.target.value }))}
                                required
                                maxLength={250}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Descripción</span>
                            <input
                                className="input input-sm"
                                value={flowForm.description}
                                onChange={(event) => setFlowForm((current) => ({ ...current, description: event.target.value }))}
                            />
                        </label>
                        <button className="btn btn-primary btn-sm self-end" type="submit" disabled={saving}>
                            {saving ? <span className="loading loading-spinner loading-xs" /> : <FilePlus2 size={15} />}
                            Crear flujo
                        </button>
                    </form>
                )}

                {selectedFlow && (
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(12rem,1fr)_minmax(12rem,1fr)_minmax(12rem,1fr)_auto]">
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Agregar tipo de documento como paso</span>
                            <select
                                className="select select-sm"
                                value={selectedDocumentTypeId}
                                onChange={(event) => setSelectedDocumentTypeId(event.target.value)}
                                disabled={saving || documentsTypes.length === 0}
                            >
                                <option value="">Selecciona un documento</option>
                                {documentsTypes.map((documentType) => (
                                    <option key={documentType.id} value={documentType.id}>
                                        {documentType.name} ({documentType.code})
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Acción al conectar</span>
                            <input
                                className="input input-sm"
                                value={actionName}
                                onChange={(event) => setActionName(event.target.value)}
                                maxLength={150}
                            />
                        </label>
                        <label className="flex flex-col gap-1">
                            <span className="text-xs font-medium">Reglas de transición (JSON)</span>
                            <input
                                className="input input-sm font-mono"
                                value={conditionRules}
                                onChange={(event) => setConditionRules(event.target.value)}
                                placeholder='{"requires_stock": true}'
                            />
                        </label>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm self-end"
                            onClick={() => void addStep()}
                            disabled={saving || !selectedDocumentTypeId || !selectedFlow.is_active}
                            title={!selectedFlow.is_active ? "Activa el flujo para editarlo" : undefined}
                        >
                            <Plus size={15} />
                            Agregar paso
                        </button>
                    </div>
                )}
                {!selectedFlow && !flowFormVisible && (
                    <p className="text-sm text-base-content/60">Crea un flujo para comenzar a diseñar sus pasos.</p>
                )}
                {selectedFlow && !selectedFlow.is_active && (
                    <p className="text-xs text-warning">Activa el flujo para agregar pasos o transiciones.</p>
                )}
                {error && <p className="text-sm text-error" role="alert">{error}</p>}
            </section>

            <div className="relative min-h-0 flex-1 bg-base-200/30">
                {loading ? (
                    <div className="absolute inset-4 animate-pulse rounded-sm bg-base-300/60" />
                ) : nodes.length === 0 ? (
                    <div className="flex h-full items-center justify-center p-8 text-center text-sm text-base-content/60">
                        Agrega un tipo de documento para crear el primer paso del flujo.
                    </div>
                ) : (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        onNodesChange={onNodesChange}
                        onNodeDragStop={(_, node) => void saveNodePosition(node)}
                        onEdgesChange={onEdgesChange}
                        onConnect={(connection) => void onConnect(connection)}
                        deleteKeyCode={null}
                        nodesDraggable={selectedFlow?.is_active ?? false}
                        nodesConnectable={selectedFlow?.is_active ?? false}
                        fitView
                    >
                        <Background bgColor={theme === 'lofi' ? 'white' : 'black'} />
                        <Controls />
                    </ReactFlow>
                )}
            </div>
        </div>
    );
};
