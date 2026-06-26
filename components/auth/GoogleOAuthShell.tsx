import type { ReactNode } from "react";
import { GoogleBrandIcon } from "@/components/auth/OAuthProviderIcons";
import { Avatar } from "@/components/catalyst/avatar";
import { Divider } from "@/components/catalyst/divider";
import { Heading } from "@/components/catalyst/heading";
import { Link } from "@/components/catalyst/link";
import { Text } from "@/components/catalyst/text";

export const XIAOLONGBAO_LOGO = "/xiaolongbao-logo.png";

const googleLinkClassName =
  "font-medium text-[#1a73e8] decoration-[#1a73e8]/50 hover:decoration-[#1a73e8] dark:text-blue-400 dark:decoration-blue-400/50 dark:hover:decoration-blue-400";

export function GoogleOAuthShell({
  left,
  right,
}: {
  left: ReactNode;
  right: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#eef2f6] px-4 py-8 font-[Roboto,'Helvetica_Neue',Arial,sans-serif] sm:py-12">
      <div className="mx-auto w-full max-w-[960px] rounded-lg border border-[#dadce0] bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3 px-6 py-4">
          <GoogleBrandIcon className="size-5 shrink-0" />
          <Text className="text-sm font-medium text-[#1f1f1f] dark:text-zinc-100">
            Sign in with Google
          </Text>
        </div>

        <Divider className="border-[#e8eaed] dark:border-zinc-700" />

        <div className="grid min-h-[320px] grid-cols-1 gap-8 px-6 py-8 md:grid-cols-2 md:gap-12 md:px-14 md:py-12">
          <div className="flex flex-col justify-center">{left}</div>
          <div className="flex flex-col justify-center">{right}</div>
        </div>
      </div>
    </div>
  );
}

export function GoogleOAuthLeftPanel({ title }: { title: string }) {
  return (
    <>
      <Avatar src={XIAOLONGBAO_LOGO} square alt="xiaolongbao" className="size-7 outline-none" />
      <Heading
        level={1}
        className="mt-6 text-[2rem] leading-tight font-normal tracking-tight text-[#202124] dark:text-white"
      >
        {title}
      </Heading>
      <Text className="mt-6 text-base text-[#202124] dark:text-zinc-200">
        to continue to{" "}
        <Link href="/" className={googleLinkClassName}>
          xiaolongbao
        </Link>
      </Text>
    </>
  );
}

export function GoogleOAuthLegalNotice() {
  return (
    <Text className="mt-8 text-xs leading-5 text-[#5f6368] dark:text-zinc-400">
      Before using this app, you can review xiaolongbao&apos;s{" "}
      <Link href="/" className={googleLinkClassName}>
        privacy policy
      </Link>{" "}
      and{" "}
      <Link href="/" className={googleLinkClassName}>
        terms of service
      </Link>
      .
    </Text>
  );
}

export function buildGoogleOAuthHref(
  path: "/sign-in/oauth/google" | "/sign-in/oauth/google/email",
  nextPath: string,
  returnTo: "/sign-in" | "/signup",
) {
  const params = new URLSearchParams({ next: nextPath });
  if (returnTo === "/signup") {
    params.set("from", "signup");
  }
  return `${path}?${params.toString()}`;
}

export function buildGoogleOAuthReturnHref(
  nextPath: string,
  returnTo: "/sign-in" | "/signup",
) {
  if (returnTo === "/signup") {
    return "/signup";
  }

  return nextPath === "/decks" ? "/sign-in" : `/sign-in?next=${encodeURIComponent(nextPath)}`;
}
