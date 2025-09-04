// Remove duplicate declarations

// Correct import for uid and nowISO
import { uid, nowISO } from '@/utils/date';

// Adjust import path for SupportPhoto
import type { SupportPhoto } from '../types/index';

function createSupportPhoto(dataUrl: string, title: string): SupportPhoto {
  return { id: uid(), dataUrl, title, createdAt: nowISO() };
}

// 使用範例
const p = createSupportPhoto('exampleDataUrl', 'exampleTitle');
