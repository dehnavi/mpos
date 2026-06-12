import * as path from 'path';
import { fileExists, listFiles, listMarkdownFiles, readFile, relativePath, writeFile } from '../utils/fileUtils';
import { parseMarkdown, stringifyMarkdown } from '../utils/markdownUtils';
import { slugify } from '../utils/slugify';
import { DocumentFrontmatter, DocumentType, PREFIX_TO_TYPE } from '../domain/types';

export interface MarkdownDocument {
  /** Absolute filesystem path. */
  absPath: string;
  /** Path relative to the workspace root, forward-slash normalized. */
  relPath: string;
  frontmatter: DocumentFrontmatter;
  /** Markdown body, without frontmatter. */
  body: string;
  /** Full file content, including frontmatter. */
  raw: string;
}

/** Fixed-location documents with a fixed `id` equal to their filename (naming-rules.md §3). */
export const FIXED_DOCS: Record<string, string> = {
  prd: 'docs/prd.md',
  'business-rules': 'docs/business-rules.md',
  glossary: 'docs/glossary.md',
  architecture: 'docs/architecture.md',
  roadmap: 'planning/roadmap.md',
};

/** Directory for each id-bearing document type, per naming-rules.md §3. */
export const DIR_MAP: Partial<Record<DocumentType, string>> = {
  [DocumentType.Epic]: 'planning/epics',
  [DocumentType.Story]: 'planning/stories',
  [DocumentType.Sprint]: 'planning/sprints',
  [DocumentType.Decision]: 'decisions',
  [DocumentType.ChangeRequest]: 'changes/requests',
  [DocumentType.ChangeReport]: 'changes/reports',
};

export const TASK_STATUS_DIRS = ['backlog', 'active', 'blocked', 'done'];

const LISTED_TOP_LEVEL_DIRS = ['docs', 'planning', 'tasks', 'decisions', 'changes', 'tutorials'];

export class DocumentRepository {
  constructor(private readonly root: string) {}

  /** List every managed Markdown document in the workspace. */
  async listAll(): Promise<MarkdownDocument[]> {
    const docs: MarkdownDocument[] = [];
    for (const dir of LISTED_TOP_LEVEL_DIRS) {
      const files = await listMarkdownFiles(path.join(this.root, dir));
      for (const absPath of files) {
        docs.push(await this.read(relativePath(this.root, absPath)));
      }
    }
    return docs;
  }

  /** Find a document by its `<PREFIX>-NNN` ID or fixed-doc id (e.g. `prd`, `roadmap`). */
  async findById(id: string): Promise<MarkdownDocument | null> {
    if (FIXED_DOCS[id]) {
      return this.tryRead(FIXED_DOCS[id]);
    }

    const prefix = id.split('-')[0];
    const type = PREFIX_TO_TYPE[prefix];
    if (!type) return null;

    if (type === DocumentType.Task) {
      for (const status of TASK_STATUS_DIRS) {
        const found = await this.findInDir(path.join('tasks', status), id);
        if (found) return found;
      }
      return null;
    }

    const dir = DIR_MAP[type];
    if (!dir) return null;
    return this.findInDir(dir, id);
  }

  private async findInDir(relDir: string, id: string): Promise<MarkdownDocument | null> {
    const files = await listFiles(path.join(this.root, relDir), '*.md');
    const match = files.find((f) => {
      const base = path.basename(f, '.md');
      return base === id || base.startsWith(`${id}-`);
    });
    return match ? this.read(relativePath(this.root, match)) : null;
  }

  private async tryRead(relPath: string): Promise<MarkdownDocument | null> {
    return (await fileExists(path.join(this.root, relPath))) ? this.read(relPath) : null;
  }

  async read(relPath: string): Promise<MarkdownDocument> {
    const normalized = relPath.replace(/\\/g, '/');
    const absPath = path.join(this.root, normalized);
    const raw = await readFile(absPath);
    const { frontmatter, content } = parseMarkdown(raw);
    return {
      absPath,
      relPath: normalized,
      frontmatter: frontmatter as DocumentFrontmatter,
      body: content,
      raw,
    };
  }

  async write(doc: MarkdownDocument): Promise<void> {
    await writeFile(doc.absPath, stringifyMarkdown(doc.frontmatter, doc.body));
  }

  async writeRaw(absPath: string, raw: string): Promise<void> {
    await writeFile(absPath, raw);
  }

  /** Compute the path a newly-created document of `type` should be written to. */
  resolveNewPath(type: DocumentType, id: string, title: string): string {
    const filename = `${id}-${slugify(title)}.md`;
    if (type === DocumentType.Task) {
      return path.join(this.root, 'tasks', 'backlog', filename);
    }
    const dir = DIR_MAP[type];
    if (!dir) {
      throw new Error(`Document type "${type}" does not support \`doc create\``);
    }
    return path.join(this.root, dir, filename);
  }
}
