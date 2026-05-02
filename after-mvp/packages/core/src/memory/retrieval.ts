import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { brainFileNames } from "./brain-files";

export type SearchCitation = {
  path: string;
  line?: number;
  label: string;
};

export type SearchResult = {
  file: string;
  preview: string;
  score: number;
  line?: number;
  matches: string[];
  citation: SearchCitation;
};

export type RetrievalOptions = {
  limit?: number;
};

type BrainFileName = (typeof brainFileNames)[keyof typeof brainFileNames];

type RetrievalDocument = {
  file: BrainFileName;
  content: string;
  title: string;
  weight: number;
};

const DEFAULT_LIMIT = 8;

const stopWords = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "how",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "this",
  "to",
  "with",
]);

const fileWeights: Record<BrainFileName, number> = {
  [brainFileNames.overview]: 1.35,
  [brainFileNames.intent]: 1.25,
  [brainFileNames.architecture]: 1.25,
  [brainFileNames.decisions]: 1.2,
  [brainFileNames.changelog]: 1.15,
  [brainFileNames.journey]: 1.15,
  [brainFileNames.entities]: 1,
  [brainFileNames.media]: 0.95,
};

export class ProjectBrainRetriever {
  readonly brainPath: string;

  constructor(projectPath: string) {
    this.brainPath = join(projectPath, "brain");
  }

  async search(query: string, options: RetrievalOptions = {}): Promise<SearchResult[]> {
    const normalizedQuery = normalizeText(query);
    const terms = tokenize(query);

    if (!normalizedQuery || terms.length === 0) {
      return [];
    }

    const documents = await this.loadDocuments();
    const results = documents
      .map((document) => this.scoreDocument(document, normalizedQuery, terms))
      .filter((result): result is SearchResult => result !== undefined)
      .sort((left, right) => {
        if (right.score !== left.score) return right.score - left.score;
        return left.file.localeCompare(right.file);
      });

    return results.slice(0, options.limit ?? DEFAULT_LIMIT);
  }

  private async loadDocuments(): Promise<RetrievalDocument[]> {
    const files = Object.values(brainFileNames);
    const documents = await Promise.all(
      files.map(async (file): Promise<RetrievalDocument | undefined> => {
        try {
          const content = await readFile(join(this.brainPath, file), "utf8");
          return {
            file,
            content,
            title: extractTitle(content),
            weight: fileWeights[file],
          };
        } catch (error) {
          if (isMissingFileError(error)) {
            return undefined;
          }

          throw error;
        }
      }),
    );

    return documents.filter(
      (document): document is RetrievalDocument => document !== undefined,
    );
  }

  private scoreDocument(
    document: RetrievalDocument,
    normalizedQuery: string,
    terms: string[],
  ): SearchResult | undefined {
    const normalizedContent = normalizeText(document.content);
    const normalizedTitle = normalizeText(document.title);
    const exactPhraseCount =
      normalizedQuery.includes(" ")
        ? countOccurrences(normalizedContent, normalizedQuery)
        : 0;
    const termCounts = terms.map((term) => ({
      term,
      contentCount: countOccurrences(normalizedContent, term),
      titleCount: countOccurrences(normalizedTitle, term),
    }));
    const matchedTerms = termCounts
      .filter((item) => item.contentCount > 0 || item.titleCount > 0)
      .map((item) => item.term);

    if (exactPhraseCount === 0 && matchedTerms.length === 0) {
      return undefined;
    }

    const totalTermHits = termCounts.reduce(
      (total, item) => total + item.contentCount,
      0,
    );
    const titleHits = termCounts.reduce((total, item) => total + item.titleCount, 0);
    const coverageRatio = matchedTerms.length / terms.length;
    const rawScore =
      exactPhraseCount * 28 +
      totalTermHits * 4 +
      titleHits * 10 +
      matchedTerms.length * 6 +
      coverageRatio * 12;
    const score = Number((rawScore * document.weight).toFixed(2));
    const bestIndex = findBestMatchIndex(document.content, normalizedQuery, terms);
    const line = getLineNumber(document.content, bestIndex);

    return {
      file: document.file,
      preview: createPreview(document.content, bestIndex),
      score,
      line,
      matches: matchedTerms,
      citation: {
        path: document.file,
        line,
        label: `${document.file}:${line}`,
      },
    };
  }
}

const normalizeText = (value: string): string =>
  value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tokenize = (query: string): string[] => {
  const seen = new Set<string>();
  return normalizeText(query)
    .split(/\s+/)
    .filter((term) => term.length > 1 && !stopWords.has(term))
    .filter((term) => {
      if (seen.has(term)) return false;
      seen.add(term);
      return true;
    });
};

const extractTitle = (content: string): string => {
  const titleLine = content
    .split(/\r?\n/)
    .find((line) => line.trim().startsWith("#"));
  return titleLine?.replace(/^#+\s*/, "").trim() ?? "";
};

const countOccurrences = (content: string, term: string): number => {
  if (!term) return 0;

  let count = 0;
  let index = content.indexOf(term);

  while (index !== -1) {
    count += 1;
    index = content.indexOf(term, index + term.length);
  }

  return count;
};

const findBestMatchIndex = (
  content: string,
  normalizedQuery: string,
  terms: string[],
): number => {
  const lowerContent = content.toLowerCase();
  const phraseIndex = normalizedQuery.includes(" ")
    ? lowerContent.indexOf(normalizedQuery)
    : -1;

  if (phraseIndex !== -1) {
    return phraseIndex;
  }

  const termIndexes = terms
    .map((term) => lowerContent.indexOf(term))
    .filter((index) => index !== -1);

  return termIndexes.length ? Math.min(...termIndexes) : 0;
};

const getLineNumber = (content: string, index: number): number => {
  const safeIndex = Math.max(0, index);
  return content.slice(0, safeIndex).split(/\r?\n/).length;
};

const createPreview = (content: string, index: number): string => {
  const safeIndex = Math.max(0, index);
  const start = Math.max(0, safeIndex - 90);
  const end = Math.min(content.length, safeIndex + 180);
  return content.slice(start, end).replace(/\s+/g, " ").trim();
};

const isMissingFileError = (error: unknown): boolean =>
  typeof error === "object" &&
  error !== null &&
  "code" in error &&
  (error as { code?: string }).code === "ENOENT";
