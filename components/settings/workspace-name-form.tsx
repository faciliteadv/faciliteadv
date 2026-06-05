'use client'

import { useState } from 'react'
import { Check, Pencil } from 'lucide-react'

export function WorkspaceNameForm({ initialName }: { initialName: string }) {
    const [name, setName] = useState(initialName)
    const [editing, setEditing] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    async function handleSave() {
        if (name.trim() === initialName || name.trim().length < 2) return
        setSaving(true)

        const res = await fetch('/api/workspace', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name.trim() }),
        })

        setSaving(false)
        if (res.ok) {
            setEditing(false)
            setSaved(true)
            setTimeout(() => setSaved(false), 2000)
        } else {
            const data = await res.json()
            alert(data.error || 'Erro ao salvar')
        }
    }

    return (
        <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-500">Nome do escritório</label>
            {editing ? (
                <div className="flex items-center gap-2">
                    <input
                        autoFocus
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') { setName(initialName); setEditing(false) } }}
                        className="flex-1 rounded-lg border border-blue-400 px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                        onClick={() => { setName(initialName); setEditing(false) }}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
                    >
                        Cancelar
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border group">
                    <span className="flex-1 text-slate-900 font-medium">{name}</span>
                    {saved ? (
                        <Check className="h-4 w-4 text-green-600" />
                    ) : (
                        <button
                            onClick={() => setEditing(true)}
                            className="text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <Pencil className="h-4 w-4" />
                        </button>
                    )}
                </div>
            )}
        </div>
    )
}
