import * as React from "react"

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  duration?: number
  type?: "default" | "destructive" | "success"
}

type State = {
  toasts: ToasterToast[]
}

enum ActionType {
  ADD_TOAST,
  UPDATE_TOAST,
  DISMISS_TOAST,
  REMOVE_TOAST,
}

type Action = 
  | { type: ActionType.ADD_TOAST; toast: ToasterToast }
  | { type: ActionType.UPDATE_TOAST; toast: Partial<ToasterToast> }
  | { type: ActionType.DISMISS_TOAST; toastId?: string }
  | { type: ActionType.REMOVE_TOAST; toastId?: string }

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

const addTask = (toastId: string, fn: () => void) => {
  if (toastTimeouts.has(toastId)) {
    clearTimeout(toastTimeouts.get(toastId))
  }
  const timeout = setTimeout(fn, TOAST_REMOVE_DELAY)
  toastTimeouts.set(toastId, timeout)
}

const reducer = (state: State, action: Action): State => {
  switch (action.type) {
    case ActionType.ADD_TOAST:
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT),
      }

    case ActionType.UPDATE_TOAST:
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        ),
      }

    case ActionType.DISMISS_TOAST:
      const { toastId } = action

      // ! Side effects ! - This is not pure, but that's what the dismiss button is for.
      if (toastId) {
        addTask(toastId, () =>
          dispatch({ type: ActionType.REMOVE_TOAST, toastId: toastId })
        )
      } else {
        state.toasts.forEach((toast) =>
          addTask(toast.id, () =>
            dispatch({ type: ActionType.REMOVE_TOAST, toastId: toast.id })
          )
        )
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? { ...t, open: false } // TODO: Remove this once toast component is updated to use the `open` prop
            : t
        ),
      }
    case ActionType.REMOVE_TOAST:
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

const listeners: ((state: State) => void)[] = []

let memoryState: State = { toasts: [] }

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => listener(memoryState))
}

type Toast = Omit<ToasterToast, "id">

function createToast({ ...props }: Toast) {
  const id = Math.random().toString(36).substring(2, 9)

  const update = (props: Partial<ToasterToast>) =>
    dispatch({ type: ActionType.UPDATE_TOAST, toast: { ...props, id } })
  const dismiss = () => dispatch({ type: ActionType.DISMISS_TOAST, toastId: id })

  dispatch({ type: ActionType.ADD_TOAST, toast: { ...props, id, open: true } as ToasterToast })

  return {
    id: id,
    update,
    dismiss,
  }
}

export function useToast() {
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
    toast: React.useCallback(createToast, []),
  }
} 