import routes from '../src/routes';

interface RouteManifestEntry {
  children?: RouteManifestEntry[];
  file?: string;
  index?: boolean;
  path?: string;
}

const flattenRoutes = (entries: RouteManifestEntry[]): RouteManifestEntry[] => {
  const result: RouteManifestEntry[] = [];
  for (const entry of entries) {
    result.push(entry);
    if (entry.children?.length) {
      result.push(...flattenRoutes(entry.children));
    }
  }
  return result;
};

const manifest = flattenRoutes(routes as RouteManifestEntry[]);

const findByPath = (path: string) => manifest.find((entry) => entry.path === path);
const findByFile = (file: string) => manifest.find((entry) => entry.file === file);

describe('org route manifest', () => {
  it('wraps primary routes with the decorated layout', () => {
    const decorated = routes[0];
    expect(decorated).toMatchObject({ file: '../src/layouts/decorated.tsx' });
    expect(decorated?.children ?? []).toStrictEqual([
      expect.objectContaining({ file: 'routes/_index.tsx', index: true }),
      expect.objectContaining({
        file: 'routes/configure.tsx',
        path: 'configure',
      }),
      expect.objectContaining({ file: 'routes/catch-all.tsx', path: '*' }),
    ]);
  });

  it('includes the index route', () => {
    expect(findByFile('routes/_index.tsx')).toMatchObject({
      file: 'routes/_index.tsx',
      index: true,
    });
  });

  it('registers configure and catch-all routes', () => {
    expect(findByPath('configure')).toMatchObject({
      file: 'routes/configure.tsx',
      path: 'configure',
    });
    expect(findByPath('*')).toMatchObject({
      file: 'routes/catch-all.tsx',
      path: '*',
    });
  });

  it('registers the baremetal layout for health checks', () => {
    expect(findByFile('../src/layouts/baremetal.tsx')).toBeDefined();
  });

  it('exposes the /health route', () => {
    expect(findByPath('/health')).toMatchObject({
      file: 'routes/healths/_index.tsx',
      path: '/health',
    });
  });
});
