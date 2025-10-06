import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_BASE } from "./api";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function absoluteImageUrl(pathOrUrl?: string) {
  if (!pathOrUrl) return undefined as unknown as string | undefined;
  try {
    // Already absolute (http, https, blob, data)
    if (/^(https?:|blob:|data:)/i.test(pathOrUrl)) return pathOrUrl;
    // Backend serves uploads at /uploads/*, join with API_BASE root
    const base = API_BASE.replace(/\/?$/, "");
    if (pathOrUrl.startsWith("/")) return `${base}${pathOrUrl}`;
    return `${base}/${pathOrUrl}`;
  } catch {
    return pathOrUrl;
  }
}
