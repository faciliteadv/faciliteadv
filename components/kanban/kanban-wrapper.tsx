'use client'

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { isSameDay } from "date-fns"
import { KanbanBoard } from "./board"
import { WeeklyCalendar } from "./weekly-calendar"
import { CasesBoard } from "./cases-board"
import { INSSBoard } from "./inss-board"
import { TaskModal } from "./task-modal"
import { CaseModal } from "./case-modal"
import { INSSModal } from "./inss-modal"
import { ColumnModal } from "./column-modal"
import { Plus, Settings } from "lucide-react"
import { TaskCard, CaseCard, INSSCase, KanbanColumn, Tag, Client } from "@prisma/client"
import { cn } from "@/lib/utils"
import { useKanbanTasks } from "./hooks/use-kanban-tasks"
import { useKanbanFilters } from "./hooks/use-kanban-filters"

// Define proper extended types for data with relations
type ExtendedTask = Omit<TaskCard, 'createdAt' | 'updatedAt' | 'fatalDate' | 'endDate' | 'publicationDate' | 'protocolDate'> & {
    createdAt: string
    updatedAt: string
    fatalDate: string | null
    endDate: string | null
    publicationDate: string | null
    protocolDate: string | null
    client?: Pick<Client, 'id' | 'name'> | null
    process?: { id: string; number: string; folderName: string | null } | null
    tags?: Tag[]
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

type ExtendedCase = Omit<CaseCard, 'createdAt' | 'updatedAt' | 'deadline'> & {
    createdAt: string
    updatedAt: string
    deadline: string | null
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

type ExtendedINSS = Omit<INSSCase, 'createdAt' | 'updatedAt' | 'deadline'> & {
    createdAt: string
    updatedAt: string
    deadline: string | null
    checklist?: { id: string; title: string; isCompleted: boolean }[]
}

// Define the process subset that matches what's selected in the kanban page
type ProcessOption = {
    id: string
    number: string
    folderName: string | null
}

type Props = {
    initialTasks: ExtendedTask[]
    processes: ProcessOption[]
    cases: ExtendedCase[]
    inssCases: ExtendedINSS[]
    taskColumns: KanbanColumn[]
    caseColumns: KanbanColumn[]
    inssColumns: KanbanColumn[]
    // New props for editing
    users: { id: string; name: string | null; email: string | null }[]
    clients: { id: string; name: string }[]
}

export function KanbanWrapper({ initialTasks, processes, cases, inssCases, taskColumns, caseColumns, inssColumns, users, clients }: Props) {
    const router = useRouter()

    // 1. Hooks (Logic & State)
    const {
        tasks,
        moveTask,
        addTask,
        deleteTask,
        syncServerTasks
    } = useKanbanTasks(initialTasks)

    const {
        activeTab, setActiveTab,
        casesSubTab, setCasesSubTab,
        viewMode, setViewMode,
        selectedDate, setSelectedDate,
        // searchQuery
    } = useKanbanFilters()

    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
    const [isCaseModalOpen, setIsCaseModalOpen] = useState(false)
    const [isINSSModalOpen, setIsINSSModalOpen] = useState(false)
    const [isColumnModalOpen, setIsColumnModalOpen] = useState(false)
    const [selectedPhase, setSelectedPhase] = useState<string | undefined>(undefined)

    // Sync state with server data on revalidation (Phase 1.5 requirement)
    useEffect(() => {
        syncServerTasks(initialTasks)
    }, [initialTasks, syncServerTasks])

    const handleTaskCreated = (newTask?: ExtendedTask) => {
        if (newTask) {
            addTask(newTask)
        }
        // router.refresh() // addTask already handles this via hook
    }

    const handleOpenAddTask = (phase: string) => {
        setSelectedPhase(phase)
        setIsTaskModalOpen(true)
    }

    // Filter tasks by type and optionally by date
    // Note: This logic could move to a `useKanbanSelectors` hook in Phase 2
    const allDeadlineTasks = tasks.filter(t => t.type === 'DEADLINE' || t.type === 'INTERNAL' || !t.type)
    const deadlineTasks = selectedDate
        ? allDeadlineTasks.filter(t => t.fatalDate && isSameDay(new Date(t.fatalDate), selectedDate))
        : allDeadlineTasks

    return (
        <div className="flex flex-col h-full">
            {/* Modals */}
            <TaskModal
                isOpen={isTaskModalOpen}
                onClose={() => { setIsTaskModalOpen(false); setSelectedPhase(undefined) }}
                processes={processes}
                columns={taskColumns.map(col => ({ id: col.id, name: col.name }))}
                onTaskCreated={handleTaskCreated}
                defaultPhase={selectedPhase}
            />
            <CaseModal isOpen={isCaseModalOpen} onClose={() => setIsCaseModalOpen(false)} />
            <INSSModal isOpen={isINSSModalOpen} onClose={() => setIsINSSModalOpen(false)} />
            <ColumnModal
                isOpen={isColumnModalOpen}
                onClose={() => setIsColumnModalOpen(false)}
                boardType={activeTab === 'deadlines' ? 'tasks' : (casesSubTab === 'crm' ? 'cases' : 'inss')}
            />

            {/* Top Bar */}
            <div className="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shrink-0">
                {/* Main Tabs */}
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
                            activeTab === 'cases' ? "bg-white text-purple-700 shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        Casos
                    </button>
                </div>

                {/* Right Side Actions - Deadlines Tab */}
                {activeTab === 'deadlines' && (
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsTaskModalOpen(true)}
                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm shadow-blue-200"
                        >
                            <Plus className="w-4 h-4" />
                            Nova Tarefa
                        </button>
                    </div>
                )}

                {/* Right Side Actions - Cases Tab */}
                {activeTab === 'cases' && (
                    <div className="flex items-center gap-3">
                        {/* Sub-tabs */}
                        <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-white">
                            <button
                                onClick={() => setCasesSubTab('crm')}
                                className={cn(
                                    "px-4 py-2 text-xs font-medium transition-colors",
                                    casesSubTab === 'crm' ? "bg-purple-50 text-purple-700" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                CRM Casos
                            </button>
                            <div className="w-[1px] bg-slate-200" />
                            <button
                                onClick={() => setCasesSubTab('inss')}
                                className={cn(
                                    "px-4 py-2 text-xs font-medium transition-colors",
                                    casesSubTab === 'inss' ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:text-slate-700"
                                )}
                            >
                                INSS Admin
                            </button>
                        </div>

                        <button
                            onClick={() => setIsColumnModalOpen(true)}
                            className="flex items-center gap-2 text-slate-500 hover:text-slate-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                            <Settings className="w-4 h-4" />
                            Personalizar
                        </button>
                        <button
                            onClick={() => casesSubTab === 'crm' ? setIsCaseModalOpen(true) : setIsINSSModalOpen(true)}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm",
                                casesSubTab === 'crm'
                                    ? "bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200"
                                    : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200"
                            )}
                        >
                            <Plus className="w-4 h-4" />
                            {casesSubTab === 'crm' ? 'Novo Caso' : 'Novo INSS'}
                        </button>
                    </div>
                )}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden bg-slate-50/50">
                {activeTab === 'deadlines' ? (
                    <div className="h-full flex flex-col">
                        <WeeklyCalendar
                            tasks={allDeadlineTasks}
                            selectedDate={selectedDate}
                            onDayClick={setSelectedDate}
                        />
                        <div className="flex-1 overflow-hidden">
                            <KanbanBoard
                                tasks={deadlineTasks} // Renamed prop
                                columns={taskColumns}
                                onOpenAddTask={handleOpenAddTask}
                                users={users}
                                clients={clients}
                                processes={processes}
                                onMoveTask={moveTask} // New prop
                                onDeleteTask={deleteTask} // New prop
                            />
                        </div>
                    </div>
                ) : (
                    <div className="h-full overflow-hidden">
                        {casesSubTab === 'crm' ? (
                            <CasesBoard initialCases={cases} columns={caseColumns} />
                        ) : (
                            <INSSBoard initialCases={inssCases} columns={inssColumns} />
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
