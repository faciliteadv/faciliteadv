'use client'

import { useState } from 'react'

export type KanbanViewMode = 'kanban' | 'list'
export type KanbanTab = 'deadlines' | 'cases'
export type CasesSubTab = 'crm' | 'inss'

export function useKanbanFilters() {
    const [activeTab, setActiveTab] = useState<KanbanTab>('deadlines')
    const [casesSubTab, setCasesSubTab] = useState<CasesSubTab>('crm')
    const [viewMode, setViewMode] = useState<KanbanViewMode>('kanban')
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)
    const [searchQuery, setSearchQuery] = useState('')

    return {
        // State
        activeTab,
        casesSubTab,
        viewMode,
        selectedDate,
        searchQuery,

        // Setters
        setActiveTab,
        setCasesSubTab,
        setViewMode,
        setSelectedDate,
        setSearchQuery
    }
}
