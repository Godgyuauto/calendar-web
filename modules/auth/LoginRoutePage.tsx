import { redirect } from "next/navigation";
import LoginPage from "@/modules/auth/LoginPage";
import { hasServerSession } from "@/modules/auth/server-session";

export default async function LoginRoutePage() {
  if (await hasServerSession()) {
    redirect("/");
  }

  return <LoginPage />;
}
