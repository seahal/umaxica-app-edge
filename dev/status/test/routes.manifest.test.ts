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

const findByFile = (file: string) => manifest.find((entry) => entry.file === file);

describe('dev route manifest', () => {
  it('wraps the home route with the decorated layout', () => {
    const decorated = routes[0];
    expect(decorated).toMatchObject({ file: '../src/layouts/decorated.tsx' });
    expect(decorated?.children ?? []).toStrictEqual([
      expect.objectContaining({ file: 'routes/home.tsx', index: true }),
    ]);
  });

  it('exposes the home index route', () => {
    expect(findByFile('routes/home.tsx')).toMatchObject({
      file: 'routes/home.tsx',
      index: true,
    });
  });
});
