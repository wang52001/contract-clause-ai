import { readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { Document, Packer, Paragraph, TextRun } from "docx";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
const srcDir = join(__dirname, "../samples/contracts");
const outDir = join(__dirname, "../samples/contracts");

const files = (await readdir(srcDir)).filter((f) => f.endsWith(".txt"));

for (const file of files.sort()) {
  const text = await readFile(join(srcDir, file), "utf8");
  const lines = text.split(/\r?\n/);
  const children = [];

  for (const line of lines) {
    if (!line.trim()) {
      children.push(new Paragraph({ text: "" }));
      continue;
    }
    const isTitle = line.startsWith("【") && line.endsWith("】");
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: line,
            bold: isTitle,
            size: isTitle ? 32 : 24,
          }),
        ],
        spacing: { after: 120 },
      })
    );
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  const buffer = await Packer.toBuffer(doc);
  const outName = file.replace(/\.txt$/, ".docx");
  await writeFile(join(outDir, outName), buffer);
  console.log(`✓ ${outName}`);
}

console.log(`Converted ${files.length} contracts to DOCX`);
