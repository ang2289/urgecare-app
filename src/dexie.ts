export interface DiaryEntry {
  id: string;
  text: string;
  createdAt: string;
  images?: string[];
  likes?: number;
}
