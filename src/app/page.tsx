import RandomImage from "@/components/RandomImage";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 p-4">
      <RandomImage />
      <LoginClient />
    </div>
  );
}
