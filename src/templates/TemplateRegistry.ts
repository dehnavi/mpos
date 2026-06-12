import * as path from 'path';
import { fileExists, readFile } from '../utils/fileUtils';
import { resolveResourcePath } from '../utils/paths';
import { getTopLevelHeadings } from '../markdown/SectionLocator';

export type TemplateName =
  | 'prd'
  | 'business-rules'
  | 'glossary'
  | 'architecture'
  | 'epic'
  | 'story'
  | 'task'
  | 'sprint'
  | 'decision'
  | 'change-request'
  | 'change-report'
  | 'onboarding-guide';

/**
 * Load a template, preferring a project-local override under
 * `.mpos/templates/`, falling back to the bundled copy in
 * `resources/init-template/.mpos/templates/`.
 */
export async function loadTemplate(root: string, name: TemplateName): Promise<string> {
  const projectPath = path.join(root, '.mpos', 'templates', `${name}.md`);
  if (await fileExists(projectPath)) {
    return readFile(projectPath);
  }
  const bundledPath = resolveResourcePath('init-template', '.mpos', 'templates', `${name}.md`);
  if (await fileExists(bundledPath)) {
    return readFile(bundledPath);
  }
  throw new Error(`Template "${name}" not found in .mpos/templates/ or bundled resources`);
}

/**
 * Substitute `{{key}}` placeholders with values from `vars`. Any remaining
 * `{{...}}` placeholders are replaced with `TBD`.
 */
export function renderTemplate(content: string, vars: Record<string, string>): string {
  let out = content;
  for (const [key, value] of Object.entries(vars)) {
    out = out.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), value);
  }
  return out.replace(/{{\s*[a-zA-Z0-9_]+\s*}}/g, 'TBD');
}

/** Top-level (`##`) heading texts of a template, used by the validation engine. */
export function getTemplateHeadings(content: string): string[] {
  return getTopLevelHeadings(content);
}

/**
 * Strip leading `<!-- ... -->` comment lines (template metadata, e.g.
 * `<!-- MPOS TEMPLATE: epic | ... -->`) so the remaining content starts with
 * the `---` frontmatter delimiter and parses correctly with gray-matter.
 */
export function stripLeadingComments(content: string): string {
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length && /^<!--.*-->\s*$/.test(lines[i])) {
    i++;
  }
  return lines.slice(i).join('\n');
}
