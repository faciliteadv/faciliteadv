"use client"

import { createContext, useContext, useState, ReactNode } from "react"
import { EsteiraModal } from "@/components/kanban/esteira-modal"
import { useRouter } from "next/navigation"

interface EsteiraModalContextType {
    openModal: () => void
    closeModal: () => void
}

const EsteiraModalContext = createContext<EsteiraModalContextType | null>(null)

export function useEsteiraModal() {
    const context = useContext(EsteiraModalContext)
    if (!context) {
        throw new Error("useEsteiraModal must be used within EsteiraModalProvider")
    }
    return context
}

interface EsteiraModalProviderProps {
    children: ReactNode
}

/**
 * Provider that holds modal state ABOVE the page refetch boundary.
 * This prevents modal state from being lost when router.refresh() is called.
 */
export function EsteiraModalProvider({ children }: EsteiraModalProviderProps) {
    const [isOpen, setIsOpen] = useState(false)
    const router = useRouter()

    const openModal = () => {
        console.log('[EsteiraModalProvider] Opening modal')
        setIsOpen(true)
    }

    const closeModal = () => {
        console.log('[EsteiraModalProvider] Closing modal')
        setIsOpen(false)
    }

    const handleEsteiraCreated = (esteira: { id: string; name: string }) => {
        console.log('[EsteiraModalProvider] Esteira created:', esteira.name)
        closeModal()
        // Safe refresh AFTER modal is closed
        router.refresh()
    }

    return (
        <EsteiraModalContext.Provider value={{ openModal, closeModal }}>
            {children}
            <EsteiraModal
                isOpen={isOpen}
                onClose={closeModal}
                onEsteiraCreated={handleEsteiraCreated}
            />
        </EsteiraModalContext.Provider>
    )
}
