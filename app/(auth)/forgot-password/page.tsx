import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot password",
  description: "Reset your xiaolongbao password.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
