import { readFileSync } from 'node:fs';

describe('com/apex public sitemap.xml', () => {
  it('contains only the about URL', () => {
    const body = readFileSync('/home/edge/workspace/com/apex/public/sitemap.xml', 'utf8');

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<loc>https://umaxica.com/about</loc>');
    expect(body).not.toContain('<loc>https://umaxica.com/</loc>');
    expect(body).not.toContain('<loc>https://umaxica.com/health</loc>');
  });
});
