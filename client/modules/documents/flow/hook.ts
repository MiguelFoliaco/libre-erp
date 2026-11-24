import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
    useEdgesState,
    useNodesState,
    type Connection,
    type Edge,
    type Node,
} from "@xyflow/react";
import type { DocumentTypes } from "@/lib/document";
import {
    apiClient,
    ApiError,
    type SalesFlowInput,
    type SalesFlowRecord,
    type SalesFlowStepInput,
    type SalesFlowStepRecord,
    type SalesFlowTransitionInput,
    type SalesFlowTransitionRecord,
} from "@/lib/sdk";
import { useToast } from "@/modules/common/toast";

export interface SalesFlowNodeData extends Record<string, unknown> {
    step: SalesFlowStepRecord;
    documentType: DocumentTypes;
    onDelete: (stepId: string) => void;
    onSetInitial: (stepId: string) => void;
    onToggleFinal: (stepId: string) => void;
}

interface SalesFlowEdgeData extends Record<string, unknown> {
    actionName: string;
    onDelete: (transitionId: string) => void;
}

type FlowNode = Node<SalesFlowNodeData, "documentNode">;
type FlowEdge = Edge<SalesFlowEdgeData, "utility_edge">;

interface FlowFormValues {
    code: string;
    name: string;
    description: string;
}

const EMPTY_FLOW_FORM: FlowFormValues = {
    code: "",
    name: "",
    description: "",
};

function getErrorMessage(cause: unknown): string {
    return cause instanceof ApiError || cause instanceof Error
        ? cause.message
        : "Ocurrió un error al procesar el flujo de ventas.";
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === "object" && !Array.isArray(value);
}

