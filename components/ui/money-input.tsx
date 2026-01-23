"use client"

import { Input } from "@/components/ui/input"
import { useEffect, useState } from "react"

interface MoneyInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    value: string | number
    onValueChange: (value: string) => void
}

export function MoneyInput({ value, onValueChange, className, ...props }: MoneyInputProps) {
    const [displayValue, setDisplayValue] = useState("")

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(val)
    }

    useEffect(() => {
        if (!value) {
            setDisplayValue("")
            return
        }

        // If it's a number (initial load from DB), format it
        if (typeof value === 'number') {
            setDisplayValue(formatCurrency(value))
        } else if (typeof value === 'string') {
            // Keep as is if already formatted, or format if it looks like a raw number
            if (value.includes("R$")) {
                setDisplayValue(value)
            } else if (!isNaN(Number(value)) && value.trim() !== '') {
                setDisplayValue(formatCurrency(Number(value)))
            } else {
                setDisplayValue(value)
            }
        }
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value

        // Remove everything that is not a digit
        val = val.replace(/\D/g, "")

        if (!val) {
            onValueChange("")
            setDisplayValue("")
            return
        }

        // Convert to cents and then to float
        const numericValue = Number(val) / 100

        // Format back to currency
        const formatted = formatCurrency(numericValue)

        setDisplayValue(formatted)
        onValueChange(formatted)
    }

    return (
        <Input
            {...props}
            value={displayValue}
            onChange={handleChange}
            placeholder="R$ 0,00"
            className={className}
        />
    )
}
