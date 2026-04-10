"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Check, Filter, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

interface ProcessStatusFilterOption {
    value: string
    label: string
    count: number
}

interface ProcessStatusFilterProps {
    options: ProcessStatusFilterOption[]
    selectedValues: string[]
    totalCount: number
}

export function ProcessStatusFilter({
    options,
    selectedValues,
    totalCount,
}: ProcessStatusFilterProps) {
    const pathname = usePathname()
    const router = useRouter()
    const searchParams = useSearchParams()

    const updateStatusFilter = (nextValues: string[]) => {
        const params = new URLSearchParams(searchParams.toString())

        if (nextValues.length > 0) {
            params.set("status", nextValues.join(","))
        } else {
            params.delete("status")
        }

        const queryString = params.toString()
        router.push(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false })
    }

    const toggleStatus = (value: string) => {
        const nextValues = selectedValues.includes(value)
            ? selectedValues.filter((item) => item !== value)
            : [...selectedValues, value]

        updateStatusFilter(nextValues)
    }

    const triggerLabel = selectedValues.length === 0
        ? "Todas as fases"
        : selectedValues.length === 1
            ? options.find((option) => option.value === selectedValues[0])?.label || "1 fase"
            : `${selectedValues.length} fases`

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" className="min-w-[220px] justify-between">
                    <span className="flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        {triggerLabel}
                    </span>
                    {selectedValues.length > 0 && (
                        <Badge variant="secondary" className="rounded-full px-2 py-0 text-xs">
                            {selectedValues.length}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>

            <PopoverContent align="start" className="w-80 p-3">
                <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-sm font-semibold text-foreground">Filtrar por fase</p>
                            <p className="text-xs text-muted-foreground">
                                Selecione uma ou mais fases para refinar a listagem.
                            </p>
                        </div>
                        {selectedValues.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-muted-foreground"
                                onClick={() => updateStatusFilter([])}
                            >
                                <RotateCcw className="h-3.5 w-3.5" />
                                Limpar
                            </Button>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={() => updateStatusFilter([])}
                        className={cn(
                            "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                            selectedValues.length === 0
                                ? "border-primary bg-primary/5 text-foreground"
                                : "border-border hover:bg-muted/60"
                        )}
                    >
                        <span className="flex items-center gap-2">
                            <span className="flex h-4 w-4 items-center justify-center">
                                {selectedValues.length === 0 && <Check className="h-4 w-4 text-primary" />}
                            </span>
                            Todas as fases
                        </span>
                        <Badge variant="secondary">{totalCount}</Badge>
                    </button>

                    <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                        {options.map((option) => {
                            const isSelected = selectedValues.includes(option.value)
                            const isDisabled = option.count === 0 && !isSelected

                            return (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => toggleStatus(option.value)}
                                    disabled={isDisabled}
                                    className={cn(
                                        "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                        isSelected
                                            ? "border-primary bg-primary/5 text-foreground"
                                            : "border-border hover:bg-muted/60",
                                        isDisabled && "cursor-not-allowed opacity-50 hover:bg-transparent"
                                    )}
                                >
                                    <span className="flex items-center gap-2">
                                        <span className="flex h-4 w-4 items-center justify-center">
                                            {isSelected && <Check className="h-4 w-4 text-primary" />}
                                        </span>
                                        {option.label}
                                    </span>
                                    <Badge variant="secondary">{option.count}</Badge>
                                </button>
                            )
                        })}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
