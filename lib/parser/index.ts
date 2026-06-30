import { parsePdf } from "./pdf";
import { parseWord } from "./word";

export interface ParseResult {
  text: string;
  warning?: string;
}

export async function parseFile(file: File): Promise<ParseResult> {
  const name = file.name.toLowerCase();
  const isPdf = name.endsWith(".pdf") || file.type === "application/pdf";
  const isWord = name.endsWith(".docx") || name.endsWith(".doc");

  if (isPdf) {
    const text = await parsePdf(file);
    if (!text) {
      return {
        text: "",
        warning:
          "PDF 未提取到文字，可能是扫描版或图片型 PDF。请上传可选择文字的电子版，或直接粘贴文本。",
      };
    }
    return { text };
  }

  if (isWord) {
    const text = await parseWord(file);
    if (!text) {
      return { text: "", warning: "Word 文档未提取到文字，请直接粘贴文本。" };
    }
    return { text };
  }

  throw new Error("仅支持 PDF 和 Word(.docx) 文件");
}

export const ACCEPTED_TYPES = ".pdf,.docx,.doc";
export const MAX_FILE_SIZE = 10 * 1024 * 1024;
