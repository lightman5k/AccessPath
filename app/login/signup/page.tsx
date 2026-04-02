import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { authService } from "@/lib/auth/service";
import { AuthShell } from "../_components/auth-shell";
import { SignupForm } from "../_components/signup-form";

export default async function SignupPage() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(authConfig.cookieName)?.value ?? null;
  const session = await authService.getSessionFromToken(rawToken);

  if (session.authenticated) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      formDescription="Create your workspace to start a 14-day AccessPath trial for your team."
      formEyebrow="Sign Up"
      formTitle="Launch your AI operations workspace."
      legalCopy={
        <>
          By creating an account, you agree to our Privacy Policy and Terms of Cloud Service.
          Trial workspaces start on the free plan and can be upgraded later.
        </>
      }
    >
      <SignupForm />
    </AuthShell>
  );
}
