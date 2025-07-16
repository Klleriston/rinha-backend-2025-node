export function isValidISODate(dateString: string): boolean {
    try {
        const date = new Date(dateString);
        return date.toISOString() === dateString;
    } catch {
        return false;
    }
} 