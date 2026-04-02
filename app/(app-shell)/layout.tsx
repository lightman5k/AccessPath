import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShellClient from "@/components/app-shell/app-shell-client";
import { authConfig } from "@/lib/auth/config";
import { authService } from "@/lib/auth/service";
import { AuthSessionProvider } from "@/lib/auth/use-auth-session";

export default async function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(authConfig.cookieName)?.value ?? null;
  const session = await authService.getSessionFromToken(rawToken);

  if (!session.authenticated) {
    redirect("/login/secure");
  }

  return (
    <AuthSessionProvider initialSession={session}>
      <AppShellClient>{children}</AppShellClient>
    </AuthSessionProvider>
  );
}
