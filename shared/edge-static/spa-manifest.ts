export type ManifestRoute =
  | {
      type: 'literal';
      path: string;
    }
  | {
      type: 'regex';
      re: string;
    };

export type SpaManifest = {
  version: 1;
  routes: ManifestRoute[];
};

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
}

export function toManifestRoute(pathPattern: string): ManifestRoute | null {
  if (!pathPattern || pathPattern === '*') {
    return null;
  }

  if (!pathPattern.startsWith('/')) {
    pathPattern = `/${pathPattern}`;
  }

  if (!pathPattern.includes(':') && !pathPattern.includes('*')) {
    return { type: 'literal', path: pathPattern };
  }

  const segments = pathPattern.split('/').filter(Boolean);
  const regexSegments = segments.map((segment) => {
    if (segment === '*') {
      return '.*';
    }

    if (segment.startsWith(':')) {
      return '[^/]+';
    }

    return escapeRegex(segment);
  });

  const regex = `^/${regexSegments.join('/')}$`;
  return { type: 'regex', re: regex };
}

export function buildSpaManifest(pathPatterns: string[]): SpaManifest {
  const routes: ManifestRoute[] = [];

  for (const pattern of pathPatterns) {
    const route = toManifestRoute(pattern);
    if (route) {
      routes.push(route);
    }
  }

  return {
    version: 1,
    routes,
  };
}
