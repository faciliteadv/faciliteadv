export type KanbanSortMode =
    | "manual"
    | "fatalDateAsc"
    | "fatalDateDesc"
    | "titleAsc"
    | "clientAsc"
    | "responsibleAsc"
    | "createdDesc"

export const KANBAN_PRACTICE_AREA_OPTIONS = [
    { value: "ALL", label: "Todas as areas" },
    { value: "CIVIL", label: "Civel" },
    { value: "LABOR", label: "Trabalhista" },
    { value: "CRIMINAL", label: "Criminal" },
    { value: "FAMILY", label: "Familia" },
    { value: "BUSINESS", label: "Empresarial" },
    { value: "TAX", label: "Tributario" },
    { value: "ADMINISTRATIVE", label: "Administrativo" },
    { value: "OTHER", label: "Outro" },
] as const

export type KanbanCommentPayload = {
    message: string
    toUserId: string | null
    toUserName: string | null
    readAt: string | null
}

type TaskLike = {
    title: string
    description?: string | null
    createdAt?: string | null
    completedAt?: string | null
    fatalDate?: string | null
    practiceArea?: string | null
    client?: { name?: string | null } | null
    process?: { folderName?: string | null; number?: string | null } | null
    responsibleLawyer?: { name?: string | null } | null
}

export function parseKanbanCommentPayload(value: unknown): KanbanCommentPayload {
    if (!value || typeof value !== "object") {
        return {
            message: "",
            toUserId: null,
            toUserName: null,
            readAt: null,
        }
    }

    const payload = value as Record<string, unknown>

    return {
        message: typeof payload.message === "string" ? payload.message : "",
        toUserId: typeof payload.toUserId === "string" ? payload.toUserId : null,
        toUserName: typeof payload.toUserName === "string" ? payload.toUserName : null,
        readAt: typeof payload.readAt === "string" ? payload.readAt : null,
    }
}

export function parseDateInputToDate(value: string | null | undefined) {
    if (!value) return null

    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Date(`${value}T12:00:00`)
    }

    return new Date(value)
}

export function normalizeKanbanDate(value: string | Date | null | undefined) {
    if (!value) return null

    if (value instanceof Date) {
        return new Date(
            value.getFullYear(),
            value.getMonth(),
            value.getDate(),
            12,
            0,
            0,
            0
        )
    }

    const [datePart] = value.split("T")
    if (!datePart) return null

    return new Date(`${datePart}T12:00:00`)
}

export function formatKanbanDate(
    value: string | Date | null | undefined,
    options: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
) {
    const date = normalizeKanbanDate(value)
    if (!date) return ""

    return new Intl.DateTimeFormat("pt-BR", options).format(date)
}

export function isKanbanTaskCompleted(task: { completedAt?: string | null }) {
    return Boolean(task.completedAt)
}

export function getNextProtocolDate(currentProtocolDate: string | null | undefined, completed: boolean, now = new Date()) {
    if (!completed) return currentProtocolDate ?? null
    return now.toISOString()
}

export function matchesKanbanSearch(task: TaskLike, query: string) {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return true

    const haystack = [
        task.title,
        task.description,
        task.practiceArea,
        task.client?.name,
        task.process?.folderName,
        task.process?.number,
        task.responsibleLawyer?.name,
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

    return haystack.includes(normalizedQuery)
}

function compareNullableStrings(a?: string | null, b?: string | null) {
    return (a || "").localeCompare(b || "", "pt-BR", { sensitivity: "base" })
}

function getSortableDateValue(value?: string | null, fallback = Number.POSITIVE_INFINITY) {
    const date = normalizeKanbanDate(value)
    return date ? date.getTime() : fallback
}

export function sortKanbanTasks<T extends TaskLike & { position: number }>(tasks: T[], sortMode: KanbanSortMode) {
    const sorted = [...tasks]

    switch (sortMode) {
        case "fatalDateAsc":
            return sorted.sort((a, b) => getSortableDateValue(a.fatalDate) - getSortableDateValue(b.fatalDate))
        case "fatalDateDesc":
            return sorted.sort((a, b) => getSortableDateValue(b.fatalDate, Number.NEGATIVE_INFINITY) - getSortableDateValue(a.fatalDate, Number.NEGATIVE_INFINITY))
        case "titleAsc":
            return sorted.sort((a, b) => compareNullableStrings(a.title, b.title))
        case "clientAsc":
            return sorted.sort((a, b) => compareNullableStrings(a.client?.name, b.client?.name))
        case "responsibleAsc":
            return sorted.sort((a, b) => compareNullableStrings(a.responsibleLawyer?.name, b.responsibleLawyer?.name))
        case "createdDesc":
            return sorted.sort((a, b) => {
                const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return bDate - aDate
            })
        case "manual":
        default:
            return sorted.sort((a, b) => a.position - b.position)
    }
}
