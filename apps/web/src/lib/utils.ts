import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Weft's type scale (text-11 to text-24) is custom. Without this, tailwind-merge
// reads `text-13` as a color and drops the real color class next to it.
const twMerge = extendTailwindMerge({
  extend: { theme: { text: ['11', '12', '13', '14', '16', '20', '24'] } },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
