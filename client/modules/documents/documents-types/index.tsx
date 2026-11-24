
import { useMemo } from "react";
import {
    Check,
    Code,
    FileTypeCorner,
    Pencil,
    PlusCircle,
    RefreshCcw,
    ToggleLeft,
    ToggleRight,
    X,
} from "lucide-react";
import { clsx } from "clsx";
import type { TableAction } from "@/modules/common/table";
import { Table } from "@/modules/common/table";
import type { DocumentTypes } from "@/lib/document";
import { useDocumentsTypesHooks } from "./hook";
import { AnimatePresence, motion } from "motion/react";
import { format } from "@formkit/tempo";

const primaryColor = "bg-linear-to-tr to-gray-500 to-120% from-black";

const transition = {
    duration: 0.25,
    ease: [0.22, 1, 0.36, 1] as const,
};

export const DocumentsTypes = () => {
    const {
        documents,
        pagination,
        loading,
        saving,
        formVisible,
        editingDocument,
        form,
        error,
        refresh,
        next,
        prev,
        updateField,
        startCreate,
        startEdit,
        cancelForm,
        generateCode,
        generatePrefix,
        submit,
        toggleActive,
    } = useDocumentsTypesHooks();

    const actions = useMemo<TableAction<DocumentTypes>[]>(() => [
        {
            label: "Editar",
            icon: <Pencil size={15} />,
            onClick: startEdit,
        },
        {
            label: "Desactivar",
            icon: <ToggleLeft size={17} />,
            className: "text-error",
            hidden: (document) => !document.is_active,
            onClick: (document) => void toggleActive(document),
        },
        {
            label: "Activar",
            icon: <ToggleRight size={17} />,
            className: "text-success",
            hidden: (document) => document.is_active,
            onClick: (document) => void toggleActive(document),
        },
    ], [startEdit, toggleActive]);

    return (
        <div className="w-full bg-base-100 h-screen overflow-y-auto">
            <header className="flex h-19 items-center gap-3 border-b border-base-300 bg-base-100 px-6 py-4">
                <FileTypeCorner size={20} className="text-neutral" />
                <div>
                    <h1 className="font-bold">Tipos de documentos</h1>
                    <p className="text-xs text-base-content/60">
                        Crea y administra los tipos de documentos para el flujo de ventas corporativas (B2B).
                    </p>
                </div>
            </header>

            <motion.main
                layout
                transition={{
                    layout: {
                        duration: 0.3,
                        ease: [0.22, 1, 0.36, 1],
                    },
                }}
                className="mx-auto mt-2 min-h-100 h-fit w-9/10 bg-base-100 p-4"
            >
                <div className="mb-2 flex w-full items-center p-2">
                    <motion.button
                        type="button"
                        onClick={() => void refresh()}
                        disabled={loading}
                        whileTap={{ scale: 0.96 }}
                        transition={{ duration: 0.1 }}
                        className="btn btn-neutral btn-sm ml-auto"
                    >
                        Actualizar
                        <RefreshCcw
                            className={loading ? "animate-spin" : ""}
                            size={14}
                        />
                    </motion.button>

                    <motion.button
                        type="button"
                        onClick={formVisible ? cancelForm : startCreate}
                        whileTap={{ scale: 0.96 }}
                        transition={{ duration: 0.1 }}
                        className={clsx(
                            "btn btn-sm btn-neutral ml-2",
                            primaryColor
                        )}
                    >
                        <AnimatePresence mode="wait" initial={false}>
                            <motion.span
                                key={formVisible ? "cancel" : "create"}
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -5 }}
                                transition={{ duration: 0.15 }}
                                className="flex items-center gap-2"
                            >
                                {formVisible
                                    ? <X size={14} />
                                    : <PlusCircle size={14} />
                                }
                                {formVisible ? "Cancelar" : "Crear"}
                            </motion.span>
                        </AnimatePresence>
                    </motion.button>
                </div>

                <AnimatePresence initial={false}>
                    {formVisible && (
                        <motion.form
                            key="document-form"
                            layout
                            initial={{
                                opacity: 0,
                                y: -12,
                                scale: 0.98,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                y: -8,
                                scale: 0.99,
                            }}
                            transition={transition}
                            onSubmit={submit}
                            className="mb-6 rounded-sm border border-base-300 bg-base-100 p-4"
                        >
                            <AnimatePresence mode="wait" initial={false}>
                                <motion.h2
                                    key={editingDocument ? "edit" : "create"}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="mb-4 font-semibold"
                                >
                                    {editingDocument
                                        ? "Editar tipo de documento"
                                        : "Crear tipo de documento"
                                    }
                                </motion.h2>
                            </AnimatePresence>

                            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">Nombre</span>
                                    <input
                                        className="input input-sm"
                                        value={form.name}
                                        onChange={(event) =>
                                            updateField("name", event.target.value)
                                        }
                                        required
                                        maxLength={150}
                                    />
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">Código</span>
                                    <span className="join">
                                        <input
                                            className="input input-sm join-item w-full"
                                            value={form.code}
                                            onChange={(event) =>
                                                updateField("code", event.target.value)
                                            }
                                            required
                                            maxLength={100}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm join-item"
                                            onClick={generateCode}
                                            aria-label="Generar código"
                                        >
                                            <Code size={16} />
                                        </button>
                                    </span>
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">Prefijo</span>
                                    <span className="join">
                                        <input
                                            className="input input-sm join-item w-full"
                                            value={form.numbering_prefix}
                                            onChange={(event) =>
                                                updateField("numbering_prefix", event.target.value)
                                            }
                                            maxLength={30}
                                        />
                                        <button
                                            type="button"
                                            className="btn btn-sm join-item"
                                            onClick={generatePrefix}
                                            aria-label="Generar prefijo"
                                        >
                                            <Code size={16} />
                                        </button>
                                    </span>
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">Categoría</span>
                                    <input
                                        className="input input-sm"
                                        value={form.category}
                                        onChange={(event) =>
                                            updateField("category", event.target.value)
                                        }
                                        maxLength={50}
                                    />
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">Descripción</span>
                                    <input
                                        className="input input-sm"
                                        value={form.description}
                                        onChange={(event) =>
                                            updateField("description", event.target.value)
                                        }
                                    />
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">Siguiente número</span>
                                    <input
                                        className="input input-sm"
                                        type="number"
                                        min={1}
                                        step={1}
                                        value={form.next_number}
                                        onChange={(event) =>
                                            updateField("next_number", event.target.value)
                                        }
                                        required
                                    />
                                </label>

                                <label className="flex flex-col gap-1">
                                    <span className="text-sm">
                                        Número final (-1 sin límite)
                                    </span>
                                    <input
                                        className="input input-sm"
                                        type="number"
                                        min={-1}
                                        step={1}
                                        value={form.end_number}
                                        onChange={(event) =>
                                            updateField("end_number", event.target.value)
                                        }
                                        required
                                    />
                                </label>
                            </div>

                            <AnimatePresence initial={false}>
                                {error && (
                                    <motion.p
                                        key="form-error"
                                        initial={{ opacity: 0, height: 0, y: -5 }}
                                        animate={{ opacity: 1, height: "auto", y: 0 }}
                                        exit={{ opacity: 0, height: 0, y: -5 }}
                                        transition={{ duration: 0.2 }}
                                        className="mt-3 overflow-hidden text-sm text-error"
                                        role="alert"
                                    >
                                        {error}
                                    </motion.p>
                                )}
                            </AnimatePresence>

                            <div className="mt-4 flex justify-end gap-2">
                                {editingDocument && (
                                    <motion.button
                                        type="button"
                                        className="btn btn-ghost btn-sm"
                                        onClick={cancelForm}
                                        disabled={saving}
                                        whileTap={{ scale: 0.96 }}
                                    >
                                        Cancelar
                                    </motion.button>
                                )}

                                <motion.button
                                    type="submit"
                                    className={clsx(
                                        "btn btn-neutral btn-sm",
                                        primaryColor
                                    )}
                                    disabled={saving}
                                    whileTap={{ scale: 0.97 }}
                                >
                                    {saving
                                        ? <span className="loading loading-spinner loading-xs" />
                                        : <Check size={15} />
                                    }
                                    {editingDocument
                                        ? "Guardar cambios"
                                        : "Crear tipo"
                                    }
                                </motion.button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                <Table
                    data={documents}
                    loading={loading}
                    actions={actions}
                    pagination={false}
                    columns={[
                        { key: "id", label: "ID", kbdType: true, truncate: 10, className: 'w-30' },
                        { key: "code", label: "Código", kbdType: true },
                        { key: "name", label: "Nombre", className: 'w-30' },
                        { key: "description", label: "Descripción", className: 'w-50', truncate: 50 },
                        { key: "numbering_prefix", label: "Prefijo", kbdType: true },
                        { key: "next_number", label: "Sig. N°" },
                        { key: "end_number", label: "N° final" },
                        {
                            key: "is_active",
                            label: "Estado",
                            render: (value) => (
                                <span
                                    className={clsx(
                                        "badge badge-sm",
                                        value ? "badge-success" : "badge-ghost"
                                    )}
                                >
                                    {value ? "Activo" : "Inactivo"}
                                </span>
                            ),
                        },
                        { key: "category", label: "Categoría" },
                        { key: "created_at", label: "Creado", render: (value) => <>{format(value as string, { time: 'short', date: 'short' })}</> },
                    ]}
                />

                <div className="flex items-center mt-2 justify-end gap-2">
                    <span className="mr-2 text-sm text-base-content/60">
                        {documents.length > 0
                            ? `${pagination.offset + 1}-${pagination.offset + documents.length}`
                            : "0 registros"
                        }
                    </span>

                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void prev()}
                        disabled={loading || pagination.offset === 0}
                    >
                        Anterior
                    </button>

                    <button
                        type="button"
                        className="btn btn-sm"
                        onClick={() => void next()}
                        disabled={loading || documents.length < pagination.limit}
                    >
                        Siguiente
                    </button>
                </div>
            </motion.main>
        </div>
    );
};
