'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function EmployeesPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/team');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0d1f23] text-white flex items-center justify-center p-4">
      <div className="text-center font-sans">
        <div className="animate-spin text-3xl mb-2">🔄</div>
        <p className="text-sm font-bold text-slate-300">Redirecting to /team...</p>
      </div>
    </div>
  );
}
