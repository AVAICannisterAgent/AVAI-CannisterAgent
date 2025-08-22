import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

export type ToastActionElement = React.ReactElement

interface ToasterToast {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    action?: ToastActionElement
    open?: boolean
    onOpenChange?: (open: boolean) => void
    // Additional props with unknown but type-safe values
    [key: string]: unknown | string | React.ReactNode | ToastActionElement | boolean | ((open: boolean) => void) | undefined
}

const ACTION_TYPES = {
    ADD_TOAST: "ADD_TOAST",
    UPDATE_TOAST: "UPDATE_TOAST",
    DISMISS_TOAST: "DISMISS_TOAST",
    REMOVE_TOAST: "REMOVE_TOAST",
} as const

type ActionType = typeof ACTION_TYPES

type Action =
    | { type: typeof ACTION_TYPES["ADD_TOAST"]; toast: ToasterToast }
    | { type: typeof ACTION_TYPES["UPDATE_TOAST"]; toast: Partial<ToasterToast> }
    | { type: typeof ACTION_TYPES["DISMISS_TOAST"]; toastId?: string }
    | { type: typeof ACTION_TYPES["REMOVE_TOAST"]; toastId?: string }

interface State {
    toasts: ToasterToast[]
}

let count = 0
function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addToRemoveQueue = (toastId: string) => {
    if (toastTimeouts.has(toastId)) return

    const timeout = setTimeout(() => {
        toastTimeouts.delete(toastId)
        dispatch({ type: "REMOVE_TOAST", toastId })
    }, TOAST_REMOVE_DELAY)

    toastTimeouts.set(toastId, timeout)
}

export const reducer = (state: State, action: Action): State => {
    switch (action.type) {
        case "ADD_TOAST":
            return {
                ...state,
                toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
            }
        case "UPDATE_TOAST":
            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    t.id === action.toast.id ? { ...t, ...action.toast } : t
                ),
            }
        case "DISMISS_TOAST": {
            const { toastId } = action
            if (toastId) {
                addToRemoveQueue(toastId)
            } else {
                state.toasts.forEach((toast) => addToRemoveQueue(toast.id))
            }

            return {
                ...state,
                toasts: state.toasts.map((t) =>
                    toastId === undefined || t.id === toastId
                        ? { ...t, open: false }
                        : t
                ),
            }
        }
        case "REMOVE_TOAST":
            return {
                ...state,
                toasts: action.toastId
                    ? state.toasts.filter((t) => t.id !== action.toastId)
                    : [],
            }
        default:
            return state
    }
}

const listeners: Array<(state: State) => void> = []
let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => listener(memoryState))
}

type ToastOptions = Omit<ToasterToast, "id">

function toast(options: ToastOptions) {
    const id = genId()

    const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })
    const update = (props: Partial<ToasterToast>) =>
        dispatch({
            type: "UPDATE_TOAST",
            toast: { ...props, id },
        })

    dispatch({
        type: "ADD_TOAST",
        toast: {
            ...options,
            id,
            open: true,
            onOpenChange: (open) => {
                if (!open) dismiss()
            },
        },
    })

    return { id, dismiss, update }
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index !== -1) listeners.splice(index, 1)
        }
    }, [])

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) =>
            dispatch({ type: "DISMISS_TOAST", toastId }),
    }
}

export { useToast, toast }
