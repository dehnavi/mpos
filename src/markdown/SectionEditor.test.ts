import { describe, it, expect } from 'vitest';
import matter from 'gray-matter';
import { replaceSection, appendToSection, updateFrontmatterFields, SectionEditError } from './SectionEditor';
import { getTopLevelHeadings } from './SectionLocator';

const RAW = `---
id: STORY-001
title: Test Story
type: story
status: backlog
owner: ""
created_at: "2026-06-01"
updated_at: "2026-06-01"
tags: []
related: []
---

# Test Story

## Summary

Original summary.

## Description

Original description.
`;

describe('replaceSection', () => {
  it('replaces the content of an existing section without changing the heading set', () => {
    const updated = replaceSection(RAW, 'Summary', 'New summary text.');
    const { content } = matter(updated);

    expect(content).toContain('New summary text.');
    expect(content).not.toContain('Original summary.');
    expect(getTopLevelHeadings(content)).toEqual(['Summary', 'Description']);
  });

  it('throws SectionEditError when the section does not exist and force is not set', () => {
    expect(() => replaceSection(RAW, 'Nonexistent', 'text')).toThrow(SectionEditError);
  });

  it('throws SectionEditError when the replacement body introduces a new top-level heading', () => {
    expect(() => replaceSection(RAW, 'Summary', '## Sneaky Heading\n\nContent')).toThrow(SectionEditError);
  });

  it('allows adding a new section when force is set', () => {
    const updated = replaceSection(RAW, 'Nonexistent', 'New section body.', { force: true });
    const { content } = matter(updated);

    expect(getTopLevelHeadings(content)).toEqual(['Summary', 'Description', 'Nonexistent']);
    expect(content).toContain('New section body.');
  });

  it('allows a heading-set change when force is set', () => {
    const updated = replaceSection(RAW, 'Summary', '## Sneaky Heading\n\nContent', { force: true });
    const { content } = matter(updated);

    expect(getTopLevelHeadings(content)).toContain('Sneaky Heading');
  });
});

describe('appendToSection', () => {
  it('appends content to the end of an existing section without changing the heading set', () => {
    const updated = appendToSection(RAW, 'Summary', 'Extra detail.');
    const { content } = matter(updated);

    expect(content).toContain('Original summary.');
    expect(content).toContain('Extra detail.');
    expect(getTopLevelHeadings(content)).toEqual(['Summary', 'Description']);

    // The appended text comes after the original content within the section.
    const summaryIdx = content.indexOf('Original summary.');
    const extraIdx = content.indexOf('Extra detail.');
    expect(extraIdx).toBeGreaterThan(summaryIdx);
  });

  it('creates a new top-level section when the heading does not exist', () => {
    const updated = appendToSection(RAW, 'Notes', 'A new note.');
    const { content } = matter(updated);

    expect(getTopLevelHeadings(content)).toEqual(['Summary', 'Description', 'Notes']);
    expect(content).toContain('A new note.');
  });
});

describe('updateFrontmatterFields', () => {
  it('updates frontmatter fields and bumps updated_at', () => {
    const updated = updateFrontmatterFields(RAW, { status: 'in-progress' });
    const { data } = matter(updated);

    expect(data.status).toBe('in-progress');
    expect(data.id).toBe('STORY-001');
    expect(data.updated_at).toBeTruthy();
  });

  it('throws SectionEditError when changing id without force', () => {
    expect(() => updateFrontmatterFields(RAW, { id: 'STORY-002' })).toThrow(SectionEditError);
  });

  it('throws SectionEditError when changing type without force', () => {
    expect(() => updateFrontmatterFields(RAW, { type: 'epic' })).toThrow(SectionEditError);
  });

  it('allows changing id/type when force is set', () => {
    const updated = updateFrontmatterFields(RAW, { id: 'STORY-002', type: 'epic' }, { force: true });
    const { data } = matter(updated);

    expect(data.id).toBe('STORY-002');
    expect(data.type).toBe('epic');
  });

  it('returns the input unchanged (aside from updated_at) when given no updates', () => {
    const updated = updateFrontmatterFields(RAW, {});
    const { data, content } = matter(updated);
    const { data: originalData, content: originalContent } = matter(RAW);

    expect(data.id).toBe(originalData.id);
    expect(data.status).toBe(originalData.status);
    expect(content).toBe(originalContent);
  });
});
