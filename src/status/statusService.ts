import { DocumentRepository } from '../markdown/DocumentRepository';
import { findDuplicateIds, validateDocument } from '../validation/ValidationEngine';
import { DocumentType, MPOSConfig, Severity } from '../domain/types';

export const TRACKED_TYPES = [
  DocumentType.Epic,
  DocumentType.Story,
  DocumentType.Task,
  DocumentType.Sprint,
  DocumentType.Decision,
  DocumentType.ChangeRequest,
  DocumentType.ChangeReport,
];

export interface ActiveSprint {
  id: string;
  title: string;
}

export interface ValidationSummary {
  critical: number;
  warning: number;
  info: number;
}

export interface StatusSummary {
  project: { name: string };
  byType: Record<string, Record<string, number>>;
  activeSprint: ActiveSprint | null;
  validation: ValidationSummary;
}

/** Compute planning counts, active sprint, and validation summary for the workspace. */
export async function getStatusSummary(
  root: string,
  config: MPOSConfig,
  repository: DocumentRepository
): Promise<StatusSummary> {
  const docs = await repository.listAll();

  const byType: Record<string, Record<string, number>> = {};
  for (const doc of docs) {
    const type = String(doc.frontmatter.type);
    const status = String(doc.frontmatter.status);
    const byStatus = byType[type] ?? {};
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    byType[type] = byStatus;
  }

  const activeSprintDoc = docs.find(
    (d) => d.frontmatter.type === DocumentType.Sprint && d.frontmatter.status === 'active'
  );
  const activeSprint = activeSprintDoc
    ? { id: String(activeSprintDoc.frontmatter.id), title: String(activeSprintDoc.frontmatter.title) }
    : null;

  let critical = 0;
  let warning = 0;
  let info = 0;
  for (const doc of docs) {
    const result = await validateDocument(root, doc, config);
    for (const finding of result.findings) {
      if (finding.severity === Severity.Critical) critical++;
      else if (finding.severity === Severity.Warning) warning++;
      else info++;
    }
  }
  for (const finding of await findDuplicateIds(repository, config)) {
    if (finding.severity === Severity.Critical) critical++;
    else warning++;
  }

  return {
    project: { name: config.project.name },
    byType,
    activeSprint,
    validation: { critical, warning, info },
  };
}
