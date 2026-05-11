import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/SignUpForm";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a xiaolongbao account to save decks and study anywhere.",
};

export default function SignupPage() {
  return <SignUpForm />;
}
