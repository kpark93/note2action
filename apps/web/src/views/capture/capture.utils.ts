/** Pure helpers for the Capture screen's .txt upload — no DOM, no network. */

/** True only for .txt filenames (case-insensitive) — the sole type Capture accepts. */
export function isTxtFilename(name: string): boolean {
  return /\.txt$/i.test(name);
}

/** Uploaded file's name minus .txt becomes the meeting title. */
export function titleFromFilename(name: string): string {
  return name.replace(/\.txt$/i, "");
}
