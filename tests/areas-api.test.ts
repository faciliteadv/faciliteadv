/**
 * Unit tests for WorkspaceArea business rules.
 * Tests validation logic that mirrors what the API routes enforce.
 */

import test from "node:test"
import assert from "node:assert/strict"

// ---- Inline validators (mirror of what the API routes do) ----

function validateAreaName(name: string): string | null {
    const trimmed = name.trim()
    if (trimmed.length < 2) return "Nome da área deve ter no mínimo 2 caracteres"
    if (trimmed.length > 60) return "Nome da área deve ter no máximo 60 caracteres"
    return null
}

// ---- Area name validation ----

test("área: nome válido não retorna erro", () => {
    assert.equal(validateAreaName("Trabalhista"), null)
    assert.equal(validateAreaName("Previdenciária"), null)
    assert.equal(validateAreaName("Cível e Família"), null)
})

test("área: nome muito curto retorna erro", () => {
    assert.ok(validateAreaName("A") !== null)
    assert.ok(validateAreaName("") !== null)
    assert.ok(validateAreaName("  ") !== null)
})

test("área: nome muito longo retorna erro", () => {
    const long = "A".repeat(61)
    assert.ok(validateAreaName(long) !== null)
})

test("área: nome no limite exato (2 e 60 chars) é válido", () => {
    assert.equal(validateAreaName("AB"), null)
    assert.equal(validateAreaName("A".repeat(60)), null)
})

// ---- Visibility scope business rules ----

type VisibilityScope = "SELF" | "AREA" | "ALL"

function resolveEffectiveScope(
    permissions: string[],
    declaredScope: VisibilityScope,
): VisibilityScope {
    if (permissions.includes("admin") || permissions.includes("*")) return "ALL"
    return declaredScope
}

test("admin sempre resolve scope para ALL independente do declarado", () => {
    assert.equal(resolveEffectiveScope(["admin"], "SELF"), "ALL")
    assert.equal(resolveEffectiveScope(["admin"], "AREA"), "ALL")
    assert.equal(resolveEffectiveScope(["admin"], "ALL"), "ALL")
})

test("wildcard '*' também resolve para ALL", () => {
    assert.equal(resolveEffectiveScope(["*"], "SELF"), "ALL")
})

test("membro sem admin mantém o scope declarado", () => {
    assert.equal(resolveEffectiveScope(["kanban:read"], "SELF"), "SELF")
    assert.equal(resolveEffectiveScope(["kanban:read"], "AREA"), "AREA")
    assert.equal(resolveEffectiveScope(["kanban:read"], "ALL"), "ALL")
})

// ---- Grant deduplication logic ----

function mergeVisibleIds(ownIds: string[], grantedIds: string[]): string[] {
    return [...new Set([...ownIds, ...grantedIds])]
}

test("mergeVisibleIds elimina duplicatas entre área e grants", () => {
    const area = ["user-a", "user-b", "viewer"]
    const grants = ["user-b", "user-c"] // user-b already in area
    const result = mergeVisibleIds(area, grants)
    assert.deepEqual(result.sort(), ["user-a", "user-b", "user-c", "viewer"].sort())
})

test("mergeVisibleIds sem grants retorna apenas área", () => {
    const area = ["user-a", "viewer"]
    const result = mergeVisibleIds(area, [])
    assert.deepEqual(result.sort(), ["user-a", "viewer"].sort())
})

// ---- Area deletion guard ----

type Member = { areaId: string | null }

function getMembersAffectedByAreaDeletion(members: Member[], areaId: string): Member[] {
    return members.filter(m => m.areaId === areaId)
}

test("deleção de área afeta somente membros daquela área", () => {
    const members: Member[] = [
        { areaId: "area-1" },
        { areaId: "area-1" },
        { areaId: "area-2" },
        { areaId: null },
    ]
    const affected = getMembersAffectedByAreaDeletion(members, "area-1")
    assert.equal(affected.length, 2)
    assert.ok(affected.every(m => m.areaId === "area-1"))
})

test("deleção de área sem membros não afeta ninguém", () => {
    const members: Member[] = [{ areaId: "area-2" }, { areaId: null }]
    const affected = getMembersAffectedByAreaDeletion(members, "area-1")
    assert.equal(affected.length, 0)
})
