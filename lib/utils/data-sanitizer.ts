/**
 * Data Sanitization Utilities
 * 
 * Ensures all data passed to Server Components and Database is serializable
 * Prevents "Server Components render" errors by cleaning up values
 */

/**
 * Sanitizes a value to be JSON-serializable
 * Converts undefined, empty strings, and other problematic values to null or valid types
 */
export function sanitizeValue(value: any): any {
    // Handle null/undefined
    if (value === undefined || value === null || value === '') {
        return null
    }

    // Handle arrays
    if (Array.isArray(value)) {
        return value.map(sanitizeValue)
    }

    // Handle objects
    if (typeof value === 'object' && value !== null) {
        // Handle Date objects
        if (value instanceof Date) {
            return value.toISOString()
        }

        // Recursively sanitize object properties
        const sanitized: any = {}
        for (const [key, val] of Object.entries(value)) {
            sanitized[key] = sanitizeValue(val)
        }
        return sanitized
    }

    // Primitives are safe
    return value
}

/**
 * Sanitizes form data for database operations
 * Removes empty strings and undefined values, converting them to null
 */
export function sanitizeFormData<T extends Record<string, any>>(data: T): T {
    const sanitized = { ...data }

    for (const key in sanitized) {
        const value = sanitized[key]

        // Convert empty strings and whitespace-only strings to null
        if (typeof value === 'string' && value.trim() === '') {
            sanitized[key] = null as any
            continue
        }

        // Convert undefined to null
        if (value === undefined) {
            sanitized[key] = null as any
            continue
        }

        // Sanitize nested objects (but not arrays)
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            sanitized[key] = sanitizeFormData(value) as any
        }

        // Sanitize arrays
        if (Array.isArray(value)) {
            sanitized[key] = value.map((item: any) =>
                typeof item === 'object' ? sanitizeFormData(item) : sanitizeValue(item)
            ) as any
        }
    }

    return sanitized
}

/**
 * Ensures numeric values are properly converted
 * Prevents NaN and invalid numbers from breaking the database
 */
export function sanitizeNumeric(value: any): number | null {
    if (value === null || value === undefined || value === '') {
        return null
    }

    const num = typeof value === 'string'
        ? parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))
        : Number(value)

    return isNaN(num) ? null : num
}

/**
 * Cleans up client/process relations data
 * Ensures arrays of objects are properly formatted
 */
export function sanitizeRelations<T extends { clientId?: string, position?: string }>(
    items: T[] | undefined
): T[] {
    if (!items || !Array.isArray(items)) {
        return []
    }

    return items
        .filter((item: T) => item.clientId) // Only keep items with clientId
        .map((item: T) => ({
            ...item,
            position: item.position || null
        })) as T[]
}

/**
 * Prepares data for Prisma operations
 * Converts null values to Prisma.DbNull where appropriate
 */
export function prepareForPrisma(data: any): any {
    if (data === null || data === undefined) {
        return undefined // Let Prisma handle it
    }

    if (Array.isArray(data)) {
        return data.map(prepareForPrisma)
    }

    if (typeof data === 'object' && data !== null) {
        const prepared: any = {}
        for (const [key, value] of Object.entries(data)) {
            // Only include non-null values or explicitly set nulls
            if (value !== null && value !== undefined) {
                prepared[key] = prepareForPrisma(value)
            } else if (value === null) {
                // Explicit null - preserve it
                prepared[key] = null
            }
            // undefined values are omitted
        }
        return prepared
    }

    return data
}
