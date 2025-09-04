export interface BaseDoc {
  id: string;
  createdAt: string;
}

export interface SupportItem extends BaseDoc {
  text?: string
  image?: string // dataURL base64，重整仍在
}

export interface DelayRecord extends BaseDoc {
  timestamp: number;
  source: string;
  minutes: number;
}

export interface DiaryEntry extends BaseDoc {
  text: string;
  images?: string[];
  likes?: number;
}

export interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: string;
}

export interface WishItem {
  id: string;
  title: string;
  votes: number;
}
