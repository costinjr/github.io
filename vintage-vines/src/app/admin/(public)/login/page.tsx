import type { Metadata } from "next";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Admin sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4 py-16">
      <p className="text-xs font-semibold uppercase tracking-[0.15em] text-brass">Admin</p>
      <h1 className="mt-2 text-3xl text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Enter your approved email and we&apos;ll send a sign-in link. No password needed.
      </p>
      <LoginForm />
    </div>
  );
}
