'use client'

import { addDays, format, startOfWeek, isSameDay } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { TaskCard } from "@prisma/client"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useState } from "react"

const WEEK_DAYS = 7

export function WeeklyCalendar({ tasks }: { tasks: TaskCard[] }) {
    const [startDate, setStartDate] = useState(startOfWeek(new Date(), { weekStartsOn: 1 })) // Monday start

    const days = Array.from({ length: WEEK_DAYS }).map((_, i) => addDays(startDate, i))

    // Helper to count critical tasks
    const getTasksForDay = (date: Date) => {
        return tasks.filter(t => t.fatalDate && isSameDay(new Date(t.fatalDate), date))
    }

    return (
        <div className="bg-white border-b border-slate-200 p-4 sticky top-0 z-30">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <span className="capitalize">{format(startDate, 'MMMM yyyy', { locale: ptBR })}</span>
                </h2>
                <div className="flex gap-2">
                    <button onClick={() => setStartDate(d => addDays(d, -7))} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button onClick={() => setStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }))} className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 font-medium">
                        Hoje
                    </button>
                    <button onClick={() => setStartDate(d => addDays(d, 7))} className="p-1 hover:bg-slate-100 rounded text-slate-600">
                        <ChevronRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-4">
                {days.map(day => {
                    const dailyTasks = getTasksForDay(day)
                    const isToday = isSameDay(day, new Date())
                    const isWeekend = day.getDay() === 0 || day.getDay() === 6

                    return (
                        <div key={day.toISOString()} className={cn(
                            "flex flex-col items-center p-3 rounded-lg border transition-colors",
                            isToday ? "bg-blue-50 border-blue-200 ring-1 ring-blue-300" : "bg-white border-slate-100 hover:border-blue-100",
                            isWeekend && "opacity-60 bg-slate-50/50"
                        )}>
                            <span className="text-xs font-semibold text-slate-500 uppercase mb-1">
                                {format(day, 'EEE', { locale: ptBR })}
                            </span>
                            <span className={cn(
                                "text-lg font-bold mb-2",
                                isToday ? "text-blue-700" : "text-slate-700"
                            )}>
                                {format(day, 'd')}
                            </span>

                            {dailyTasks.length > 0 ? (
                                <div className="flex gap-1">
                                    <div className="h-2 w-2 rounded-full bg-red-500" title={`${dailyTasks.length} Prazos Fatais`} />
                                </div>
                            ) : (
                                <div className="h-2 w-2" />
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
