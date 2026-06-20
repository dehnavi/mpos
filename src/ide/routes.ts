import { Router, Request, Response } from 'express';
import * as path from 'path';
import { DocumentRepository, MarkdownDocument } from '../markdown/DocumentRepository';
import { SectionEditError } from '../markdown/SectionEditor';
import { applyDocUpdate, ApplyDocUpdateOptions } from '../markdown/applyDocUpdate';
import { extractMarkers, parseSections, todayString } from '../utils/markdownUtils';
import { renderMarkdownHtml } from './markdownRender';
import { resolveSafeRelPath, UnsafePathError } from './paths';
import { searchDocuments } from '../search/searchService';
import { getStatusSummary } from '../status/statusService';
import { findDuplicateIds, validateDocument } from '../validation/ValidationEngine';
import { GitService } from '../git/GitService';
import { MARKER_NAMES } from '../utils/markdownUtils';
import { MPOSConfig, STATUS_VALUES, DocumentType, ID_PREFIXES } from '../domain/types';
import { nextId } from '../config/ConfigStore';
import { loadTemplate, renderTemplate, stripLeadingComments, TemplateName } from '../templates/TemplateRegistry';
import { slugify } from '../utils/slugify';
import { complete, listModels, AICompletionRequest } from '../ai/AIService';

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

  const CREATE_TYPES: Record<string, { type: DocumentType; template: TemplateName }> = {
    epic: { type: DocumentType.Epic, template: 'epic' },
    story: { type: DocumentType.Story, template: 'story' },
    task: { type: DocumentType.Task, template: 'task' },
    sprint: { type: DocumentType.Sprint, template: 'sprint' },
    decision: { type: DocumentType.Decision, template: 'decision' },
    'change-request': { type: DocumentType.ChangeRequest, template: 'change-request' },
    'change-report': { type: DocumentType.ChangeReport, template: 'change-report' },
  };

  router.post('/create-doc', async (req: Request, res: Response) => {
    try {
      const { type: typeArg, title, parent } = req.body as { type?: string; title?: string; parent?: string };

      if (!typeArg || !title) {
        res.status(400).json({ error: 'type and title are required.' });
        return;
      }

      const spec = CREATE_TYPES[typeArg];
      if (!spec) {
        res.status(400).json({ error: `Unknown type "${typeArg}". Expected one of: ${Object.keys(CREATE_TYPES).join(', ')}` });
        return;
      }

      const vars: Record<string, string> = {
        title,
        date: todayString(),
        owner: '',
      };

      if (spec.type === DocumentType.Story) {
        if (!parent) {
          res.status(400).json({ error: 'story requires a parent epic ID.' });
          return;
        }
        const epicDoc = await repository.findById(parent);
        if (!epicDoc) {
          res.status(400).json({ error: `Epic "${parent}" not found.` });
          return;
        }
        vars.epic_id = parent;
        vars.epic_slug = slugify(String(epicDoc.frontmatter.title));
      }

      if (spec.type === DocumentType.Task) {
        if (!parent) {
          res.status(400).json({ error: 'task requires a parent story ID.' });
          return;
        }
        const storyDoc = await repository.findById(parent);
        if (!storyDoc) {
          res.status(400).json({ error: `Story "${parent}" not found.` });
          return;
        }
        vars.story_id = parent;
        vars.story_slug = slugify(String(storyDoc.frontmatter.title));
        vars.epic_id = String(storyDoc.frontmatter.epic ?? '');
      }

      const id = await nextId(root, spec.type);
      vars.id = id;

      const template = await loadTemplate(root, spec.template);
      const rendered = renderTemplate(stripLeadingComments(template), vars);

      const destPath = repository.resolveNewPath(spec.type, id, title);
      await repository.writeRaw(destPath, rendered);

      const relPath = path.relative(root, destPath).replace(/\\/g, '/');
      res.json({ id, path: relPath, title });
    } catch (err) {
      handleError(res, err);
    }
  });

  router.post('/ai/complete', async (req: Request, res: Response) => {
    try {
      if (!config.ai?.enabled) {
        res.status(400).json({ error: 'AI is not enabled. Set "ai.enabled": true in .mpos/config.json.' });
        return;
      }

      const body = req.body as AICompletionRequest;
      if (!body.prompt) {
        res.status(400).json({ error: 'prompt is required.' });
        return;
      }

      const result = await complete(config, body);
      res.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: `AI request failed: ${message}` });
    }
  });

  router.get('/ai/models', async (_req: Request, res: Response) => {
    try {
      if (!config.ai?.enabled) {
        res.json({ models: [], provider: config.ai?.provider || 'ollama', enabled: false });
        return;
      }
      const result = await listModels(config);
      res.json({ ...result, enabled: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      res.status(502).json({ error: `Failed to list models: ${message}` });
    }
  });

  router.get('/ai/status', (_req: Request, res: Response) => {
    res.json({
      enabled: config.ai?.enabled ?? false,
      provider: config.ai?.provider ?? 'ollama',
      model: config.ai?.model ?? '',
      baseUrl: config.ai?.baseUrl ?? '',
    });
  });

  return router;
}
