import * as Diff from 'diff';
import chalk from 'chalk';

export interface DiffResult {
  added: number;
  removed: number;
  unchanged: number;
  hunks: DiffHunk[];
  hasMeaningfulChanges: boolean;
}

export interface DiffHunk {
  header: string;
  lines: DiffLine[];
}

export interface DiffLine {
  type: 'added' | 'removed' | 'context';
  content: string;
}

export function computeDiff(oldContent: string, newContent: string): DiffResult {
  const changes = Diff.diffLines(oldContent, newContent);
  let added = 0;
  let removed = 0;
  let unchanged = 0;
  const hunks: DiffHunk[] = [];
  let currentHunk: DiffHunk | null = null;

  for (const change of changes) {
    const lines = change.value.split('\n').filter((_, i, arr) => i < arr.length - 1 || arr[i] !== '');

    if (change.added) {
      added += lines.length;
      if (!currentHunk) {
        currentHunk = { header: `@@ change @@`, lines: [] };
        hunks.push(currentHunk);
      }
      for (const line of lines) {
        currentHunk.lines.push({ type: 'added', content: line });
      }
    } else if (change.removed) {
      removed += lines.length;
      if (!currentHunk) {
        currentHunk = { header: `@@ change @@`, lines: [] };
        hunks.push(currentHunk);
      }
      for (const line of lines) {
        currentHunk.lines.push({ type: 'removed', content: line });
      }
    } else {
      unchanged += lines.length;
      if (currentHunk) {
        // Add up to 3 context lines then close the hunk
        const contextLines = lines.slice(0, Math.min(3, lines.length));
        for (const line of contextLines) {
          currentHunk.lines.push({ type: 'context', content: line });
        }
        currentHunk = null;
      }
    }
  }

  return {
    added,
    removed,
    unchanged,
    hunks,
    hasMeaningfulChanges: added > 0 || removed > 0,
  };
}

export function formatDiffToString(diff: DiffResult): string {
  if (!diff.hasMeaningfulChanges) return '(no changes)';

  const lines: string[] = [];
  lines.push(`${chalk.green(`+${diff.added}`)} additions, ${chalk.red(`-${diff.removed}`)} removals`);

  for (const hunk of diff.hunks) {
    lines.push('');
    lines.push(chalk.cyan(hunk.header));
    for (const line of hunk.lines) {
      if (line.type === 'added') {
        lines.push(chalk.green(`+ ${line.content}`));
      } else if (line.type === 'removed') {
        lines.push(chalk.red(`- ${line.content}`));
      } else {
        lines.push(chalk.gray(`  ${line.content}`));
      }
    }
  }

  return lines.join('\n');
}

export function summarizeDiff(oldContent: string, newContent: string): string {
  const diff = computeDiff(oldContent, newContent);
  if (!diff.hasMeaningfulChanges) return 'No changes detected.';
  return `${diff.added} line(s) added, ${diff.removed} line(s) removed across ${diff.hunks.length} location(s).`;
}

export function detectSignificantChange(oldContent: string, newContent: string): boolean {
  const diff = computeDiff(oldContent, newContent);
  const totalLines = diff.added + diff.removed + diff.unchanged;
  if (totalLines === 0) return false;
  const changeRatio = (diff.added + diff.removed) / totalLines;
  // More than 30% of content changed = significant
  return changeRatio > 0.3 || diff.added > 20 || diff.removed > 20;
}
