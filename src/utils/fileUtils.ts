import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, content, 'utf-8');
}

export async function readFile(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  return fs.pathExists(filePath);
}

export async function readJson<T>(filePath: string): Promise<T> {
  return fs.readJson(filePath);
}

export async function writeJson(filePath: string, data: unknown): Promise<void> {
  await fs.ensureDir(path.dirname(filePath));
  await fs.writeJson(filePath, data, { spaces: 2 });
}

export async function copyFile(src: string, dest: string): Promise<void> {
  await fs.ensureDir(path.dirname(dest));
  await fs.copy(src, dest);
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  const files = await glob('**/*.md', { cwd: dir, absolute: true });
  return files.sort();
}

export async function listFiles(dir: string, pattern: string): Promise<string[]> {
  if (!(await fs.pathExists(dir))) return [];
  const files = await glob(pattern, { cwd: dir, absolute: true });
  return files.sort();
}

export function resolveProjectPath(projectRoot: string, ...parts: string[]): string {
  return path.resolve(projectRoot, ...parts);
}

export function relativePath(from: string, to: string): string {
  return path.relative(from, to).replace(/\\/g, '/');
}

export async function readJsonSafe<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    if (await fs.pathExists(filePath)) {
      return await fs.readJson(filePath);
    }
  } catch {
    // fall through to default
  }
  return defaultValue;
}
