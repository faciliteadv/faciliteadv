import { useEffect, useRef } from "react"

export function useDraggableScroll() {
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const el = ref.current
        if (!el) return

        let isDown = false
        let startX = 0
        let scrollLeft = 0

        const onPointerDown = (e: PointerEvent) => {
            // Ignore if clicking on a card or interactive element
            // We can look for data attributes or specific classes
            const target = e.target as HTMLElement
            if (
                target.closest('[data-no-drag-scroll]') ||
                target.closest('button') ||
                target.closest('[role="button"]') ||
                target.closest('[draggable="true"]') // dnd-kit usually sets this
            ) {
                return
            }

            isDown = true
            startX = e.pageX - el.offsetLeft
            scrollLeft = el.scrollLeft
            el.style.cursor = 'grabbing'
            el.style.userSelect = 'none'
        }

        const onPointerLeave = () => {
            isDown = false
            el.style.cursor = 'grab'
            el.style.removeProperty('user-select')
        }

        const onPointerUp = () => {
            isDown = false
            el.style.cursor = 'grab'
            el.style.removeProperty('user-select')
        }

        const onPointerMove = (e: PointerEvent) => {
            if (!isDown) return
            e.preventDefault()
            const x = e.pageX - el.offsetLeft
            const walk = (x - startX) * 1.5 // Speed multiplier
            el.scrollLeft = scrollLeft - walk
        }

        el.addEventListener('pointerdown', onPointerDown)
        el.addEventListener('pointerleave', onPointerLeave)
        el.addEventListener('pointerup', onPointerUp)
        el.addEventListener('pointermove', onPointerMove)

        // Set initial cursor
        el.style.cursor = 'grab'

        return () => {
            el.removeEventListener('pointerdown', onPointerDown)
            el.removeEventListener('pointerleave', onPointerLeave)
            el.removeEventListener('pointerup', onPointerUp)
            el.removeEventListener('pointermove', onPointerMove)
            el.style.removeProperty('cursor')
        }
    }, [])

    return { ref }
}
