import ClientPage from './ClientPage';

export function generateStaticParams() {
  return [
    { slug: [] },
    { slug: ['dashboard'] },
    { slug: ['calendar'] },
    { slug: ['schedule'] },
    { slug: ['reports'] },
    { slug: ['directory'] },
    { slug: ['employees'] },
    { slug: ['team'] },
    { slug: ['setup'] },
  ];
}

export default function Page({ params }: { params: { slug?: string[] } }) {
  let initialTab: 'dashboard' | 'calendar' | 'reports' | 'team' | 'setup' | 'agentProfile' = 'dashboard';
  let initialAgentUsername: string | undefined = undefined;

  if (params.slug && params.slug.length > 0) {
    const slug = params.slug[0];
    if (slug === 'dashboard') initialTab = 'dashboard';
    if (slug === 'calendar' || slug === 'schedule') initialTab = 'calendar';
    if (slug === 'reports') initialTab = 'reports';
    if (slug === 'team' || slug === 'employees' || slug === 'directory') {
      if (params.slug.length > 1) {
        initialTab = 'agentProfile';
        initialAgentUsername = params.slug[1];
      } else {
        initialTab = 'team';
      }
    }
    if (slug === 'setup') initialTab = 'setup';
  }
  return <ClientPage initialTab={initialTab} initialAgentUsername={initialAgentUsername} />;
}