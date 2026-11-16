
import React, { useMemo, useState } from 'react'
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
} from 'lucide-react'

export type TableColumn<T> = {
    key: keyof T ;
    label: string
    render?: (value: unknown, row: T, index: number) => React.ReactNode
    className?: string
    hidden?: boolean
}

export type TableAction<T> = {
    label: string
    icon?: React.ReactNode
    onClick: (row: T) => void
    className?: string
    hidden?: (row: T) => boolean
}

type TableProps<T> = {
    data: T[]
    columns: TableColumn<T>[]
    actions?: TableAction<T>[]

    loading?: boolean
    emptyMessage?: string

    pagination?: boolean
    pageSize?: number
    pageSizeOptions?: number[]
}

export function Table<T>({
    data,
    columns,
    actions = [],
    loading = false,
    emptyMessage = 'No hay registros disponibles',
    pagination = true,
    pageSize = 10,
    pageSizeOptions = [5, 10, 20, 50]
}: TableProps<T>) {
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(pageSize)

    const visibleColumns = columns.filter(column => !column.hidden)

    const totalPages = Math.max(1, Math.ceil(data.length / limit))

    const currentPage = Math.min(page, totalPages)

    const paginatedData = useMemo(() => {
        if (!pagination) return data

        const start = (currentPage - 1) * limit
        return data.slice(start, start + limit)
    }, [data, currentPage, limit, pagination])

    const startIndex = (currentPage - 1) * limit

    const getValue = (row: T, key: string) => {
        return key.split('.').reduce<unknown>((value, part) => {
            if (value && typeof value === 'object') {
                return (value as Record<string, unknown>)[part]
            }
            return undefined
        }, row)
    }

    return (
        <div className="w-full space-y-4 ">
            <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-primary/50 rounded-box border border-base-300">
                <table className="table table-xs table-zebra">
                    <thead>
                        <tr>
                            {visibleColumns.map(column => (
                                <th key={String(column.key)} className={column.className}>
                                    {column.label}
                                </th>
                            ))}

                            {actions.length > 0 && (
                                <th className="text-right">Acciones</th>
                            )}
                        </tr>
                    </thead>

                    <tbody>
                        {loading ? (
                            <tr>
                                <td
                                    colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)}
                                    className="h-32 text-center"
                                >
                                    <span className="loading loading-spinner loading-md" />
                                </td>
                            </tr>
                        ) : paginatedData.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={visibleColumns.length + (actions.length > 0 ? 1 : 0)}
                                    className="h-32 text-center text-base-content/60"
                                >
                                    {emptyMessage}
                                </td>
                            </tr>
                        ) : (
                            paginatedData.map((row, index) => (
                                <tr key={startIndex + index}>
                                    {visibleColumns.map(column => {
                                        const value = getValue(row, String(column.key))

                                        return (
                                            <td
                                                key={String(column.key)}
                                                className={column.className}
                                            >
                                                {column.render
                                                    ? column.render(value, row, startIndex + index)
                                                    : String(value ?? '—')}
                                            </td>
                                        )
                                    })}

                                    {actions.length > 0 && (
                                        <td>
                                            <div className="flex justify-end gap-1">
                                                {actions
                                                    .filter(action => !action.hidden?.(row))
                                                    .map((action, actionIndex) => (
                                                        <button
                                                            key={actionIndex}
                                                            type="button"
                                                            title={action.label}
                                                            className={`btn btn-ghost btn-sm ${action.className ?? ''}`}
                                                            onClick={() => action.onClick(row)}
                                                        >
                                                            {action.icon}
                                                            {!action.icon && action.label}
                                                        </button>
                                                    ))}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {pagination && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-sm text-base-content/60">
                        <span>Mostrar</span>

                        <select
                            className="select select-xs"
                            value={limit}
                            onChange={event => {
                                setLimit(Number(event.target.value))
                                setPage(1)
                            }}
                        >
                            {pageSizeOptions.map(size => (
                                <option key={size} value={size}>{size}</option>
                            ))}
                        </select>

                        <span>
                            {data.length === 0
                                ? '0 registros'
                                : `${startIndex + 1}-${Math.min(startIndex + limit, data.length)} de ${data.length} registros`}
                        </span>
                    </div>

                    <div className="join">
                        <button
                            className="join-item btn btn-sm"
                            disabled={currentPage === 1}
                            onClick={() => setPage(1)}
                        >
                            <ChevronsLeft size={16} />
                        </button>

                        <button
                            className="join-item btn btn-sm"
                            disabled={currentPage === 1}
                            onClick={() => setPage(currentPage - 1)}
                        >
                            <ChevronLeft size={16} />
                        </button>

                        <button className="join-item btn btn-sm pointer-events-none">
                            {currentPage} / {totalPages}
                        </button>

                        <button
                            className="join-item btn btn-sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage(currentPage + 1)}
                        >
                            <ChevronRight size={16} />
                        </button>

                        <button
                            className="join-item btn btn-sm"
                            disabled={currentPage === totalPages}
                            onClick={() => setPage(totalPages)}
                        >
                            <ChevronsRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
