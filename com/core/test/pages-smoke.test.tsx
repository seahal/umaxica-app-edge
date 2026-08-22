import { redirect } from 'next/navigation';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import AboutPage from '../src/app/(page)/about/page';
import AccountPage from '../src/app/(page)/configuration/account/page';
import ConfigurationPage from '../src/app/(page)/configuration/page';
import DoctorPage from '../src/app/(page)/doctor/page';
import ExplorePage from '../src/app/(page)/explore/page';
import HomePage from '../src/app/(page)/home/page';
import PageLayout from '../src/app/(page)/layout';
import MessagesPage from '../src/app/(page)/messages/page';
import NotificationsPage from '../src/app/(page)/notifications/page';
import RootPage from '../src/app/(page)/page';

vi.mock('next/navigation', () => ({
  redirect: vi.fn<() => never>(),
}));

vi.mock('@/i18n/config', () => ({
  defaultLocale: 'en',
}));

vi.mock('@/i18n/dictionaries', () => ({
  getDictionary: vi.fn<() => Promise<Record<string, unknown>>>().mockResolvedValue({
    home: {
      title: 'Home',
      description: 'Welcome to our website',
    },
    about: { title: 'About' },
    explore: { title: 'Explore' },
    doctor: { title: 'Doctor' },
    notifications: { title: 'Notifications', wip: 'WIP' },
    messages: { title: 'Messages', wip: 'WIP' },
    configuration: { title: 'Configuration' },
    configuration_account: { title: 'Account' },
    nav: { menu: 'Menu', primary: 'Main navigation', utility: 'Utility navigation' },
  }),
}));

describe('com/core pages render without throwing', () => {
  it('root page renders', async () => {
    const element = await RootPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('about page renders', async () => {
    const element = await AboutPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('explore page renders', async () => {
    const element = await ExplorePage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('doctor page renders', async () => {
    const element = await DoctorPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('notifications page renders', async () => {
    const element = await NotificationsPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('messages page renders', async () => {
    const element = await MessagesPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('configuration page renders', async () => {
    const element = await ConfigurationPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('account page renders', async () => {
    const element = await AccountPage();
    const html = renderToStaticMarkup(element);
    expect(html).not.toBe('');
  });

  it('home page redirects to root', () => {
    HomePage();
    expect(redirect).toHaveBeenCalledWith('/');
  });

  it('renders the localized navigation around page content', async () => {
    const element = await PageLayout({ children: <p>workspace content</p> });
    const html = renderToStaticMarkup(element);
    // The navigation is asserted in full by test/ui-shell-contract.test.tsx.
    expect(html).toContain('id="main-navigation"');
    expect(html).toContain('workspace content');
  });
});
