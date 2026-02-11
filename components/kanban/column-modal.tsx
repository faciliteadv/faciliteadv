'use client'

import { useState, useEffect, useCallback } from "react"
import { X, Plus, Trash2, GripVertical, Check, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import {
    createColumnAction,
    updateColumnAction,
    deleteColumnAction,
    reorderColumnsAction,
    getColumnsByPipeline
} from "@/lib/actions/column-actions"
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core"
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

type Column = {
    id: string
    name: string
    color: string
    position: number
}

type Props = {
    isOpen: boolean
    onClose: () => void
    pipelineId: string
}

const PRESET_COLORS = [
    "#64748b", "#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#6366f1", "#a855f7", "#ec4899", "#1e3a8a", "#064e3b"
]

export function ColumnModal({ isOpen, onClose, pipelineId }: Props) {
    const [columns, setColumns] = useState<Column[]>([])
    const [loading, setLoading] = useState(true)
    const [editingColumn, setEditingColumn] = useState<Column | null>(null)
    const [newName, setNewName] = useState("")
    const [newColor, setNewColor] = useState("#6366f1")

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    )

    const fetchColumns = useCallback(async () => {
        setLoading(true)
        try {
            const cols = await getColumnsByPipeline(pipelineId)
            setColumns(cols.map(c => ({ id: c.id, name: c.name, color: c.color, position: c.position })))
        } catch (error) {
            console.error("Erro ao buscar colunas:", error)
        } finally {
            setLoading(false)
        }
    }, [pipelineId])

    useEffect(() => {
        if (isOpen) {
            fetchColumns()
        }
    }, [isOpen, fetchColumns])

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event

        if (over && active.id !== over.id) {
            const oldIndex = columns.findIndex((i) => i.id === active.id)
            const newIndex = columns.findIndex((i) => i.id === over.id)
            const newItems = arrayMove(columns, oldIndex, newIndex)

            setColumns(newItems)

            try {
                // Call action to save new order
                await reorderColumnsAction(pipelineId, newItems.map(i => i.id))
            } catch (error) {
                console.error("Erro ao reordenar colunas:", error)
                fetchColumns() // Revert on error
            }
        }
    }

    async function handleAddColumn() {
        if (!newName.trim()) return
        try {
            await createColumnAction(pipelineId, newName, newColor)
            setNewName("")
            fetchColumns()
        } catch {
            alert("Erro ao adicionar coluna")
        }
    }

    async function handleUpdateColumn(col: Column) {
        try {
            await updateColumnAction(col.id, col.name, col.color)
            setEditingColumn(null)
            fetchColumns()
        } catch {
            alert("Erro ao atualizar coluna")
        }
    }

    async function handleDeleteColumn(id: string) {
        if (!confirm("Excluir esta etapa? Cards nela podem ficar invisíveis se não houver coluna correspondente.")) return
        try {
            await deleteColumnAction(id)
            fetchColumns()
        } catch {
            alert("Erro ao excluir coluna")
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col">
                <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800">Personalizar Etapas</h2>
                        <p className="text-xs text-slate-500 mt-1">Configure as colunas do seu board</p>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto space-y-6">
                    {/* Add New Column */}
                    <div className="bg-slate-50 rounded-lg p-4 space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Nova Etapa</p>
                        <div className="flex gap-2">
                            <input
                                value={newName}
                                onChange={e => setNewName(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Nome da etapa..."
                            />
                            <div className="relative group">
                                <button
                                    className="p-2.5 border border-slate-300 rounded-lg bg-white"
                                    style={{ color: newColor }}
                                >
                                    <Palette className="w-5 h-5" />
                                </button>
                                <div className="absolute right-0 top-full mt-2 hidden group-hover:grid grid-cols-5 gap-1 p-2 bg-white border border-slate-200 rounded-lg shadow-xl z-10 w-40">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setNewColor(c)}
                                            className="w-6 h-6 rounded-full"
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                            </div>
                            <button
                                onClick={handleAddColumn}
                                className="bg-blue-600 text-white p-2.5 rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                    </div>

                    {/* Columns List */}
                    <div className="space-y-3">
                        <p className="text-sm font-semibold text-slate-700">Etapas Atuais (Arraste para reordenar)</p>
                        {loading ? (
                            <div className="py-8 text-center text-slate-400 text-sm">Carregando...</div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={columns.map(c => c.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    <div className="space-y-2">
                                        {columns.map((col) => (
                                            <SortableColumnItem
                                                key={col.id}
                                                col={col}
                                                onEdit={setEditingColumn}
                                                onDelete={handleDeleteColumn}
                                                editingColumn={editingColumn}
                                                setEditingColumn={setEditingColumn}
                                                handleUpdateColumn={handleUpdateColumn}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </div>

                <div className="p-6 border-t border-slate-100">
                    <button
                        onClick={onClose}
                        className="w-full bg-slate-900 text-white py-2.5 rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
                    >
                        Concluído
                    </button>
                </div>
            </div>
        </div>
    )
}

function SortableColumnItem({
    col,
    onEdit,
    onDelete,
    editingColumn,
    setEditingColumn,
    handleUpdateColumn
}: {
    col: Column,
    onEdit: (c: Column) => void,
    onDelete: (id: string) => void,
    editingColumn: Column | null,
    setEditingColumn: (c: Column | null) => void,
    handleUpdateColumn: (c: Column) => void
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: col.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 1 : 0,
        opacity: isDragging ? 0.5 : 1
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group flex items-center gap-3 p-3 bg-white border border-slate-200 rounded-lg hover:border-blue-200 transition-all shadow-sm",
                isDragging && "border-blue-300 ring-2 ring-blue-100 shadow-md"
            )}
        >
            <div className="cursor-grab text-slate-300" {...attributes} {...listeners}>
                <GripVertical className="w-4 h-4" />
            </div>

            <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: col.color }} />

            {editingColumn?.id === col.id ? (
                <div className="flex-1 flex gap-2">
                    <input
                        autoFocus
                        value={editingColumn.name}
                        onChange={e => setEditingColumn({ ...editingColumn, name: e.target.value })}
                        className="flex-1 px-2 py-1 border border-blue-300 rounded outline-none text-sm"
                        onKeyDown={e => {
                            if (e.key === 'Enter') handleUpdateColumn(editingColumn)
                            if (e.key === 'Escape') setEditingColumn(null)
                        }}
                    />
                    <button onClick={() => handleUpdateColumn(editingColumn)} className="text-blue-600">
                        <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingColumn(null)} className="text-slate-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <span className="flex-1 text-sm text-slate-700 font-medium truncate">{col.name}</span>
            )}

            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {!editingColumn && (
                    <button
                        onClick={() => onEdit(col)}
                        className="p-1 px-2 text-xs text-blue-600 hover:bg-blue-50 rounded"
                    >
                        Editar
                    </button>
                )}
                <button
                    onClick={() => onDelete(col.id)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        </div>
    )
}
