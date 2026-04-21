import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number | undefined | null, currency: string = 'VND'): string {
  if (amount == null) return '0 đ';
  if (currency === 'CNY') return `¥ ${new Intl.NumberFormat('zh-CN').format(amount)}`;
  if (currency === 'USD') return `$ ${new Intl.NumberFormat('en-US').format(amount)}`;
  return `${new Intl.NumberFormat('vi-VN').format(amount)} đ`;
}

export function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return '---';
  try {
    // Base API returns Java-style dates: "Fri Apr 10 13:27:07 ICT 2026"
    // JS Date can't parse timezone abbreviations (ICT, JST, etc.), so strip them
    const cleaned = dateStr.replace(/\s[A-Z]{2,5}\s(?=\d{4})/, ' ');
    const d = new Date(cleaned);
    if (isNaN(d.getTime())) return '---';
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  } catch {
    return '---';
  }
}

export function generateCode(prefix: string): string {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const seq = String(Math.floor(Math.random() * 999)).padStart(3, '0');
  return `${prefix}-${yy}${mm}${dd}-${seq}`;
}
