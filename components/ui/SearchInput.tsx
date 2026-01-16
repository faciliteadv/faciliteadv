"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

interface SearchInputProps {
    placeholder?: string
    paramName?: string
    className?: string
}

export function SearchInput({ placeholder = "Buscar...", paramName = "search", className }: SearchInputProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const [value, setValue] = useState(searchParams.get(paramName) || "")

    // Debounce the URL update
    const updateURL = useCallback((search: string) => {
        const params = new URLSearchParams(searchParams.toString())
        if (search) {
            params.set(paramName, search)
        } else {
            params.delete(paramName)
        }
        router.push(`?${params.toString()}`)
    }, [router, searchParams, paramName])

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            updateURL(value)
        }, 300) // 300ms debounce

        return () => clearTimeout(timeoutId)
    }, [value, updateURL])

    return (
        <div className={cn("relative flex-1 max-w-sm", className)}>
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                className="pl-9 bg-background/50"
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
        </div>
    )
}
