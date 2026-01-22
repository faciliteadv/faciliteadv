"use client"

import * as React from "react"

type ToastType = "success" | "error" | "info" | "warning"

interface Toast {
    id: string
    title?: string
    description?: string
    type?: ToastType
    duration?: number
}

type ToastAction =
    | { type: "ADD_TOAST"; toast: Toast }
    | { type: "REMOVE_TOAST"; toastId: string }

interface State {
    toasts: Toast[]
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 10000

let memoryState: State = { toasts: [] }
const listeners: Array<(state: State) => void> = []

function dispatch(action: ToastAction) {
    switch (action.type) {
        case "ADD_TOAST":
            memoryState = {
                ...memoryState,
                toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
            }
            break
        case "REMOVE_TOAST":
            memoryState = {
                ...memoryState,
                toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
            }
            break
    }
    listeners.forEach((listener) => listener(memoryState))
}

function toast(props: Omit<Toast, "id">) {
    const id = Math.random().toString(36).substring(2, 9)
    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...props,
            id,
        },
    })

    const timeout = setTimeout(() => {
        dispatch({ type: "REMOVE_TOAST", toastId: id })
    }, props.duration || TOAST_REMOVE_DELAY)

    toastTimeouts.set(id, timeout)
    return id
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }, [state])

    return {
        ...state,
        toast,
        dismiss: (toastId: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
    }
}

export { useToast, toast }
