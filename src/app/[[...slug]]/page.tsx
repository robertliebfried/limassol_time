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
  let initialTab: 'timeTracker' | 'employees' | 'reports' | 'setup' | 'agentProfile' = 'timeTracker';
  let initialAgentUsername: string | undefined = undefined;

  if (params.slug && params.slug.length > 0) {
    const slug = params.slug[0];
    if (slug === 'reports') initialTab = 'reports';
    if (slug === 'employees' || slug === 'directory') initialTab = 'employees';
    if (slug === 'setup') initialTab = 'setup';
    if (slug === 'team') {
      if (params.slug.length > 1) {
        initialTab = 'agentProfile';
        initialAgentUsername = params.slug[1];
      } else {
        initialTab = 'employees';
      }
    }
  }
  return <ClientPage initialTab={initialTab as "timeTracker" | "employees" | "reports" | "setup" | "agentProfile"} initialAgentUsername={initialAgentUsername} />;
}