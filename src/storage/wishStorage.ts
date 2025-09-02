// src/storage/wishStorage.ts
import { db } from './db'

// 使用 backup.ts 中的 CSV 匯出實作
export { exportWishesToCSV, exportWishesToCSV as exportWishesCSV } from './backup'
