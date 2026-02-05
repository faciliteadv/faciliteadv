import { cn } from "@/lib/utils"

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    fullWidth?: boolean
}

export function PageContainer({ children, className, fullWidth = false, ...props }: PageContainerProps) {
    return (
        <div
            className={cn(
                "w-full h-full",
                !fullWidth && "max-w-7xl mx-auto p-6 md:p-8",
                className
            )}
            {...props}
        >
            {children}
        </div>
    )
}
