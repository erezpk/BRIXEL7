import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency: 'ILS',
    minimumFractionDigits: 0,
  }).format(amount);
}

// RTL utility function for Hebrew layout
export function rtlClass(className = "") {
  return cn("text-right", className);
}

// Re-export apiRequest from queryClient to maintain compatibility
export { apiRequest } from "./queryClient";
