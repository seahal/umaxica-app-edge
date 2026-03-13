import { readFileSync } from 'node:fs';

describe('app/apex public sitemap.xml', () => {
  it('contains only the about URL', () => {
    const body = readFileSync('/home/edge/workspace/app/apex/public/sitemap.xml', 'utf8');

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<loc>https://umaxica.app/about</loc>');
    expect(body).not.toContain('<loc>https://umaxica.app/</loc>');
    expect(body).not.toContain('<loc>https://umaxica.app/health</loc>');
  });
});
