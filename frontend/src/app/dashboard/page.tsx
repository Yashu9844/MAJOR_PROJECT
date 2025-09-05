// src/app/dashboard/page.tsx
'use client';
import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const { getToken, isSignedIn } = useAuth();
  const [me, setMe] = useState<any>(null);

  useEffect(() => {
    if (!isSignedIn) return;
    (async () => {
      const token = await getToken({ template: 'integration_fallback' }); 
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setMe(data);
    })();
  }, [isSignedIn, getToken]);

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <pre className="mt-4 bg-gray-100 p-3 rounded">{JSON.stringify(me, null, 2)}</pre>
    </div>
  );
}
