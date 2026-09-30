import "server-only";
import { redirect } from "next/navigation";
import { currentUser } from "./auth";
export async function requirePageUser() {
  const user = await currentUser();
  if (!user) redirect("/login");
  return user;
}
