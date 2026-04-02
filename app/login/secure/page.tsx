import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { authConfig } from "@/lib/auth/config";
import { authService } from "@/lib/auth/service";
import { AuthShell } from "../_components/auth-shell";
import { SigninForm } from "../_components/signin-form";

export default async function SecureSigninPage() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(authConfig.cookieName)?.value ?? null;
  const session = await authService.getSessionFromToken(rawToken);

  if (session.authenticated) {
    redirect("/dashboard");
  }

  return (
    <AuthShell
      formDescription="Enter your credentials to access your operation centers."
      formEyebrow="Secure Sign In"
      formTitle="Welcome back."
      legalCopy={
        <>
          By signing in, you agree to our Privacy Policy and Terms of Cloud Service for the
          AccessPath demo environment.
        </>
      }
    >
      <SigninForm />
    </AuthShell>
  );
}
