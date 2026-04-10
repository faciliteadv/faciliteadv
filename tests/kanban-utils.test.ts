import test from "node:test"
import assert from "node:assert/strict"

import {
    formatKanbanDate,
    isKanbanTaskCompleted,
    matchesKanbanSearch,
    normalizeKanbanDate,
    parseDateInputToDate,
    sortKanbanTasks,
} from "../lib/utils/kanban.ts"

type TaskFixture = {
    title: string
    description?: string | null
    createdAt?: string | null
    completedAt?: string | null
    fatalDate?: string | null
    client?: { name?: string | null } | null
    process?: { folderName?: string | null; number?: string | null } | null
    responsibleLawyer?: { name?: string | null } | null
    position: number
}

function makeTask(overrides: Partial<TaskFixture> = {}): TaskFixture {
    return {
        title: "Prazo inicial",
        description: "Descricao padrao",
        createdAt: "2026-04-01T10:00:00.000Z",
        completedAt: null,
        fatalDate: null,
        client: null,
        process: null,
        responsibleLawyer: null,
        position: 0,
        ...overrides,
    }
}

test("parseDateInputToDate preserva a data informada em inputs YYYY-MM-DD", () => {
    const parsed = parseDateInputToDate("2026-04-11")

    assert.ok(parsed instanceof Date)
    assert.equal(parsed.toISOString().slice(0, 10), "2026-04-11")
    assert.equal(parsed.getHours(), 12)
})

test("normalizeKanbanDate evita o deslocamento de um dia em datas ISO", () => {
    const normalized = normalizeKanbanDate("2026-04-11T00:00:00.000Z")

    assert.ok(normalized instanceof Date)
    assert.equal(normalized.toISOString().slice(0, 10), "2026-04-11")
    assert.equal(normalized.getHours(), 12)
})

test("formatKanbanDate formata datas no padrao brasileiro", () => {
    assert.equal(formatKanbanDate("2026-04-11T00:00:00.000Z"), "11/04/2026")
    assert.equal(
        formatKanbanDate("2026-04-11T00:00:00.000Z", { day: "2-digit", month: "2-digit" }),
        "11/04"
    )
})

test("matchesKanbanSearch encontra termo em titulo, cliente, processo e responsavel", () => {
    const task = makeTask({
        title: "Protocolar peticao",
        description: "Urgente",
        client: { name: "Maria Silva" },
        process: { folderName: "Acao revisional", number: "12345-67" },
        responsibleLawyer: { name: "Dr. Lucas" },
    })

    assert.equal(matchesKanbanSearch(task, "protocolar"), true)
    assert.equal(matchesKanbanSearch(task, "maria"), true)
    assert.equal(matchesKanbanSearch(task, "12345"), true)
    assert.equal(matchesKanbanSearch(task, "lucas"), true)
    assert.equal(matchesKanbanSearch(task, "inexistente"), false)
})

test("sortKanbanTasks respeita ordenacao manual por posicao", () => {
    const tasks = [
        makeTask({ title: "B", position: 2 }),
        makeTask({ title: "A", position: 0 }),
        makeTask({ title: "C", position: 1 }),
    ]

    const sorted = sortKanbanTasks(tasks, "manual")

    assert.deepEqual(sorted.map((task) => task.title), ["A", "C", "B"])
})

test("sortKanbanTasks ordena por prazo fatal crescente", () => {
    const tasks = [
        makeTask({ title: "Sem data", position: 0, fatalDate: null }),
        makeTask({ title: "11/04", position: 1, fatalDate: "2026-04-11T00:00:00.000Z" }),
        makeTask({ title: "10/04", position: 2, fatalDate: "2026-04-10T00:00:00.000Z" }),
    ]

    const sorted = sortKanbanTasks(tasks, "fatalDateAsc")

    assert.deepEqual(sorted.map((task) => task.title), ["10/04", "11/04", "Sem data"])
})

test("sortKanbanTasks ordena por cliente e responsavel alfabeticamente", () => {
    const tasks = [
        makeTask({ title: "T1", position: 0, client: { name: "Carlos" }, responsibleLawyer: { name: "Joao" } }),
        makeTask({ title: "T2", position: 1, client: { name: "Amanda" }, responsibleLawyer: { name: "Bianca" } }),
    ]

    const byClient = sortKanbanTasks(tasks, "clientAsc")
    const byResponsible = sortKanbanTasks(tasks, "responsibleAsc")

    assert.deepEqual(byClient.map((task) => task.client?.name), ["Amanda", "Carlos"])
    assert.deepEqual(byResponsible.map((task) => task.responsibleLawyer?.name), ["Bianca", "Joao"])
})

test("isKanbanTaskCompleted reflete o estado concluido do card", () => {
    assert.equal(isKanbanTaskCompleted(makeTask({ completedAt: null })), false)
    assert.equal(isKanbanTaskCompleted(makeTask({ completedAt: "2026-04-10T14:00:00.000Z" })), true)
})
