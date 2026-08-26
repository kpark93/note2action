// Tailwind class-merging helper, shared by nearly every component in
// components/ui and components/app.
// Path: components/ui/*, components/app/* → [this file] (leaf, no network).
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge conditional class names, de-duplicating conflicting Tailwind utilities. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
