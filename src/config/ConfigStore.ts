import * as path from 'path';
import { fileExists, readJsonSafe, writeJson } from '../utils/fileUtils';
import { todayString } from '../utils/markdownUtils';
import { ConfigSchema } from '../validation/schemas';
import { DocumentType, ID_PREFIXES, MPOSConfig } from '../domain/types';

const CONFIG_RELATIVE_PATH = path.join('.mpos', 'config.json');

export const DEFAULT_CONFIG: MPOSConfig = {
  version: '1.0.0',
  project: {
    name: '',
    description: '',
    created_at: todayString(),
  },
  ide: {
    default_port: 4317,
    host: 'localhost',
    auto_open_browser: true,
  },
  git: {
    enabled: true,
    auto_commit: false,
    commit_prefix: 'mpos:',
    default_branch: 'main',
    tag_on_milestone: false,
  },
  paths: {
    docs: 'docs',
    planning: 'planning',
    tasks: 'tasks',
    decisions: 'decisions',
    changes: 'changes',
    templates: '.mpos/templates',
    rules: '.mpos/rules',
    examples: '.mpos/examples',
    tutorials: 'tutorials',
  },
  counters: {
    epic: 0,
    story: 0,
    task: 0,
    sprint: 0,
    decision: 0,
    change_request: 0,
    change_report: 0,
  },
  validation: {
    require_frontmatter: true,
    require_owner: false,
    fail_on_broken_links: true,
    fail_on_duplicate_ids: true,
  },
  ai: {
    enabled: false,
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.1',
    temperature: 0.7,
    maxTokens: 2048,
  },
};

export function configPath(root: string): string {
  return path.join(root, CONFIG_RELATIVE_PATH);
}

export async function configExists(root: string): Promise<boolean> {
  return fileExists(configPath(root));
}

export async function loadConfig(root: string): Promise<MPOSConfig> {
  const raw = await readJsonSafe<unknown>(configPath(root), DEFAULT_CONFIG);
  return ConfigSchema.parse(raw);
}

export async function saveConfig(root: string, config: MPOSConfig): Promise<void> {
  await writeJson(configPath(root), config);
}

/**
 * Mint the next ID for a document type and persist the incremented counter.
 * This is the only place IDs are minted (naming-rules.md §5).
 */
export async function nextId(root: string, type: DocumentType): Promise<string> {
  const spec = ID_PREFIXES[type];
  if (!spec) {
    throw new Error(`Document type "${type}" does not use generated IDs`);
  }
  const config = await loadConfig(root);
  const next = (config.counters[spec.counterKey] ?? 0) + 1;
  config.counters[spec.counterKey] = next;
  await saveConfig(root, config);
  return `${spec.prefix}-${String(next).padStart(3, '0')}`;
}

export function resolvePath(
  config: MPOSConfig,
  root: string,
  key: keyof MPOSConfig['paths'],
  ...parts: string[]
): string {
  return path.join(root, config.paths[key], ...parts);
}
