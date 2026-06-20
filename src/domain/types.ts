/**
 * Core domain types for MPOS, matching `.mpos/rules/markdown-rules.md`,
 * `naming-rules.md`, `planning-rules.md`, and `conflict-rules.md`.
 */

export enum DocumentType {
  Prd = 'prd',
  BusinessRules = 'business-rules',
  Glossary = 'glossary',
  Architecture = 'architecture',
  Roadmap = 'roadmap',
  Epic = 'epic',
  Story = 'story',
  Task = 'task',
  Sprint = 'sprint',
  Decision = 'decision',
  ChangeRequest = 'change-request',
  ChangeReport = 'change-report',
  Onboarding = 'onboarding',
}

export enum EpicStatus {
  Draft = 'draft',
  Planned = 'planned',
  Active = 'active',
  Done = 'done',
  Cancelled = 'cancelled',
}

export enum StoryStatus {
  Backlog = 'backlog',
  Ready = 'ready',
  InProgress = 'in-progress',
  InReview = 'in-review',
  Done = 'done',
  Blocked = 'blocked',
}

export enum TaskStatus {
  Backlog = 'backlog',
  Active = 'active',
  Blocked = 'blocked',
  Done = 'done',
}

export enum SprintStatus {
  Planned = 'planned',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum DecisionStatus {
  Proposed = 'proposed',
  Accepted = 'accepted',
  Rejected = 'rejected',
  Superseded = 'superseded',
}

export enum ChangeRequestStatus {
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Applied = 'applied',
}

export enum ChangeReportStatus {
  Final = 'final',
}

export enum Priority {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low',
}

export enum Severity {
  Info = 'info',
  Warning = 'warning',
  Critical = 'critical',
}

/** Valid `status` values per document type, per planning-rules.md §2. */
export const STATUS_VALUES: Partial<Record<DocumentType, string[]>> = {
  [DocumentType.Epic]: Object.values(EpicStatus),
  [DocumentType.Story]: Object.values(StoryStatus),
  [DocumentType.Task]: Object.values(TaskStatus),
  [DocumentType.Sprint]: Object.values(SprintStatus),
  [DocumentType.Decision]: Object.values(DecisionStatus),
  [DocumentType.ChangeRequest]: Object.values(ChangeRequestStatus),
  [DocumentType.ChangeReport]: Object.values(ChangeReportStatus),
};

/**
 * Frontmatter schema shared by all managed documents, per markdown-rules.md §1.
 * `[key: string]: unknown` allows type-specific extra fields (epic/story/sprint/
 * priority) to round-trip without being stripped.
 */
export interface DocumentFrontmatter {
  id: string;
  title: string;
  type: DocumentType | string;
  status: string;
  owner: string;
  created_at: string;
  updated_at: string;
  tags: string[];
  related: string[];
  epic?: string;
  story?: string;
  sprint?: string;
  priority?: Priority | string;
  [key: string]: unknown;
}

export interface MarkdownSection {
  heading: string;
  level: number;
  content: string;
  markers: string[];
}

/** Keys into `MPOSConfig.counters`, per naming-rules.md §1. */
export type CounterKey =
  | 'epic'
  | 'story'
  | 'task'
  | 'sprint'
  | 'decision'
  | 'change_request'
  | 'change_report';

export interface IdSpec {
  prefix: string;
  counterKey: CounterKey;
}

/** ID prefix + counter mapping for id-bearing document types, per naming-rules.md §1. */
export const ID_PREFIXES: Partial<Record<DocumentType, IdSpec>> = {
  [DocumentType.Epic]: { prefix: 'EPIC', counterKey: 'epic' },
  [DocumentType.Story]: { prefix: 'STORY', counterKey: 'story' },
  [DocumentType.Task]: { prefix: 'TASK', counterKey: 'task' },
  [DocumentType.Sprint]: { prefix: 'SPRINT', counterKey: 'sprint' },
  [DocumentType.Decision]: { prefix: 'ADR', counterKey: 'decision' },
  [DocumentType.ChangeRequest]: { prefix: 'CR', counterKey: 'change_request' },
  [DocumentType.ChangeReport]: { prefix: 'CHG', counterKey: 'change_report' },
};

export const PREFIX_TO_TYPE: Record<string, DocumentType> = Object.fromEntries(
  Object.entries(ID_PREFIXES).map(([type, spec]) => [spec!.prefix, type as DocumentType])
);

export interface MPOSConfig {
  version: string;
  project: {
    name: string;
    description: string;
    created_at: string;
  };
  ide: {
    default_port: number;
    host: string;
    auto_open_browser: boolean;
  };
  git: {
    enabled: boolean;
    auto_commit: boolean;
    commit_prefix: string;
    default_branch: string;
    tag_on_milestone: boolean;
  };
  paths: {
    docs: string;
    planning: string;
    tasks: string;
    decisions: string;
    changes: string;
    templates: string;
    rules: string;
    examples: string;
    tutorials: string;
  };
  counters: Record<CounterKey, number>;
  validation: {
    require_frontmatter: boolean;
    require_owner: boolean;
    fail_on_broken_links: boolean;
    fail_on_duplicate_ids: boolean;
  };
  ai: {
    enabled: boolean;
    provider: 'ollama' | 'lmstudio' | 'openai-compatible';
    baseUrl: string;
    model: string;
    temperature: number;
    maxTokens: number;
  };
}
