import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['dashboard'] },
    { slug: ['schedule'] },
    { slug: ['reports'] },
    { slug: ['directory'] },
    { slug: ['employees'] },
    { slug: ['settings'] }
  ];
}

export default function Page({ params }: { params: { slug?: string[] } }) {
  let initialTab: 'timeTracker' | 'employees' | 'reports' = 'timeTracker';
  if (params.slug && params.slug.length > 0) {
    const slug = params.slug[0];
    if (slug === 'reports') initialTab = 'reports';
    if (slug === 'employees' || slug === 'directory') initialTab = 'employees';
  }
  return <ClientPage initialTab={initialTab} />;
}