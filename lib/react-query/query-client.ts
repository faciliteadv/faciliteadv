import { QueryClient } from '@tanstack/react-query'

export const getQueryClient = () => {
    return new QueryClient({
        defaultOptions: {
            queries: {
                // User Constraint 5: Target ~60 seconds with refetchOnWindowFocus disabled
                staleTime: 1000 * 60, // 1 minute
                refetchOnWindowFocus: false,
                retry: 1,
            },
        },
    })
}
