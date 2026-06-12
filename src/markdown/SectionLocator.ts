export interface HeadingInfo {
  heading: string;
  level: number;
  /** Line index (0-based) of the heading itself. */
  start: number;
  /** Line index (exclusive) where this section's content ends. */
  end: number;
}

/**
 * Parse all `#`-`######` headings in `content`, with line-offset ranges. A
 * section's `end` is the start of the next heading at the same or shallower
 * level, or the end of the document.
 */
export function parseHeadings(content: string): HeadingInfo[] {
  const lines = content.split('\n');
  const raw: { heading: string; level: number; start: number }[] = [];

  lines.forEach((line, idx) => {
    const m = line.match(/^(#{1,6})\s+(.+?)\s*$/);
    if (m) {
      raw.push({ heading: m[2].trim(), level: m[1].length, start: idx });
    }
  });

  return raw.map((h, i) => {
    let end = lines.length;
    for (let j = i + 1; j < raw.length; j++) {
      if (raw[j].level <= h.level) {
        end = raw[j].start;
        break;
      }
    }
    return { ...h, end };
  });
}

/** Ordered list of top-level (`##`) heading texts. */
export function getTopLevelHeadings(content: string): string[] {
  return parseHeadings(content)
    .filter((h) => h.level === 2)
    .map((h) => h.heading);
}

/** Case-insensitive lookup of a heading at the given level. */
export function findSection(content: string, heading: string, level = 2): HeadingInfo | null {
  return (
    parseHeadings(content).find(
      (h) => h.level === level && h.heading.toLowerCase() === heading.toLowerCase()
    ) ?? null
  );
}
