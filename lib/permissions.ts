export type Permission =
    | 'admin'
    | 'clients:read'
    | 'clients:write'
    | 'processes:read'
    | 'processes:write'
    | 'kanban:read'
    | 'kanban:own'
    | 'kanban:write'
    | 'financial:read'
    | 'financial:write'
    | 'agenda:read'
    | 'agenda:write'

export const PERMISSION_LABELS: Record<Permission, string> = {
    'admin': 'Acesso total (gestor)',
    'clients:read': 'Ver todos os clientes',
    'clients:write': 'Criar e editar clientes',
    'processes:read': 'Ver todos os processos',
    'processes:write': 'Criar e editar processos',
    'kanban:read': 'Ver todos os cards do kanban',
    'kanban:own': 'Ver apenas seus próprios cards no kanban',
    'kanban:write': 'Criar e mover cards no kanban',
    'financial:read': 'Ver financeiro',
    'financial:write': 'Criar registros financeiros',
    'agenda:read': 'Ver agenda',
    'agenda:write': 'Criar compromissos',
}

export const PERMISSION_GROUPS = [
    {
        label: 'Clientes',
        permissions: ['clients:read', 'clients:write'] as Permission[],
    },
    {
        label: 'Processos',
        permissions: ['processes:read', 'processes:write'] as Permission[],
    },
    {
        label: 'Kanban',
        permissions: ['kanban:read', 'kanban:own', 'kanban:write'] as Permission[],
    },
    {
        label: 'Financeiro',
        permissions: ['financial:read', 'financial:write'] as Permission[],
    },
    {
        label: 'Agenda',
        permissions: ['agenda:read', 'agenda:write'] as Permission[],
    },
]

export const OWNER_PERMISSIONS: Permission[] = ['admin']

export function hasPermission(permissions: string[], permission: Permission): boolean {
    if (permissions.includes('admin')) return true
    return permissions.includes(permission)
}
