'use client'

import { addDays, format, startOfWeek, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { TaskCard } from "@prisma/client"
import { ChevronLeft, ChevronRight, CalendarDays, X } from "lucide-react"
import { useState } from "react"

const WEEK_DAYS = 7

type TaskWithDateStrings = {
    id: string
    fatalDate: string | null
    [key: string]: any
}

type WeeklyCalendarProps = {
    tasks: TaskWithDateStrings[]
    selectedDate?: Date | null
    onDayClick?: (date: Date | null) => void
}

export function WeeklyCalendar({ tasks, selectedDate, onDayClick }: WeeklyCalendarProps) {
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }))

    const days = Array.from({ length: WEEK_DAYS }).map((_, i) => addDays(startDate, i))

    const getTasksForDay = (date: Date) => {
        return tasks.filter(t => t.fatalDate && isSameDay(new Date(t.fatalDate), date))
    }

    const handleDayClick = (day: Date) => {
        if (onDayClick) {
            // Toggle: if already selected, clear filter
            if (selectedDate && isSameDay(selectedDate, day)) {
                onDayClick(null)
            } else {
                onDayClick(day)
            }
        }
    }

    return (
        <div className="bg-white/80 backdrop-blur-sm border-b border-slate-100 px-4 py-2 shrink-0">
            <div className="flex items-center gap-4">
                {/* Month Title - Compact */}
                <div className="flex items-center gap-2 min-w-[140px]">
                    <CalendarDays className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-semibold text-slate-700 capitalize">
                        {format(startDate, 'MMMM yyyy', { locale: ptBR })}
                    </span>
                </div>

                {/* Navigation */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => setStartDate(d => addDays(d, -7))}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                        className="text-xs px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-md text-blue-700 font-medium transition-colors"
                    >
                        Hoje
                    </button>
                    <button
                        onClick={() => setStartDate(d => addDays(d, 7))}
                        className="p-1.5 hover:bg-slate-100 rounded-md text-slate-500 transition-colors"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>

                {/* Clear Filter Button (if date is selected) */}
                {selectedDate && (
                    <button
                        onClick={() => onDayClick?.(null)}
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 rounded-md text-xs font-medium transition-colors"
                    >
                        <X className="w-3 h-3" />
                        Limpar filtro
                    </button>
                )}

                {/* Days - Horizontal Compact */}
                <div className="flex-1 flex gap-1">
                    {days.map(day => {
                        const dailyTasks = getTasksForDay(day)
                        const isToday = isSameDay(day, new Date())
                        const isWeekend = day.getDay() === 0 || day.getDay() === 6
                        const hasTasks = dailyTasks.length > 0
                        const isSelected = selectedDate && isSameDay(selectedDate, day)

                        return (
                            <button
                                key={day.toISOString()}
                                onClick={() => handleDayClick(day)}
                                className={cn(
                                    "flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all",
                                    isSelected
                                        ? "bg-amber-500 text-white shadow-sm shadow-amber-200 ring-2 ring-amber-300"
                                        : isToday
                                            ? "bg-blue-600 text-white shadow-sm shadow-blue-200 hover:bg-blue-700"
                                            : isWeekend
                                                ? "bg-slate-50 text-slate-400 hover:bg-slate-100 cursor-pointer"
                                                : "bg-slate-50/50 hover:bg-slate-100 text-slate-600 cursor-pointer"
                                )}
                                title={hasTasks ? `${dailyTasks.length} prazo${dailyTasks.length > 1 ? 's' : ''} - Clique para filtrar` : 'Clique para filtrar'}
                            >
                                <span className={cn(
                                    "text-[10px] font-medium uppercase",
                                    isSelected ? "text-amber-100" : isToday ? "text-blue-100" : "text-inherit opacity-60"
                                )}>
                                    {format(day, 'EEE', { locale: ptBR })}
                                </span>
                                <span className={cn(
                                    "text-sm font-bold",
                                    isSelected || isToday ? "text-white" : ""
                                )}>
                                    {format(day, 'd')}
                                </span>
                                {hasTasks && (
                                    <span className={cn(
                                        "w-1.5 h-1.5 rounded-full",
                                        isSelected ? "bg-white" : isToday ? "bg-white" : "bg-red-500"
                                    )} />
                                )}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