export const useFlowPage = () => {
    const [flows, setFlows] = useState<SalesFlowRecord[]>([]);
    const [documentsTypes, setDocumentsTypes] = useState<DocumentTypes[]>([]);
    const [selectedFlowId, setSelectedFlowId] = useState("");
    const [flowForm, setFlowForm] = useState<FlowFormValues>(EMPTY_FLOW_FORM);
    const [flowFormVisible, setFlowFormVisible] = useState(false);
    const [selectedDocumentTypeId, setSelectedDocumentTypeId] = useState("");
    const [actionName, setActionName] = useState("Continuar");
    const [conditionRules, setConditionRules] = useState("{}");
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { notify } = useToast();
    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<FlowEdge>([]);

    const replaceStep = useCallback((updated: SalesFlowStepRecord) => {
        setNodes((current) => current.map((node) =>
            node.id === updated.id
                ? { ...node, data: { ...node.data, step: updated } }
                : node,
        ));
    }, [setNodes]);

    const deleteTransition = useCallback(async (transitionId: string) => {
        try {
            await apiClient.remove("sales-flow-transitions", transitionId);
            setEdges((current) => current.filter((edge) => edge.id !== transitionId));
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        }
    }, [notify, setEdges]);

    const deleteStep = useCallback(async (stepId: string) => {
        try {
            await apiClient.remove("sales-flow-steps", stepId);
            setNodes((current) => current.filter((node) => node.id !== stepId));
            setEdges((current) => current.filter((edge) =>
                edge.source !== stepId && edge.target !== stepId,
            ));
            notify("success", "Paso eliminado del flujo.");
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        }
    }, [notify, setEdges, setNodes]);

    const setInitialStep = useCallback(async (stepId: string) => {
        const stepNode = nodes.find((node) => node.id === stepId);
        if (!stepNode || stepNode.data.step.is_initial) return;

        setSaving(true);
        try {
            const initialStep = nodes.find((node) => node.data.step.is_initial);
            if (initialStep) {
                const cleared = await apiClient.update<SalesFlowStepRecord>(
                    "sales-flow-steps",
                    initialStep.id,
                    { is_initial: false },
                );
                replaceStep(cleared);
            }
            const updated = await apiClient.update<SalesFlowStepRecord>(
                "sales-flow-steps",
                stepId,
                { is_initial: true },
            );
            replaceStep(updated);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [nodes, notify, replaceStep]);

    const toggleFinalStep = useCallback(async (stepId: string) => {
        const stepNode = nodes.find((node) => node.id === stepId);
        if (!stepNode) return;

        setSaving(true);
        try {
            const updated = await apiClient.update<SalesFlowStepRecord>(
                "sales-flow-steps",
                stepId,
                { is_final: !stepNode.data.step.is_final },
            );
            replaceStep(updated);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [nodes, notify, replaceStep]);

    const loadFlows = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [flowResult, documentResult] = await Promise.all([
                apiClient.list<SalesFlowRecord>("sales-flows", { limit: 200 }),
                apiClient.list<DocumentTypes>("document-types", { limit: 200 }),
            ]);
            setFlows(flowResult.items);
            setDocumentsTypes(documentResult.items);
            setSelectedFlowId((current) => current || flowResult.items[0]?.id || "");
            if (flowResult.items.length === 0) setFlowFormVisible(true);
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setLoading(false);
        }
    }, [notify]);

    useEffect(() => {
        void loadFlows();
    }, [loadFlows]);

    useEffect(() => {
        if (!selectedFlowId) {
            setNodes([]);
            setEdges([]);
            return;
        }

        let current = true;
        setLoading(true);
        setError("");
        Promise.all([
            apiClient.list<SalesFlowStepRecord>("sales-flow-steps", { limit: 200 }),
            apiClient.list<SalesFlowTransitionRecord>("sales-flow-transitions", { limit: 200 }),
        ])
            .then(([stepResult, transitionResult]) => {
                if (!current) return;
                const steps = stepResult.items.filter((step) => step.flow_id === selectedFlowId);
                const transitions = transitionResult.items.filter((transition) =>
                    transition.flow_id === selectedFlowId,
                );
                const documentTypesById = new Map(
                    documentsTypes.map((documentType) => [documentType.id, documentType]),
                );
                const flowNodes: FlowNode[] = steps.flatMap((step, index) => {
                    const documentType = documentTypesById.get(step.document_type_id);
                    if (!documentType) return [];
                    return [{
                        id: step.id,
                        type: "documentNode",
                        position: {
                            x: Number.isFinite(step.position_x) ? step.position_x : index * 360,
                            y: Number.isFinite(step.position_y) ? step.position_y : 80,
                        },
                        data: {
                            step,
                            documentType,
                            onDelete: deleteStep,
                            onSetInitial: (stepId: string) => void setInitialStep(stepId),
                            onToggleFinal: (stepId: string) => void toggleFinalStep(stepId),
                        },
                    }];
                });
                setNodes(flowNodes);
                setEdges(transitions.map((transition): FlowEdge => ({
                    id: transition.id,
                    source: transition.from_step_id,
                    target: transition.to_step_id,
                    type: "utility_edge",
                    data: {
                        actionName: transition.action_name,
                        onDelete: deleteTransition,
                    },
                })));
            })
            .catch((cause: unknown) => {
                if (!current) return;
                const message = getErrorMessage(cause);
                setError(message);
                notify("error", message);
            })
            .finally(() => {
                if (current) setLoading(false);
            });

        return () => {
            current = false;
        };
    }, [deleteStep, deleteTransition, documentsTypes, notify, selectedFlowId, setEdges, setNodes]);

    const createFlow = useCallback(async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const input: SalesFlowInput = {
            code: flowForm.code.trim(),
            name: flowForm.name.trim(),
            description: flowForm.description.trim() || null,
            is_active: true,
        };

        setSaving(true);
        setError("");
        try {
            const created = await apiClient.create<SalesFlowRecord>("sales-flows", input);
            setFlows((current) => [...current, created]);
            setSelectedFlowId(created.id);
            setFlowForm(EMPTY_FLOW_FORM);
            setFlowFormVisible(false);
            notify("success", "Flujo creado.");
        } catch (cause: unknown) {
            const message = getErrorMessage(cause);
            setError(message);
            notify("error", message);
        } finally {
            setSaving(false);
        }
    }, [flowForm, notify]);

    const toggleFlowActive = useCallback(async () => {
        const flow = flows.find((item) => item.id === selectedFlowId);
        if (!flow) return;

        setSaving(true);
        try {
            const updated = await apiClient.update<SalesFlowRecord>(
                "sales-flows",
                flow.id,
                { is_active: !flow.is_active },
            );
            setFlows((current) => current.map((item) => item.id === updated.id ? updated : item));
            notify("success", updated.is_active ? "Flujo activado." : "Flujo desactivado.");
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [flows, notify, selectedFlowId]);

    const addStep = useCallback(async () => {
        const flow = flows.find((item) => item.id === selectedFlowId);
        const documentType = documentsTypes.find((item) => item.id === selectedDocumentTypeId);
        if (!flow || !documentType) return;
        if (nodes.some((node) => node.data.step.document_type_id === documentType.id)) {
            notify("info", "Este tipo de documento ya forma parte del flujo.");
            return;
        }

        setSaving(true);
        try {
            const input: SalesFlowStepInput = {
                flow_id: flow.id,
                document_type_id: documentType.id,
                code: documentType.code,
                name: documentType.name,
                description: documentType.description ?? null,
                is_initial: nodes.length === 0,
                is_final: false,
                position_x: nodes.length * 360,
                position_y: 80,
            };
            const step = await apiClient.create<SalesFlowStepRecord>("sales-flow-steps", input);
            setNodes((current) => [...current, {
                id: step.id,
                type: "documentNode",
                position: { x: current.length * 360, y: 80 },
                data: {
                    step,
                    documentType,
                    onDelete: deleteStep,
                    onSetInitial: (stepId: string) => void setInitialStep(stepId),
                    onToggleFinal: (stepId: string) => void toggleFinalStep(stepId),
                },
            }]);
            setSelectedDocumentTypeId("");
            notify("success", "Paso agregado al flujo.");
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        } finally {
            setSaving(false);
        }
    }, [deleteStep, documentsTypes, flows, nodes, notify, selectedDocumentTypeId, selectedFlowId, setNodes]);

    const saveNodePosition = useCallback(async (node: FlowNode) => {
        const { x, y } = node.position;
        const step = node.data.step;
        if (step.position_x === x && step.position_y === y) return;

        try {
            const updated = await apiClient.update<SalesFlowStepRecord>(
                "sales-flow-steps",
                step.id,
                { position_x: x, position_y: y },
            );
            replaceStep(updated);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        }
    }, [notify, replaceStep]);

    const onConnect = useCallback(async (connection: Edge | Connection) => {
        if (!selectedFlowId || !connection.source || !connection.target) return;
        const label = actionName.trim();
        if (!label) {
            notify("error", "Indica el nombre de la acción de la transición.");
            return;
        }

        let parsedRules: unknown;
        try {
            parsedRules = JSON.parse(conditionRules) as unknown;
        } catch {
            notify("error", "Las reglas de la transición deben ser JSON válido.");
            return;
        }
        if (!isRecord(parsedRules)) {
            notify("error", "Las reglas de la transición deben ser un objeto JSON.");
            return;
        }

        const input: SalesFlowTransitionInput = {
            flow_id: selectedFlowId,
            from_step_id: connection.source,
            to_step_id: connection.target,
            action_name: label,
            condition_rules: parsedRules,
        };
        try {
            const transition = await apiClient.create<SalesFlowTransitionRecord>(
                "sales-flow-transitions",
                input,
            );
            setEdges((current) => [...current, {
                id: transition.id,
                source: transition.from_step_id,
                target: transition.to_step_id,
                type: "utility_edge",
                data: {
                    actionName: transition.action_name,
                    onDelete: deleteTransition,
                },
            }]);
        } catch (cause: unknown) {
            notify("error", getErrorMessage(cause));
        }
    }, [actionName, conditionRules, deleteTransition, notify, selectedFlowId, setEdges]);

    const availableDocumentTypes = documentsTypes.filter((documentType) =>
        documentType.is_active
        && !nodes.some((node) => node.data.step.document_type_id === documentType.id),
    );
    const selectedFlow = flows.find((flow) => flow.id === selectedFlowId) ?? null;

    return {
        flows,
        documentsTypes: availableDocumentTypes,
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
        setNodes,
        onNodesChange,
        saveNodePosition,
        edges,
        onEdgesChange,
        loadFlows,
        createFlow,
        toggleFlowActive,
        addStep,
        onConnect,
    };
};
