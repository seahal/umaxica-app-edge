import { readFileSync } from 'node:fs';

describe('org/apex public sitemap.xml', () => {
  it('contains only the about URL', () => {
    const body = readFileSync('/home/edge/workspace/org/apex/public/sitemap.xml', 'utf8');

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<loc>https://umaxica.org/about</loc>');
    expect(body).not.toContain('<loc>https://umaxica.org/</loc>');
    expect(body).not.toContain('<loc>https://umaxica.org/health</loc>');
  });
});
