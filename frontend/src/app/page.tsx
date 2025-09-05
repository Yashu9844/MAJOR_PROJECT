import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="p-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">AI Cybersecurity</h1>
        <SignedOut>
          <div className="space-x-3">
            <Link href="/sign-in">Sign In</Link>
            <Link href="/sign-up">Sign Up</Link>
          </div>
        </SignedOut>
        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      <main className="mt-10">
        <p>Welcome! Go to your dashboard…</p>
      </main>
    </div>
  );
}
