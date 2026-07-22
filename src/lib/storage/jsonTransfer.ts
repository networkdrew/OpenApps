/** Triggers a browser download of `data` as a formatted JSON file. */
export function downloadJson(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export type ReadJsonResult =
  { ok: true; data: unknown } | { ok: false; message: string };

/** Reads and JSON-parses a user-selected file (from an <input type="file"> import control). */
export async function readJsonFile(file: File): Promise<ReadJsonResult> {
  let text: string;
  try {
    text = await file.text();
  } catch {
    return { ok: false, message: "Couldn't read that file." };
  }
  try {
    return { ok: true, data: JSON.parse(text) };
  } catch {
    return { ok: false, message: "That file isn't valid JSON." };
  }
}
