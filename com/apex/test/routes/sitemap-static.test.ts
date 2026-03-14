import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('com/apex public sitemap.xml', () => {
  it('contains only the about URL', () => {
    const body = readFileSync(resolve(process.cwd(), 'com/apex/public/sitemap.xml'), 'utf8');

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<loc>https://umaxica.com/about</loc>');
    expect(body).not.toContain('<loc>https://umaxica.com/</loc>');
    expect(body).not.toContain('<loc>https://umaxica.com/health</loc>');
  });
});
