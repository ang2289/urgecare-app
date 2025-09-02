import { db, uid, nowISO, type SupportPhoto } from './db'

export async function addPhotoFromDataUrl(dataUrl: string, title?: string) {
  const p: SupportPhoto = { id: uid(), dataUrl, title, createdAt: nowISO() }
  await db.photos.add(p)
  return p
}

export async function addPhotoFromFile(file: File, title?: string) {
  const dataUrl = await fileToDataURL(file)
  return addPhotoFromDataUrl(dataUrl, title || file.name)
}

export async function loadPhotos(): Promise<SupportPhoto[]> {
  // 依建立時間 DESC
  return db.photos.orderBy('createdAt').reverse().toArray()
}

export async function deletePhoto(id: string) {
  await db.photos.delete(id)
}

function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}
