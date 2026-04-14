"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface ComboboxProps {
    value: string
    onValueChange: (val: string) => void
    options: { value: string, label: string, search?: string }[]
    placeholder?: string
    searchPlaceholder?: string
    className?: string
    renderItem?: (option: { value: string, label: string, search?: string }) => React.ReactNode
    showAddCustom?: boolean
    customEmpty?: (search: string) => React.ReactNode
    fallbackLabel?: string
    disabled?: boolean
}

export function Combobox({
    value,
    onValueChange,
    options,
    placeholder,
    searchPlaceholder,
    className,
    renderItem,
    showAddCustom = true,
    customEmpty,
    fallbackLabel,
    disabled = false
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false)
    const [searchTerm, setSearchTerm] = React.useState("")

    const selectedOption = options.find((op) => op.value === value)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    disabled={disabled}
                    className={cn("w-full justify-between bg-white text-black border-input hover:bg-slate-50 h-10", className)}
                >
                    <div className="flex items-center gap-2 truncate">
                        {selectedOption ? (
                            renderItem ? renderItem(selectedOption) : <span>{selectedOption.label}</span>
                        ) : (
                            value ? <span>{fallbackLabel || (value.length === 36 ? "Item não encontrado" : value)}</span> : <span className="text-muted-foreground">{placeholder || "Selecione..."}</span>
                        )}
                    </div>
                    <div className="ml-2 flex items-center gap-1">
                        {value ? (
                            <span
                                role="button"
                                tabIndex={0}
                                onClick={(event) => {
                                    event.preventDefault()
                                    event.stopPropagation()
                                    onValueChange("")
                                }}
                                onKeyDown={(event) => {
                                    if (event.key === "Enter" || event.key === " ") {
                                        event.preventDefault()
                                        event.stopPropagation()
                                        onValueChange("")
                                    }
                                }}
                                className="rounded p-0.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                                aria-label="Limpar selecao"
                            >
                                <X className="h-4 w-4" />
                            </span>
                        ) : null}
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0 shadow-xl"
                align="start"
                onCloseAutoFocus={(e) => e.preventDefault()}
            >
                <Command shouldFilter={true}>
                    <CommandInput
                        placeholder={searchPlaceholder || "Buscar..."}
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {customEmpty ? customEmpty(searchTerm) : (
                                showAddCustom ? (
                                    <div className="p-2">
                                        <p className="text-sm text-muted-foreground text-center pb-2">Nenhum resultado encontrado.</p>
                                        <Button
                                            variant="secondary"
                                            className="w-full h-8 text-xs"
                                            onClick={() => {
                                                onValueChange(searchTerm)
                                                setOpen(false)
                                            }}
                                        >
                                            Usar "{searchTerm}"
                                        </Button>
                                    </div>
                                ) : "Nenhum resultado encontrado."
                            )}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label + " " + (option.search || "")}
                                    onSelect={() => {
                                        onValueChange(option.value === value ? "" : option.value)
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {renderItem ? renderItem(option) : option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
