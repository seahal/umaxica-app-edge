import { Outlet, useRouteLoaderData } from 'react-router';

import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import type { loader as rootLoader } from '../root';

type RootLoaderData = Awaited<ReturnType<typeof rootLoader>>;

const DEFAULT_LOADER_DATA: RootLoaderData = {
  codeName: '',
  cspNonce: '',
  helpUrl: '',
  docsUrl: '',
  newsUrl: '',
};

export default function DecoratedLayout() {
  const loaderData = useRouteLoaderData('root') as RootLoaderData | undefined;

  const { codeName, helpUrl, docsUrl, newsUrl } = loaderData ?? DEFAULT_LOADER_DATA;

  return (
    <div className="flex min-h-screen flex-col">
      <Header
        codeName={codeName}
        helpServiceUrl={helpUrl}
        docsServiceUrl={docsUrl}
        newsServiceUrl={newsUrl}
      />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer codeName={codeName} />
    </div>
  );
}
