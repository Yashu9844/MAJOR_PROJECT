"use client"; // if you're using Next.js App Router

import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export default function DebugTokenPage() {
  const { getToken, userId } = useAuth();

  useEffect(() => {
    const fetchToken = async () => {
      const token = await getToken({ template: "ddd" });
      console.log("🔑 Clerk JWT Token:", token);
    };

    fetchToken();
  }, [getToken]);

  return (
    <div className="p-4">
      <h1 className="text-lg font-bold">Debug Clerk Token</h1>
      <p>Check your browser console for the JWT token 👇</p>
      <p>User ID: {userId}</p>
    </div>
  );
}