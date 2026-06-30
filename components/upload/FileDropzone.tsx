"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { parseFile, MAX_FILE_SIZE, ACCEPTED_TYPES } from "@/lib/parser";
import { useAnalysisStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function FileDropzone() {
  const setText = useAnalysisStore((s) => s.setText);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setWarning(null);
      setFileName(file.name);
      if (file.size > MAX_FILE_SIZE) {
        setError("文件超过 10MB 限制，请裁剪后上传或直接粘贴文本");
        return;
      }
      setParsing(true);
      try {
        const { text, warning: w } = await parseFile(file);
        if (!text) {
          setError(w ?? "未提取到文字");
          return;
        }
        setText(text);
        if (w) setWarning(w);
      } catch (e) {
        setError(e instanceof Error ? e.message : "解析失败");
      } finally {
        setParsing(false);
      }
    },
    [setText]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-2">
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 text-center transition-colors",
          dragging ? "border-primary bg-accent" : "border-border hover:border-primary/50"
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
        {parsing ? (
          <>
            <Loader2 className="mb-2 h-8 w-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">正在本地解析文件…</p>
          </>
        ) : fileName ? (
          <>
            <FileText className="mb-2 h-8 w-8 text-primary" />
            <p className="text-sm font-medium">{fileName}</p>
            <p className="text-xs text-muted-foreground">点击重新选择</p>
          </>
        ) : (
          <>
            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">点击或拖拽上传合同</p>
            <p className="text-xs text-muted-foreground">支持 PDF / Word(.docx)，文件在浏览器本地解析</p>
          </>
        )}
      </div>
      {warning && (
        <p className="flex items-center gap-1 text-xs text-amber-600">
          <AlertCircle className="h-3 w-3" />
          {warning}
        </p>
      )}
      {error && (
        <p className="flex items-center gap-1 text-xs text-destructive">
          <AlertCircle className="h-3 w-3" />
          {error}
        </p>
      )}
    </div>
  );
}
