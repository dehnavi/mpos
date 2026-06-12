import * as path from 'path';
import { fileExists } from '../utils/fileUtils';
import { getTopLevelHeadings } from '../markdown/SectionLocator';
import { FrontmatterSchema } from './schemas';
import { DocumentRepository, MarkdownDocument } from '../markdown/DocumentRepository';
import { loadTemplate, getTemplateHeadings, TemplateName } from '../templates/TemplateRegistry';
import { DocumentType, MPOSConfig, Severity, STATUS_VALUES } from '../domain/types';

export interface ValidationFinding {
  severity: Severity;
  message: string;
}

export interface ValidationResult {
  id: string;
  path: string;
  findings: ValidationFinding[];
}

/** Document types whose `##` heading set is checked against a template. */
const TEMPLATE_BY_TYPE: Partial<Record<string, TemplateName>> = {
  [DocumentType.Prd]: 'prd',
  [DocumentType.BusinessRules]: 'business-rules',
  [DocumentType.Epic]: 'epic',
  [DocumentType.Story]: 'story',
  [DocumentType.Task]: 'task',
  [DocumentType.Sprint]: 'sprint',
  [DocumentType.Decision]: 'decision',
  [DocumentType.ChangeRequest]: 'change-request',
  [DocumentType.ChangeReport]: 'change-report',
};

export async function validateDocument(
  root: string,
  doc: MarkdownDocument,
  config: MPOSConfig
): Promise<ValidationResult> {
  const findings: ValidationFinding[] = [];
  const fm = doc.frontmatter;

  // 1. Frontmatter schema
  const parsed = FrontmatterSchema.safeParse(fm);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      findings.push({
        severity: Severity.Critical,
        message: `frontmatter.${issue.path.join('.')}: ${issue.message}`,
      });
    }
  }
  if (config.validation.require_owner && !fm.owner) {
    findings.push({ severity: Severity.Warning, message: 'owner is required but empty' });
  }

  // 2. Status valid for type
  const allowedStatuses = STATUS_VALUES[fm.type as DocumentType];
  if (allowedStatuses && !allowedStatuses.includes(fm.status)) {
    findings.push({
      severity: Severity.Critical,
      message: `status "${fm.status}" is not valid for type "${fm.type}" (expected one of: ${allowedStatuses.join(', ')})`,
    });
  }

  // 3. H1 matches title
  const h1Match = doc.body.match(/^#\s+(.+?)\s*$/m);
  if (!h1Match) {
    findings.push({ severity: Severity.Critical, message: 'missing H1 heading' });
  } else if (h1Match[1].trim() !== fm.title) {
    findings.push({
      severity: Severity.Critical,
      message: `H1 "${h1Match[1].trim()}" does not match frontmatter title "${fm.title}"`,
    });
  }

  // 4. Top-level heading set/order matches the type's template
  const templateName = TEMPLATE_BY_TYPE[fm.type as string];
  if (templateName) {
    try {
      const template = await loadTemplate(root, templateName);
      const expected = getTemplateHeadings(template);
      const actual = getTopLevelHeadings(doc.body);
      if (JSON.stringify(expected) !== JSON.stringify(actual)) {
        findings.push({
          severity: Severity.Critical,
          message: `heading set does not match "${templateName}" template. expected: [${expected.join(', ')}], actual: [${actual.join(', ')}]`,
        });
      }
    } catch {
      // Template unavailable — skip heading-set check.
    }
  }

  // 5. Links resolve (related: entries + inline relative links)
  if (config.validation.fail_on_broken_links) {
    const docDir = path.dirname(doc.absPath);
    for (const link of collectLinks(doc)) {
      if (/^[a-z]+:\/\//i.test(link) || link.startsWith('#')) continue;
      const target = link.split('#')[0];
      if (!target) continue;
      const resolved = path.resolve(docDir, target);
      if (!(await fileExists(resolved))) {
        findings.push({ severity: Severity.Critical, message: `broken link: "${link}"` });
      }
    }
  }

  return { id: String(fm.id ?? '(unknown)'), path: doc.relPath, findings };
}

/** Strip fenced code blocks and inline code spans, which often contain illustrative links. */
function stripCode(text: string): string {
  return text.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]*`/g, '');
}

function collectLinks(doc: MarkdownDocument): string[] {
  const links: string[] = [];
  const related = doc.frontmatter.related;
  if (Array.isArray(related)) {
    links.push(...related.filter((r): r is string => typeof r === 'string'));
  }
  const inlineLinkRe = /\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  const body = stripCode(doc.body);
  while ((m = inlineLinkRe.exec(body)) !== null) {
    links.push(m[1]);
  }
  return links;
}

/** Workspace-wide check for documents sharing the same `id`. */
export async function findDuplicateIds(
  repository: DocumentRepository,
  config: MPOSConfig
): Promise<ValidationFinding[]> {
  const docs = await repository.listAll();
  const byId = new Map<string, string[]>();
  for (const doc of docs) {
    const id = doc.frontmatter.id;
    if (!id) continue;
    const paths = byId.get(id) ?? [];
    paths.push(doc.relPath);
    byId.set(id, paths);
  }

  const findings: ValidationFinding[] = [];
  for (const [id, paths] of byId) {
    if (paths.length > 1) {
      findings.push({
        severity: config.validation.fail_on_duplicate_ids ? Severity.Critical : Severity.Warning,
        message: `duplicate id "${id}" found in: ${paths.join(', ')}`,
      });
    }
  }
  return findings;
}
