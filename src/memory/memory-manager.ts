import fs from "fs";
import path from "path";
import { BookRecord, Preferences } from "../types";

const MEMORY_DIR = path.join(__dirname, "../../memory");

export function loadReadingHistory(): BookRecord[] {
  const filePath = path.join(MEMORY_DIR, "reading-history.json");
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function saveReadingHistory(history: BookRecord[]): void {
  const filePath = path.join(MEMORY_DIR, "reading-history.json");
  fs.writeFileSync(filePath, JSON.stringify(history, null, 2));
}

export function loadPreferences(): Preferences {
  const filePath = path.join(MEMORY_DIR, "preferences.json");
  if (!fs.existsSync(filePath)) {
    return {
      interests: ["AI agents", "system design", "psychology", "philosophy"],
      favorite_genres: ["non-fiction", "science", "self-improvement"],
      reading_goals: ["intellectual growth", "practical application"],
      life_domains: ["골프", "프리다이빙", "강아지 키우기", "데일리 코디"],
    };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function addBookToHistory(book: BookRecord): void {
  const history = loadReadingHistory();
  history.push(book);
  saveReadingHistory(history);
}
