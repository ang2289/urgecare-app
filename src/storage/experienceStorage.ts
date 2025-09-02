import { db, uid, nowISO, Experience } from './db'
import { toCSV } from '../utils/csv';

export async function addExperience(text: string) {
  const row: Experience = { id: uid(), text: text.trim(), createdAt: nowISO() }
  await db.experiences.add(row)
  return row
}

export async function loadExperiences(): Promise<Experience[]> {
  return db.experiences.orderBy('createdAt').reverse().toArray()
}

export async function deleteExperience(id: string) {
  await db.experiences.delete(id)
}

export async function exportExperiencesCSV(): Promise<string> {
  const rows = await loadExperiences();
  const light = rows.map(r => ({
    text: r.text,
    createdAt: r.createdAt,
  }));
  return toCSV(light);
}
