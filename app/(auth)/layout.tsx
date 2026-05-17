import { AuthLayout } from "@/components/catalyst/auth-layout";
import { TextLink } from "@/components/catalyst/text";

export default function AuthRouteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <div className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-4 py-8 sm:px-6">
        <TextLink href="/" className="mb-6 w-fit text-sm/6 font-semibold no-underline">
          xiaolongbao
        </TextLink>
        <AuthLayout>{children}</AuthLayout>
      </div>
    </div>
  );
}
