import { redirect } from "next/navigation";
import { getCurrentUser } from "../actions";
import ChangePinClient from "./ChangePinClient";

export default async function ChangePinPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  if (user.pin_changed) {
    redirect(user.role === "admin" ? "/admin" : "/dashboard");
  }

  return <ChangePinClient user={user} />;
}
