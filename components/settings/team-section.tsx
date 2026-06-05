'use client'

import { useState } from 'react'
import { Users, Plus, Trash2, Settings2, X, Eye, EyeOff, Crown } from 'lucide-react'
import { PERMISSION_GROUPS, PERMISSION_LABELS, type Permission } from '@/lib/permissions'

type Member = {
    id: string
    userId: string
    name: string | null
    email: string
    roleId: string
    permissions: string[]
    joinedAt: string
    isOwner: boolean
}

type Props = {
    initialMembers: Member[]
    currentUserId: string
}

export function TeamSection({ initialMembers, currentUserId }: Props) {
    const [members, setMembers] = useState<Member[]>(initialMembers)
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingMember, setEditingMember] = useState<Member | null>(null)

    async function handleRemove(userId: string) {
        if (!confirm('Remover este membro do escritório?')) return

        const res = await fetch(`/api/workspace/members/${userId}`, { method: 'DELETE' })
        if (res.ok) {
            setMembers(prev => prev.filter(m => m.userId !== userId))
        } else {
            const data = await res.json()
            alert(data.error || 'Erro ao remover membro')
        }
    }

    async function handleUpdatePermissions(userId: string, permissions: Permission[]) {
        const res = await fetch(`/api/workspace/members/${userId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ permissions }),
        })
        if (res.ok) {
            setMembers(prev => prev.map(m =>
                m.userId === userId ? { ...m, permissions } : m
            ))
            setEditingMember(null)
        } else {
            const data = await res.json()
            alert(data.error || 'Erro ao atualizar permissões')
        }
    }

    function handleMemberAdded(member: Member) {
        setMembers(prev => [...prev, member])
        setShowAddModal(false)
    }

    return (
        <div className="rounded-lg border bg-white p-6 shadow-sm col-span-2">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-purple-100 p-3">
                        <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Equipe</h3>
                        <p className="text-sm text-slate-500">Gerencie os membros do seu escritório</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Adicionar membro
                </button>
            </div>

            <div className="space-y-3">
                {members.map(member => (
                    <div
                        key={member.id}
                        className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-4 py-3"
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                                {(member.name || member.email).charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-slate-900 truncate">
                                        {member.name || member.email}
                                    </span>
                                    {member.isOwner && (
                                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                            <Crown className="h-3 w-3" />
                                            Gestor
                                        </span>
                                    )}
                                </div>
                                <span className="text-xs text-slate-500 truncate block">{member.email}</span>
                            </div>
                        </div>

                        {!member.isOwner && (
                            <div className="flex items-center gap-2 ml-4">
                                <button
                                    onClick={() => setEditingMember(member)}
                                    className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                                >
                                    <Settings2 className="h-3.5 w-3.5" />
                                    Permissões
                                </button>
                                <button
                                    onClick={() => handleRemove(member.userId)}
                                    className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        )}
                    </div>
                ))}

                {members.length === 0 && (
                    <p className="text-sm text-slate-400 text-center py-6">
                        Nenhum membro adicionado ainda.
                    </p>
                )}
            </div>

            {showAddModal && (
                <AddMemberModal
                    onClose={() => setShowAddModal(false)}
                    onAdded={handleMemberAdded}
                />
            )}

            {editingMember && (
                <EditPermissionsModal
                    member={editingMember}
                    onClose={() => setEditingMember(null)}
                    onSave={(perms) => handleUpdatePermissions(editingMember.userId, perms)}
                />
            )}
        </div>
    )
}

// --- Add Member Modal ---

function AddMemberModal({
    onClose,
    onAdded,
}: {
    onClose: () => void
    onAdded: (member: Member) => void
}) {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [permissions, setPermissions] = useState<Permission[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    function togglePermission(perm: Permission) {
        setPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        )
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const res = await fetch('/api/workspace/members', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, password, permissions }),
            })

            const data = await res.json()

            if (!res.ok) {
                setError(data.error || 'Erro ao adicionar membro')
                return
            }

            onAdded({ ...data, isOwner: false, joinedAt: new Date().toISOString() })
        } catch {
            setError('Erro de conexão')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <h3 className="text-lg font-semibold text-slate-900">Adicionar membro</h3>
                    <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Nome</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Ex: Ana Lima"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="ana@escritorio.com"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Senha de acesso</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                required
                                minLength={6}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-10 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">
                            A pessoa vai usar este email e senha para acessar o sistema.
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-3">
                            Permissões de acesso
                        </label>
                        <div className="space-y-4">
                            {PERMISSION_GROUPS.map(group => (
                                <div key={group.label}>
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                        {group.label}
                                    </p>
                                    <div className="space-y-1.5">
                                        {group.permissions.map(perm => (
                                            <label
                                                key={perm}
                                                className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={permissions.includes(perm)}
                                                    onChange={() => togglePermission(perm)}
                                                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-slate-700">
                                                    {PERMISSION_LABELS[perm]}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? 'Adicionando...' : 'Adicionar membro'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

// --- Edit Permissions Modal ---

function EditPermissionsModal({
    member,
    onClose,
    onSave,
}: {
    member: Member
    onClose: () => void
    onSave: (permissions: Permission[]) => void
}) {
    const [permissions, setPermissions] = useState<Permission[]>(member.permissions as Permission[])
    const [loading, setLoading] = useState(false)

    function togglePermission(perm: Permission) {
        setPermissions(prev =>
            prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
        )
    }

    async function handleSave() {
        setLoading(true)
        await onSave(permissions)
        setLoading(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b px-6 py-4">
                    <div>
                        <h3 className="text-lg font-semibold text-slate-900">Permissões</h3>
                        <p className="text-sm text-slate-500">{member.name || member.email}</p>
                    </div>
                    <button onClick={onClose} className="rounded-md p-1 text-slate-400 hover:text-slate-600">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                    {PERMISSION_GROUPS.map(group => (
                        <div key={group.label}>
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-2">
                                {group.label}
                            </p>
                            <div className="space-y-1.5">
                                {group.permissions.map(perm => (
                                    <label
                                        key={perm}
                                        className="flex items-center gap-3 cursor-pointer rounded-lg px-3 py-2 hover:bg-slate-50 transition-colors"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={permissions.includes(perm)}
                                            onChange={() => togglePermission(perm)}
                                            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-slate-700">
                                            {PERMISSION_LABELS[perm]}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex justify-end gap-3 border-t px-6 py-4">
                    <button
                        onClick={onClose}
                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {loading ? 'Salvando...' : 'Salvar permissões'}
                    </button>
                </div>
            </div>
        </div>
    )
}
