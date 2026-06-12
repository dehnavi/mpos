export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function toId(prefix: string, counter: number): string {
  return `${prefix}-${String(counter).padStart(3, '0')}`;
}

export function titleToFilename(title: string, prefix?: string): string {
  const slug = slugify(title);
  return prefix ? `${prefix}-${slug}` : slug;
}

export function incrementVersion(version: string, type: 'major' | 'minor' | 'patch' = 'patch'): string {
  const parts = version.replace(/^v/, '').split('.').map(Number);
  while (parts.length < 3) parts.push(0);
  const [major, minor, patch] = parts;
  switch (type) {
    case 'major': return `${major + 1}.0.0`;
    case 'minor': return `${major}.${minor + 1}.0`;
    case 'patch': return `${major}.${minor}.${patch + 1}`;
  }
}
