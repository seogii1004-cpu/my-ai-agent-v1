import fs from "fs";
import path from "path";
import { BookRecord, CurrentlyReading, Preferences } from "../types";

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
      hobbies: ["골프", "프리다이빙", "강아지 키우기", "데일리 코디"],
      reading_interests: ["삶의 지혜", "추리소설", "경제/재테크", "명상"],
      reading_goals: ["삶의 지혜 습득", "사고의 확장", "내면의 성장"],
      favorite_genres: ["소설", "경제경영", "자기계발", "철학", "추리"],
      profession: "SW 엔지니어",
      professional_interests: ["AI/LLM", "시스템 설계", "소프트웨어 아키텍처"],
    };
  }
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}

export function addBookToHistory(book: BookRecord): void {
  const history = loadReadingHistory();
  history.push(book);
  saveReadingHistory(history);
}

export function saveCurrentlyReading(book: string): void {
  const filePath = path.join(MEMORY_DIR, "currently-reading.json");
  const data: CurrentlyReading = { book, startedAt: new Date().toISOString() };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
}

export function loadCurrentlyReading(): CurrentlyReading | null {
  const filePath = path.join(MEMORY_DIR, "currently-reading.json");
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf-8"));
}
