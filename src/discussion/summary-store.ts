import fs from "fs";
import path from "path";
import { exec } from "child_process";

const REPO_ROOT = path.resolve(__dirname, "../../");
const DISCUSSIONS_DIR = path.join(REPO_ROOT, "discussions");

export function saveSummary(book: string, startedAt: Date, summary: string): string {
  if (!fs.existsSync(DISCUSSIONS_DIR)) {
    fs.mkdirSync(DISCUSSIONS_DIR, { recursive: true });
  }

  const dateStr = startedAt.toISOString().slice(0, 10);
  const safeBook = book.replace(/[/\\:*?"<>|]/g, "_");
  const filename = `${dateStr}_${safeBook}.md`;
  const filepath = path.join(DISCUSSIONS_DIR, filename);

  const content = `# ${book} 토론 요약\n\n> 토론 날짜: ${dateStr}\n\n${summary}\n`;
  fs.writeFileSync(filepath, content, "utf-8");

  gitCommit(filename, book, dateStr);

  return filepath;
}

function gitCommit(filename: string, book: string, dateStr: string): void {
  const cmd = [
    `cd "${REPO_ROOT}"`,
    `git add discussions/${filename}`,
    `git commit -m "토론 요약: ${book} (${dateStr})"`,
  ].join(" && ");

  exec(cmd, (err, stdout, stderr) => {
    if (err) {
      console.error("[summary-store] git commit 실패:", stderr || err.message);
    } else {
      console.log(`[summary-store] git commit 완료: discussions/${filename}`);
    }
  });
}
