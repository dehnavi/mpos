import { z } from 'zod';

export const ConfigSchema = z.object({
  version: z.string(),
  project: z.object({
    name: z.string(),
    description: z.string(),
    created_at: z.string(),
  }),
  ide: z.object({
    default_port: z.number(),
    host: z.string(),
    auto_open_browser: z.boolean(),
  }),
  git: z.object({
    enabled: z.boolean(),
    auto_commit: z.boolean(),
    commit_prefix: z.string(),
    default_branch: z.string(),
    tag_on_milestone: z.boolean(),
  }),
  paths: z.object({
    docs: z.string(),
    planning: z.string(),
    tasks: z.string(),
    decisions: z.string(),
    changes: z.string(),
    templates: z.string(),
    rules: z.string(),
    examples: z.string(),
    tutorials: z.string(),
  }),
  counters: z.object({
    epic: z.number(),
    story: z.number(),
    task: z.number(),
    sprint: z.number(),
    decision: z.number(),
    change_request: z.number(),
    change_report: z.number(),
  }),
  validation: z.object({
    require_frontmatter: z.boolean(),
    require_owner: z.boolean(),
    fail_on_broken_links: z.boolean(),
    fail_on_duplicate_ids: z.boolean(),
  }),
  ai: z.object({
    enabled: z.boolean(),
    provider: z.enum(['ollama', 'lmstudio', 'openai-compatible']),
    baseUrl: z.string(),
    model: z.string(),
    temperature: z.number(),
    maxTokens: z.number(),
  }).optional().default({
    enabled: false,
    provider: 'ollama',
    baseUrl: 'http://localhost:11434',
    model: 'llama3.1',
    temperature: 0.7,
    maxTokens: 2048,
  }),
}).passthrough();

/**
 * Base frontmatter schema shared by all managed documents, per
 * `.mpos/rules/markdown-rules.md` §1. Per-type status validity is checked
 * separately by `ValidationEngine` against `STATUS_VALUES`.
 */
export const FrontmatterSchema = z
  .object({
    id: z.string().min(1, 'id is required'),
    title: z.string().min(1, 'title is required'),
    type: z.string().min(1, 'type is required'),
    status: z.string().min(1, 'status is required'),
    owner: z.string().default(''),
    created_at: z.string().min(1, 'created_at is required'),
    updated_at: z.string().min(1, 'updated_at is required'),
    tags: z.array(z.string()).default([]),
    related: z.array(z.string()).default([]),
    epic: z.string().optional(),
    story: z.string().optional(),
    sprint: z.string().optional(),
    priority: z.string().optional(),
  })
  .passthrough();
