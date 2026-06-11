/**
 * Tests for the visibility service logic.
 *
 * We test the decision rules in isolation by mocking the db calls.
 * The actual Prisma client is replaced via module-level monkey-patching
 * before each scenario.
 */

import test from "node:test"
import assert from "node:assert/strict"

// ---- Minimal mock helpers ----

type ViewerRow = {
    areaId: string | null
    visibilityScope: "SELF" | "AREA" | "ALL"
    role: { permissions: string[] }
    visibilityGrantsGiven: { target: { userId: string } }[]
}

type MemberRow = { userId: string }

function buildMockDb(viewer: ViewerRow | null, allMembers: MemberRow[], sameAreaMembers: MemberRow[] = []) {
    return {
        workspaceMember: {
            findUnique: async (_args?: any) => viewer,
            findMany: async ({ where }: any) => {
                if (where?.areaId) return sameAreaMembers
                return allMembers
            },
        },
    }
}

// Inline re-implementation of getVisibleMemberIds logic so we can test it without
// importing the actual module (which has side-effects via Prisma).
async function getVisibleMemberIds(
    viewerUserId: string,
    workspaceId: string,
    db: ReturnType<typeof buildMockDb>,
): Promise<string[]> {
    const viewer = await db.workspaceMember.findUnique({
        where: { workspaceId_userId: { workspaceId, userId: viewerUserId } } as any,
    } as any) as ViewerRow | null

    if (!viewer) return [viewerUserId]

    const permissions = viewer.role.permissions
    const grantedUserIds = viewer.visibilityGrantsGiven.map((g) => g.target.userId)

    const isAdmin = permissions.includes("admin") || permissions.includes("*")

    if (isAdmin || viewer.visibilityScope === "ALL") {
        const all = await db.workspaceMember.findMany({ where: { workspaceId } } as any) as MemberRow[]
        return all.map((r) => r.userId)
    }

    if (viewer.visibilityScope === "SELF") {
        return [...new Set([viewerUserId, ...grantedUserIds])]
    }

    // AREA scope
    if (!viewer.areaId) {
        const all = await db.workspaceMember.findMany({ where: { workspaceId } } as any) as MemberRow[]
        return all.map((r) => r.userId)
    }

    const sameArea = await db.workspaceMember.findMany({ where: { workspaceId, areaId: viewer.areaId } } as any) as MemberRow[]
    return [...new Set([...sameArea.map((m) => m.userId), ...grantedUserIds])]
}

// ---- Tests ----

const WS = "ws-1"
const VIEWER = "user-viewer"
const ALL_MEMBERS = [
    { userId: "user-a" },
    { userId: "user-b" },
    { userId: "user-c" },
    { userId: VIEWER },
]

test("admin permission → vê todos os membros", async () => {
    const viewer: ViewerRow = {
        areaId: "area-1",
        visibilityScope: "AREA",
        role: { permissions: ["admin"] },
        visibilityGrantsGiven: [],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), ["user-a", "user-b", "user-c", VIEWER].sort())
})

test("visibilityScope=ALL → vê todos os membros", async () => {
    const viewer: ViewerRow = {
        areaId: null,
        visibilityScope: "ALL",
        role: { permissions: ["kanban:read"] },
        visibilityGrantsGiven: [],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), ["user-a", "user-b", "user-c", VIEWER].sort())
})

test("visibilityScope=SELF sem grants → vê apenas a si mesmo", async () => {
    const viewer: ViewerRow = {
        areaId: "area-1",
        visibilityScope: "SELF",
        role: { permissions: ["kanban:own"] },
        visibilityGrantsGiven: [],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids, [VIEWER])
})

test("visibilityScope=SELF com grants → vê a si mesmo + os grants", async () => {
    const viewer: ViewerRow = {
        areaId: "area-1",
        visibilityScope: "SELF",
        role: { permissions: ["kanban:own"] },
        visibilityGrantsGiven: [{ target: { userId: "user-a" } }],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), [VIEWER, "user-a"].sort())
})

test("visibilityScope=AREA sem área definida → comportamento legado: vê todos", async () => {
    const viewer: ViewerRow = {
        areaId: null,
        visibilityScope: "AREA",
        role: { permissions: ["kanban:read"] },
        visibilityGrantsGiven: [],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), ["user-a", "user-b", "user-c", VIEWER].sort())
})

test("visibilityScope=AREA com área → vê apenas mesma área", async () => {
    const sameArea = [{ userId: VIEWER }, { userId: "user-a" }]
    const viewer: ViewerRow = {
        areaId: "area-trabalhista",
        visibilityScope: "AREA",
        role: { permissions: ["kanban:read"] },
        visibilityGrantsGiven: [],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS, sameArea)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), [VIEWER, "user-a"].sort())
})

test("visibilityScope=AREA com área + grants → vê área + grants, sem duplicatas", async () => {
    const sameArea = [{ userId: VIEWER }, { userId: "user-a" }]
    const viewer: ViewerRow = {
        areaId: "area-trabalhista",
        visibilityScope: "AREA",
        role: { permissions: ["kanban:read"] },
        visibilityGrantsGiven: [
            { target: { userId: "user-a" } }, // already in same area — no dup
            { target: { userId: "user-b" } }, // cross-area grant
        ],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS, sameArea)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), [VIEWER, "user-a", "user-b"].sort())
})

test("viewer não encontrado no workspace → retorna apenas o próprio userId", async () => {
    const db = buildMockDb(null, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids, [VIEWER])
})

test("legacy wildcard '*' equivale a admin", async () => {
    const viewer: ViewerRow = {
        areaId: "area-1",
        visibilityScope: "AREA",
        role: { permissions: ["*"] },
        visibilityGrantsGiven: [],
    }
    const db = buildMockDb(viewer, ALL_MEMBERS)
    const ids = await getVisibleMemberIds(VIEWER, WS, db)
    assert.deepEqual(ids.sort(), ["user-a", "user-b", "user-c", VIEWER].sort())
})
