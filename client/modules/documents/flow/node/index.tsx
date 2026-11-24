import {
    BaseEdge,
    EdgeLabelRenderer,
    Handle,
    Position,
    getSmoothStepPath,
    useReactFlow,
    type Edge,
    type EdgeProps,
    type Node,
    type NodeProps,
} from "@xyflow/react";
import {  ChevronRight, CircleCheck, Flag, Trash2 } from "lucide-react";
import type { SalesFlowNodeData } from "../hook";

type FlowNode = Node<SalesFlowNodeData, "documentNode">;
type FlowEdgeData = {
    actionName: string;
    onDelete: (transitionId: string) => void;
};
type FlowEdge = Edge<FlowEdgeData, "utilit_edge">;

export function DocumentNode({ id, data }: NodeProps<FlowNode>) {
    const { step, documentType } = data;

    return (
        <article className="w-72 overflow-hidden rounded-sm border-2 border-neutral-500 bg-base-100 text-base-content shadow-md">
            <Handle type="target" position={Position.Left} className="size-8! flex items-center justify-center bg-pink-500! border-0! ">
                <ChevronRight />
            </Handle>
            <Handle type="source" position={Position.Right} className="size-8! flex items-center justify-center border-0! bg-emerald-500!">
                <ChevronRight />

            </Handle>

            <header className="flex items-start justify-between gap-2 border-b border-base-300 bg-base-200 p-3">
                <div className="min-w-0">
                    <p className="truncate text-xs font-bold uppercase text-base-content/50">{step.code}</p>
                    <h2 className="mt-1 truncate font-semibold">{step.name}</h2>
                    <p className="mt-1 truncate text-xs text-base-content/60">
                        Documento: {documentType.name}
                    </p>
                </div>
                <button
                    type="button"
                    className="nodrag btn btn-ghost btn-xs text-error"
                    onClick={() => data.onDelete(id)}
                    aria-label={`Eliminar paso ${step.name}`}
                    title="Eliminar paso"
                >
                    <Trash2 size={15} />
                </button>
            </header>

            <div className="space-y-3 p-3">
                <p className="min-h-8 text-xs text-base-content/60">
                    {step.description || documentType.description || "Sin descripción"}
                </p>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        className={`nodrag badge badge-sm cursor-pointer gap-1 ${step.is_initial ? "badge-success" : "badge-ghost"}`}
                        onClick={() => data.onSetInitial(id)}
                        aria-pressed={step.is_initial}
                        title="Definir como paso inicial"
                    >
                        <Flag size={12} />
                        {step.is_initial ? "Inicial" : "Marcar inicial"}
                    </button>
                    <button
                        type="button"
                        className={`nodrag badge badge-sm cursor-pointer gap-1 ${step.is_final ? "badge-primary" : "badge-ghost"}`}
                        onClick={() => data.onToggleFinal(id)}
                        aria-pressed={step.is_final}
                        title="Alternar paso final"
                    >
                        <CircleCheck size={12} />
                        {step.is_final ? "Final" : "Marcar final"}
                    </button>
                </div>
            </div>
        </article>
    );
}

export default function UtilityEdge({ id, sourceX, sourceY, targetX, targetY,
    data,
    sourcePosition,
    targetPosition,
}: EdgeProps<FlowEdge>) {
    const { deleteElements } = useReactFlow();
    const [edgePath, labelX, labelY] = getSmoothStepPath({
        sourceX,
        sourceY,
        targetX,
        targetY,
        sourcePosition,
        targetPosition,
        borderRadius: 6,
        offset: 30,
    });

    return (
        <>
            <BaseEdge id={id} path={edgePath} />
            <EdgeLabelRenderer>
                <div
                    className="nodrag nopan flex items-center gap-1 rounded-sm border border-base-300 bg-base-100 px-2 py-1 shadow"
                    style={{
                        position: "absolute",
                        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                        pointerEvents: "all",
                    }}
                >
                    <span className="max-w-32 truncate text-xs">{data?.actionName ?? "Continuar"}</span>
                    <button
                        type="button"
                        className="btn btn-ghost btn-xs text-error"
                        onClick={() => {
                            if (data?.onDelete) data.onDelete(id);
                            else deleteElements({ edges: [{ id }] });
                        }}
                        aria-label="Eliminar transición"
                        title="Eliminar transición"
                    >
                        <Trash2 size={13} />
                    </button>
                </div>
            </EdgeLabelRenderer>
        </>
    );
}
