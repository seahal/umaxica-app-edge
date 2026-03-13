import { readFileSync } from 'node:fs';

describe('net/apex public sitemap.xml', () => {
  it('contains the public URLs', () => {
    const body = readFileSync('/home/edge/workspace/net/apex/public/sitemap.xml', 'utf8');

    expect(body).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(body).toContain('<loc>https://umaxica.net/</loc>');
    expect(body).toContain('<loc>https://umaxica.net/about</loc>');
    expect(body).not.toContain('<loc>https://umaxica.net/health</loc>');
  });
});
