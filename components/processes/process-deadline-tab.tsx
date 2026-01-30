'use client'

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ListTodo, Plus } from "lucide-react"
import { TaskModal } from "@/components/kanban/task-modal"

type TaskItem = {
    id: string
    title: string
    fatalDate?: Date | null
    phase: string
    type: string
}

const taskTypeLabels: Record<string, string> = {
    INTERNAL: 'Interna',
    DEADLINE: 'Prazo'
}

function getTaskTypeLabel(type: string): string {
    return taskTypeLabels[type] || type
}

type ProcessDeadlineTabProps = {
    processId: string
    processNumber: string
    processFolderName: string | null
    tasks: TaskItem[]
    columns: { id: string; name: string }[]
    onTaskCreated?: () => void
}

export function ProcessDeadlineTab({
    processId,
    processNumber,
    processFolderName,
    tasks,
    columns,
    onTaskCreated
}: ProcessDeadlineTabProps) {
    const [isModalOpen, setIsModalOpen] = useState(false)

    const handleTaskCreated = () => {
        onTaskCreated?.()
        // Refresh the page to show new task
        window.location.reload()
    }

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                        <ListTodo className="h-4 w-4" />
                        Prazos e Tarefas
                    </CardTitle>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={() => setIsModalOpen(true)}
                    >
                        <Plus className="h-4 w-4" /> Novo Prazo
                    </Button>
                </CardHeader>
                <CardContent>
                    {tasks && tasks.length > 0 ? (
                        <div className="space-y-4">
                            {tasks.map((task) => (
                                <div key={task.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium text-sm">{task.title}</p>
                                        {task.fatalDate && (
                                            <p className="text-xs text-red-600 font-medium">Prazo Fatal: {new Date(task.fatalDate).toLocaleDateString('pt-BR')}</p>
                                        )}
                                        <p className="text-[10px] text-muted-foreground">Status: {task.phase}</p>
                                    </div>
                                    <Badge variant="outline" className="text-[10px]">{getTaskTypeLabel(task.type)}</Badge>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                            <p>Nenhuma tarefa ou prazo vinculado.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <TaskModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                processes={[{ id: processId, number: processNumber, folderName: processFolderName }]}
                columns={columns}
                onTaskCreated={handleTaskCreated}
                defaultProcessId={processId}
            />
        </>
    )
}
