import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['dashboard'] },
    { slug: ['schedule'] },
    { slug: ['reports'] },
    { slug: ['directory'] },
    { slug: ['employees'] },
    { slug: ['settings'] },
    { slug: ['team'] },
    { slug: ['setup'] },
  ];
}

export default function Page({ params }: { params: { slug?: string[] } }) {
  let initialTab: 'timeTracker' | 'employees' | 'reports' | 'setup' = 'timeTracker';
  if (params.slug && params.slug.length > 0) {
    const slug = params.slug[0];
    if (slug === 'reports') initialTab = 'reports';
    if (slug === 'employees' || slug === 'directory' || slug === 'team') initialTab = 'employees';
    if (slug === 'setup') initialTab = 'setup';
  }
  return <ClientPage initialTab={initialTab} />;
}