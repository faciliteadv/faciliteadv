'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'
import { getQueryClient } from '@/lib/react-query/query-client'

export function QueryProvider({ children }: { children: React.ReactNode }) {
    // Ensure QueryClient is created once per component tree lifecycle
    const [queryClient] = useState(() => getQueryClient())

    return (
        <QueryClientProvider client={queryClient}>
            {children}
            <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
    )
}
