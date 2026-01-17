"use client"

import * as React from "react"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

// Expanded context to hold labels
type SelectContextValue = {
    value: string
    onValueChange: (value: string) => void
    open: boolean
    setOpen: (open: boolean) => void
    labels: Map<string, string>
    registerLabel: (value: string, label: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

const Select = ({ value, onValueChange, children }: { value?: string, onValueChange?: (val: string) => void, children: React.ReactNode }) => {
    const [open, setOpen] = React.useState(false)
    const [labels, setLabels] = React.useState(new Map<string, string>())

    // Function to register labels from items
    const registerLabel = React.useCallback((val: string, label: string) => {
        setLabels(prev => {
            if (prev.get(val) === label) return prev
            const next = new Map(prev)
            next.set(val, label)
            return next
        })
    }, [])

    // Close on outside click is tricky in simplified raw implementation, 
    // but for now we focus on the value display.

    return (
        <SelectContext.Provider value={{ value: value || "", onValueChange: onValueChange || (() => { }), open, setOpen, labels, registerLabel }}>
            <div className="relative group">{children}</div>
        </SelectContext.Provider>
    )
}

const SelectTrigger = React.forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)

    return (
        <button
            ref={ref}
            type="button"
            onClick={() => context?.setOpen(!context.open)}
            className={cn(
                "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                className
            )}
            {...props}
        >
            {children}
            <ChevronDown className="h-4 w-4 opacity-50" />
        </button>
    )
})
SelectTrigger.displayName = "SelectTrigger"

const SelectValue = React.forwardRef<
    HTMLSpanElement,
    React.HTMLAttributes<HTMLSpanElement> & { placeholder?: string }
>(({ className, placeholder, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    const label = context?.labels.get(context.value)

    return (
        <span ref={ref} className={cn("block truncate", className)} {...props}>
            {label || context?.value || placeholder}
        </span>
    )
})
SelectValue.displayName = "SelectValue"

const SelectContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    if (!context?.open) return null

    return (
        <div
            ref={ref}
            className={cn(
                "absolute z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 w-full mt-1",
                className
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </div>
    )
})
SelectContent.displayName = "SelectContent"

const SelectItem = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, children, value, ...props }, ref) => {
    const context = React.useContext(SelectContext)
    const isSelected = context?.value === value

    // Register label on mount/update
    React.useEffect(() => {
        // Simple heuristic: if children is string, use it. If not, use value.
        let label = value
        if (typeof children === 'string') {
            label = children
        }
        // If children is complex? We can't easily extract text from arbitrary ReactNode.
        // We assume standard usage <SelectItem>Label</SelectItem>
        context?.registerLabel(value, String(children))
    }, [value, children, context])

    return (
        <div
            ref={ref}
            onClick={() => {
                context?.onValueChange(value)
                context?.setOpen(false)
            }}
            className={cn(
                "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-muted cursor-pointer",
                className
            )}
            {...props}
        >
            <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                {isSelected && <Check className="h-4 w-4" />}
            </span>
            <span className="truncate">{children}</span>
        </div>
    )
})
SelectItem.displayName = "SelectItem"

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }
