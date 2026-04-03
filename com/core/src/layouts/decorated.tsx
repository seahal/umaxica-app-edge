import { Outlet, useRouteLoaderData } from 'react-router';

import { Footer } from '../components/Footer';
import { Header } from '../components/Header';
import type { loader as rootLoader } from '../root';

type RootLoaderData = Awaited<ReturnType<typeof rootLoader>>;

const DEFAULT_LOADER_DATA: RootLoaderData = {
  codeName: '',
  cspNonce: '',
  newsServiceUrl: '',
  docsServiceUrl: '',
  helpServiceUrl: '',
};

export default function DecoratedLayout() {
  const loaderData = useRouteLoaderData('root') as RootLoaderData | undefined;

  const { codeName, newsServiceUrl, docsServiceUrl, helpServiceUrl } =
    loaderData ?? DEFAULT_LOADER_DATA;

  return (
    <>
      <Header
        codeName={codeName}
        newsServiceUrl={newsServiceUrl}
        docsServiceUrl={docsServiceUrl}
        helpServiceUrl={helpServiceUrl}
      />
      <Outlet />
      <Footer codeName={codeName} />
    </>
  );
}
