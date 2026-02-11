import { redirect } from "next/navigation"

// Agenda removed — redirect to kanban
export default function AgendaPage() {
    redirect('/kanban')
}
