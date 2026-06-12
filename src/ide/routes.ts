import { Router, Request, Response } from 'express';
import * as path from 'path';
import { DocumentRepository, MarkdownDocument } from '../markdown/DocumentRepository';
import { SectionEditError } from '../markdown/SectionEditor';
import { applyDocUpdate, ApplyDocUpdateOptions } from '../markdown/applyDocUpdate';
import { extractMarkers, parseSections } from '../utils/markdownUtils';
import { renderMarkdownHtml } from './markdownRender';
import { resolveSafeRelPath, UnsafePathError } from './paths';
import { searchDocuments } from '../search/searchService';
import { getStatusSummary } from '../status/statusService';
import { findDuplicateIds, validateDocument } from '../validation/ValidationEngine';
import { GitService } from '../git/GitService';
import { MARKER_NAMES } from '../utils/markdownUtils';
import { MPOSConfig, STATUS_VALUES } from '../domain/types';

function docToJson(doc: MarkdownDocument) {
  const sections = parseSections(doc.body)
    .filter((s) => s.level === 2)
    .map((s) => ({ heading: s.heading, content: s.content, markers: s.markers }));

  return {
    path: doc.relPath,
    frontmatter: doc.frontmatter,
    body: doc.body,
    html: renderMarkdownHtml(doc.body),
    sections,
    markers: extractMarkers(doc.body),
  };
}

function handleError(res: Response, err: unknown): void {
  if (err instanceof UnsafePathError || err instanceof SectionEditError) {
    res.status(400).json({ error: err.message });
    return;
  }
  throw err;
}

export function createApiRouter(root: string, config: MPOSConfig): Router {
  const router = Router();
  const repository = new DocumentRepository(root);
  const git = new GitService(root);

  router.get('/meta', (_req: Request, res: Response) => {
    res.json({ project: config.project, statusValues: STATUS_VALUES, markerNames: MARKER_NAMES });
  });

  router.get('/tree', async (_req: Request, res: Response) => {
    const docs = await repository.listAll();
    const tree = docs
      .map((d) => ({
        id: String(d.frontmatter.id ?? ''),
        title: String(d.frontmatter.title ?? ''),
        type: String(d.frontmatter.type ?? ''),
        status: String(d.frontmatter.status ?? ''),
        path: d.relPath,
      }))
      .sort((a, b) => a.path.localeCompare(b.path));
    res.json(tree);
  });

  router.get('/doc', async (req: Request, res: Response) => {
    try {
      const relPath = resolveSafeRelPath(root, String(req.query.path ?? ''));
      const doc = await repository.read(relPath);
      res.json(docToJson(doc));
    } catch (err) {
      handleError(res, err);
    }
  });

  router.put('/doc', async (req: Request, res: Response) => {
    try {
      const relPath = resolveSafeRelPath(root, String(req.query.path ?? ''));
      const body = req.body as ApplyDocUpdateOptions;
      if (!body.section && !body.status) {
        res.status(400).json({ error: 'Nothing to update — provide "section" (with "text") and/or "status".' });
        return;
      }
      const doc = await repository.read(relPath);
      const raw = applyDocUpdate(doc, body);
      await repository.writeRaw(doc.absPath, raw);
      const updated = await repository.read(relPath);
      res.json(docToJson(updated));
    } catch (err) {
      handleError(res, err);
    }
  });

  router.get('/diff', async (req: Request, res: Response) => {
    try {
      const relPath = resolveSafeRelPath(root, String(req.query.path ?? ''));
      const diff = await git.getDiff([path.join(root, relPath)]);
      res.json({ diff });
    } catch (err) {
      handleError(res, err);
    }
  });

  router.get('/search', async (req: Request, res: Response) => {
    const q = String(req.query.q ?? '');
    const type = req.query.type ? String(req.query.type) : undefined;
    const marker = req.query.marker ? String(req.query.marker) : undefined;
    const results = await searchDocuments(repository, q, { type, marker });
    res.json(results);
  });

  router.get('/status', async (_req: Request, res: Response) => {
    const summary = await getStatusSummary(root, config, repository);
    const gitStatus = await git.getStatus();
    res.json({ ...summary, git: gitStatus });
  });

  router.get('/validate', async (req: Request, res: Response) => {
    try {
      const pathParam = req.query.path ? resolveSafeRelPath(root, String(req.query.path)) : undefined;
      const docs = pathParam ? [await repository.read(pathParam)] : await repository.listAll();

      const results = [];
      for (const doc of docs) {
        results.push(await validateDocument(root, doc, config));
      }
      const duplicates = pathParam ? [] : await findDuplicateIds(repository, config);
      res.json({ results, duplicates });
    } catch (err) {
      handleError(res, err);
    }
  });

  return router;
}
