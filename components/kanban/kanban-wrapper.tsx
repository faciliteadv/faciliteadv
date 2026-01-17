'use client'

import { useState } from "react"
import { TaskCard } from "@prisma/client"
import { KanbanBoard } from "./board"
import { WeeklyCalendar } from "./weekly-calendar"
import { LayoutGrid, List, Plus } from "lucide-react"
import { cn } from "@/lib/utils"

import { TaskModal } from "./task-modal"

import { KanbanListView } from "./list-view"

type Props = {
    initialTasks: any[]
    processes: any[] // ProcessOption type
}

export function KanbanWrapper({ initialTasks, processes }: Props) {
    const [activeTab, setActiveTab] = useState<'deadlines' | 'cases'>('deadlines')
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban')
    const [isModalOpen, setIsModalOpen] = useState(false)

    // Filter Tasks (simulated for now, real filtering to come)
    const deadlineTasks = initialTasks.filter(t => t.type === 'DEADLINE' || t.type === 'INTERNAL' || !t.type) // Show all for now until migration fills types

    return (
        <div className="flex flex-col h-[calc(100vh-4rem)]">
            <TaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} processes={processes} />
            {/* Top Bar: Tabs & View Switcher */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">

                {/* Tabs */}
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button
                        onClick={() => setActiveTab('deadlines')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'deadlines' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Prazos e Atividades
                    </button>
                    <button
                        onClick={() => setActiveTab('cases')}
                        className={cn(
                            "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                            activeTab === 'cases' ? "bg-white text-blue-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Processos
                    </button>
                </div>

                {/* Right Side Actions */}
                {activeTab === 'deadlines' && (
                    <div className="flex items-center gap-3">
                        {/* View Mode Switcher */}
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'list' ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                                title="Lista"
                            >
                                <List className="w-4 h-4" />
                            </button>
                            <div className="w-[1px] bg-slate-200" />
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={cn(
                                    "p-2 transition-colors",
                                    viewMode === 'kanban' ? "bg-blue-50 text-blue-600" : "text-slate-400 hover:text-slate-600"
                                )}
                                title="Kanban"
                            >
                                <LayoutGrid className="w-4 h-4" />
                            </button>
                        </div>

                        {/* New Button */}
                        <button
                            onClick={() => setIsModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Tarefa
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-50/50">
                {activeTab === 'deadlines' ? (
                    <div className="h-full flex flex-col">
                        {/* Weekly Calendar */}
                        <WeeklyCalendar tasks={deadlineTasks} />

                        {/* Main View */}
                        <div className="flex-1 overflow-hidden p-6">
                            {viewMode === 'kanban' ? (
                                <KanbanBoard initialTasks={deadlineTasks} />
                            ) : (
                                <KanbanListView tasks={deadlineTasks} />
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex items-center justify-center text-slate-400">
                        Aba de Processos (Em construção)
                    </div>
                )}
            </div>
        </div>
    )
}
