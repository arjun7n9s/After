import {
  Code2,
  Download,
  File,
  FileJson,
  FileText,
  Image,
  Music,
  RefreshCw,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type React from "react";
import type { LucideIcon } from "lucide-react";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { apiService } from "@/services/api";
import type { GeneratedFile, GeneratedFileContent, GeneratedFileKind } from "@/types";

const kindIcon: Record<GeneratedFileKind, LucideIcon> = {
  markdown: FileText,
  video: Video,
  audio: Music,
  image: Image,
  html: Code2,
  json: FileJson,
  text: FileText,
  other: File,
};

const kindLabel: Record<GeneratedFileKind, string> = {
  markdown: "Markdown",
  video: "Video",
  audio: "Audio",
  image: "Image",
  html: "HTML",
  json: "JSON",
  text: "Text",
  other: "File",
};

const collectionLabel: Record<GeneratedFile["collection"], string> = {
  generated: "Generated",
  captured: "Captured",
};

export function Files() {
  const [files, setFiles] = useState<GeneratedFile[]>([]);
  const [outputRoot, setOutputRoot] = useState<string | undefined>();
  const [captureRoot, setCaptureRoot] = useState<string | undefined>();
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [content, setContent] = useState<GeneratedFileContent | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [isReading, setReading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedFile = useMemo(
    () => files.find((file) => file.path === selectedPath) ?? files[0] ?? null,
    [files, selectedPath],
  );

  const loadFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const listing = await apiService.getGeneratedFiles();
      const nextFiles = listing.files;
      setFiles(nextFiles);
      setOutputRoot(listing.outputRoot);
      setCaptureRoot(listing.captureRoot);
      setSelectedPath((currentPath) => {
        if (currentPath && nextFiles.some((file) => file.path === currentPath)) return currentPath;
        return nextFiles[0]?.path ?? null;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load project files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadFiles();
  }, []);

  useEffect(() => {
    let mounted = true;

    if (!selectedFile?.previewable) {
      setContent(null);
      return;
    }

    setReading(true);
    void apiService
      .getGeneratedFileContent(selectedFile.path)
      .then((nextContent) => {
        if (mounted) setContent(nextContent);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to read project file");
      })
      .finally(() => {
        if (mounted) setReading(false);
      });

    return () => {
      mounted = false;
    };
  }, [selectedFile]);

  if (isLoading) return <div className="mx-auto max-w-6xl"><LoadingSkeleton /></div>;

  return (
    <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[320px_1fr]">
      <section className="glass-card overflow-hidden" style={{ borderRadius: 18 }}>
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "1px solid var(--line)" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "var(--ink)" }}>Project Files</h2>
            <p className="text-[11px]" style={{ color: "var(--ink-muted)" }}>
              {files.length} asset{files.length === 1 ? "" : "s"} across generated and captured sources
            </p>
            {outputRoot && (
              <p className="mt-1 max-w-[220px] truncate text-[10px]" style={{ color: "var(--ink-soft)" }}>
                Generated: {outputRoot}
              </p>
            )}
            {captureRoot && (
              <p className="mt-1 max-w-[220px] truncate text-[10px]" style={{ color: "var(--ink-soft)" }}>
                Captured: {captureRoot}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => void loadFiles()}
            className="pill-btn"
            style={{ padding: "7px 9px" }}
            aria-label="Refresh files"
            title="Refresh files"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="max-h-[calc(100vh-180px)] overflow-y-auto p-2">
          {files.length === 0 && (
            <div className="px-4 py-12 text-center">
              <FileText className="mx-auto h-8 w-8" style={{ color: "var(--cream-3)" }} aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold" style={{ color: "var(--ink)" }}>No project files yet</p>
              <p className="mt-1 text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
                Generate outputs or capture evidence so assets appear here.
              </p>
            </div>
          )}

          {files.map((file) => {
            const Icon = kindIcon[file.kind];
            const isSelected = selectedFile?.path === file.path;

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedPath(file.path)}
                className="mb-1 flex w-full items-start gap-3 rounded-2xl px-3 py-3 text-left transition-all"
                style={{
                  background: isSelected ? "rgba(200,125,66,0.1)" : "transparent",
                  border: isSelected ? "1px solid rgba(200,125,66,0.25)" : "1px solid transparent",
                }}
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  style={{ background: "var(--accent-glow)", color: "var(--accent)" }}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-bold" style={{ color: "var(--ink)" }}>
                    {file.name}
                  </span>
                  <span className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--ink-muted)" }}>
                    <span>{collectionLabel[file.collection]}</span>
                    <span>{kindLabel[file.kind]}</span>
                    <span>{formatBytes(file.sizeBytes)}</span>
                  </span>
                  <span className="mt-1 block truncate text-[11px]" style={{ color: "var(--ink-soft)" }}>
                    {file.path}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="glass-card min-w-0 overflow-hidden" style={{ borderRadius: 18 }}>
        {!selectedFile ? (
          <div className="flex min-h-[520px] items-center justify-center px-6 text-center">
            <p className="text-sm" style={{ color: "var(--ink-muted)" }}>
              Generated outputs and captured Brain assets will appear here after you create them.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" style={{ borderBottom: "1px solid var(--line)" }}>
              <div className="min-w-0">
                <h2 className="truncate text-sm font-bold" style={{ color: "var(--ink)" }}>{selectedFile.name}</h2>
                <p className="mt-1 truncate text-[11px]" style={{ color: "var(--ink-muted)" }}>{selectedFile.path}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(15,23,42,0.06)", color: "var(--ink-soft)", border: "1px solid var(--line)" }}>
                  {collectionLabel[selectedFile.collection]}
                </span>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
                  {kindLabel[selectedFile.kind]}
                </span>
                <span className="rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ background: "rgba(255,252,247,0.74)", color: "var(--ink-muted)", border: "1px solid var(--line)" }}>
                  {formatBytes(selectedFile.sizeBytes)}
                </span>
              </div>
            </div>

            <div className="min-h-[520px] overflow-auto bg-[rgba(255,252,247,0.56)] p-5">
              {error && (
                <div className="rounded-2xl px-4 py-3 text-sm" style={{ background: "var(--error-bg)", color: "var(--error)", border: "1px solid rgba(162,59,47,0.2)" }}>
                  {error}
                </div>
              )}

              {isReading && <LoadingSkeleton />}

              {!isReading && !selectedFile.previewable && (
                <BinaryPreview file={selectedFile} />
              )}

              {!isReading && selectedFile.previewable && content?.extension.match(/^\.md|\.markdown$/) && (
                <MarkdownPreview content={content.content} />
              )}

              {!isReading && selectedFile.previewable && content && !content.extension.match(/^\.md|\.markdown$/) && (
                <PreformattedPreview content={content.content} />
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function BinaryPreview({ file }: { file: GeneratedFile }) {
  const Icon = kindIcon[file.kind];
  const locationLabel = file.collection === "captured" ? "Stored in Project Brain captures" : "Stored in project outputs";

  return (
    <div className="flex min-h-[420px] items-center justify-center text-center">
      <div>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl" style={{ background: "var(--accent-glow)", color: "var(--accent)" }}>
          <Icon className="h-6 w-6" aria-hidden="true" />
        </div>
        <p className="mt-4 text-sm font-bold" style={{ color: "var(--ink)" }}>Preview not available</p>
        <p className="mt-1 max-w-sm text-xs leading-relaxed" style={{ color: "var(--ink-muted)" }}>
          {file.name} is tracked as a project asset, but this viewer only previews Markdown and text-based files.
        </p>
        <div className="mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-semibold" style={{ border: "1px solid var(--line)", color: "var(--ink-soft)" }}>
          <Download className="h-3.5 w-3.5" aria-hidden="true" />
          {locationLabel}
        </div>
      </div>
    </div>
  );
}

function MarkdownPreview({ content }: { content: string }) {
  return (
    <article
      className="mx-auto max-w-3xl rounded-2xl bg-white px-7 py-6 shadow-sm"
      style={{ border: "1px solid #d0d7de", color: "#24292f" }}
    >
      {renderMarkdown(content)}
    </article>
  );
}

function PreformattedPreview({ content }: { content: string }) {
  return (
    <pre
      className="overflow-auto rounded-2xl p-4 text-xs leading-relaxed"
      style={{ background: "#0f172a", color: "#e2e8f0" }}
    >
      {content}
    </pre>
  );
}

function renderMarkdown(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const nodes: React.ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (line.startsWith("```")) {
      const language = line.slice(3).trim();
      const codeLines: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index]?.startsWith("```")) {
        codeLines.push(lines[index] ?? "");
        index += 1;
      }
      index += 1;
      nodes.push(
        <pre key={`code-${index}`} className="my-4 overflow-auto rounded-md p-4 text-sm" style={{ background: "#f6f8fa" }}>
          {language && <span className="mb-2 block text-xs font-semibold text-[#57606a]">{language}</span>}
          <code>{codeLines.join("\n")}</code>
        </pre>,
      );
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1]?.length ?? 1;
      const text = heading[2] ?? "";
      nodes.push(renderHeading(level, text, `heading-${index}`));
      index += 1;
      continue;
    }

    if (/^---+$/.test(line.trim())) {
      nodes.push(<hr key={`hr-${index}`} className="my-6 border-[#d0d7de]" />);
      index += 1;
      continue;
    }

    if (/^\s*[-*]\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*[-*]\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*[-*]\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ul key={`ul-${index}`} className="my-3 list-disc space-y-1 pl-6 text-sm leading-6">
          {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}
        </ul>,
      );
      continue;
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\s*\d+\.\s+/.test(lines[index] ?? "")) {
        items.push((lines[index] ?? "").replace(/^\s*\d+\.\s+/, ""));
        index += 1;
      }
      nodes.push(
        <ol key={`ol-${index}`} className="my-3 list-decimal space-y-1 pl-6 text-sm leading-6">
          {items.map((item, itemIndex) => <li key={`${item}-${itemIndex}`}>{renderInlineMarkdown(item)}</li>)}
        </ol>,
      );
      continue;
    }

    if (line.startsWith(">")) {
      const quoteLines: string[] = [];
      while (index < lines.length && lines[index]?.startsWith(">")) {
        quoteLines.push((lines[index] ?? "").replace(/^>\s?/, ""));
        index += 1;
      }
      nodes.push(
        <blockquote key={`quote-${index}`} className="my-4 border-l-4 border-[#d0d7de] pl-4 text-sm leading-6 text-[#57606a]">
          {quoteLines.map((quote, quoteIndex) => <p key={`${quote}-${quoteIndex}`}>{renderInlineMarkdown(quote)}</p>)}
        </blockquote>,
      );
      continue;
    }

    const paragraphLines = [line];
    index += 1;
    while (
      index < lines.length &&
      lines[index]?.trim() &&
      !/^(#{1,6})\s+/.test(lines[index] ?? "") &&
      !/^\s*[-*]\s+/.test(lines[index] ?? "") &&
      !/^\s*\d+\.\s+/.test(lines[index] ?? "") &&
      !lines[index]?.startsWith("```") &&
      !lines[index]?.startsWith(">")
    ) {
      paragraphLines.push(lines[index] ?? "");
      index += 1;
    }

    nodes.push(
      <p key={`p-${index}`} className="my-3 text-sm leading-6">
        {renderInlineMarkdown(paragraphLines.join(" "))}
      </p>,
    );
  }

  return nodes;
}

function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={`${part}-${index}`}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={`${part}-${index}`} className="rounded px-1 py-0.5 text-[0.92em]" style={{ background: "rgba(175,184,193,0.2)" }}>
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

function renderHeading(level: number, text: string, key: string): React.ReactNode {
  const children = renderInlineMarkdown(text);
  const className = headingClass(level);

  if (level === 1) return <h1 key={key} className={className}>{children}</h1>;
  if (level === 2) return <h2 key={key} className={className}>{children}</h2>;
  if (level === 3) return <h3 key={key} className={className}>{children}</h3>;
  if (level === 4) return <h4 key={key} className={className}>{children}</h4>;
  if (level === 5) return <h5 key={key} className={className}>{children}</h5>;
  return <h6 key={key} className={className}>{children}</h6>;
}

function headingClass(level: number): string {
  if (level === 1) return "mb-4 border-b border-[#d0d7de] pb-2 text-3xl font-semibold leading-tight";
  if (level === 2) return "mb-3 mt-6 border-b border-[#d0d7de] pb-2 text-2xl font-semibold leading-tight";
  if (level === 3) return "mb-2 mt-5 text-xl font-semibold leading-tight";
  return "mb-2 mt-4 text-base font-semibold leading-tight";
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}
