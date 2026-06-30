export async function parseWord(file: File): Promise<string> {
  const mammothModule: any = await import("mammoth");
  const mammoth = mammothModule.default || mammothModule;
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return (result?.value || "").trim();
}
