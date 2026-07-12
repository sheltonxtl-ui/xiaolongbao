"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar } from "@/components/catalyst/avatar";
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from "@/components/catalyst/dropdown";
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from "@/components/catalyst/navbar";
import { SidebarLayout } from "@/components/catalyst/sidebar-layout";
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from "@/components/catalyst/sidebar";
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  PlusIcon,
  UserIcon,
} from "@heroicons/react/16/solid";
import {
  ArrowTopRightOnSquareIcon,
  Cog6ToothIcon,
  CreditCardIcon,
  HomeIcon,
  InboxIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Square2StackIcon,
} from "@heroicons/react/20/solid";
import { signOut } from "@/lib/auth/client";
import { getUserDisplayName, getUserEmail, getUserInitials } from "@/lib/auth/display";
import { useAuthUser } from "@/lib/hooks/useAuthUser";
import { OnboardingProvider } from "@/components/onboarding/OnboardingProvider";

function iconProps() {
  return { "data-slot": "icon" as const };
}

function AppDashboardShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isSignedIn } = useAuthUser();
  const [signingOut, setSigningOut] = useState(false);

  const onDecks = pathname === "/decks" || pathname.startsWith("/decks/");
  const onExplore = pathname === "/explore" || pathname.startsWith("/explore/");
  const onGenerate = pathname === "/generate" || pathname.startsWith("/generate/");
  const onBilling = pathname === "/billing" || pathname.startsWith("/billing/");
  const onSettings = pathname === "/settings" || pathname.startsWith("/settings/");
  const onHelp = pathname === "/help" || pathname.startsWith("/help/");
  const onHome = pathname === "/";

  const displayName = user ? getUserDisplayName(user) : "Guest";
  const displayEmail = user ? getUserEmail(user) : "";
  const initials = user ? getUserInitials(user) : "G";

  async function handleSignOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);
    try {
      await signOut();
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  const accountMenu = isSignedIn ? (
    <>
      <DropdownItem href="/settings">
        <UserIcon {...iconProps()} />
        <DropdownLabel>My profile</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="/settings">
        <Cog8ToothIcon {...iconProps()} />
        <DropdownLabel>Settings</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="/help">
        <QuestionMarkCircleIcon {...iconProps()} />
        <DropdownLabel>Help Center</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem href="/">
        <ArrowTopRightOnSquareIcon {...iconProps()} />
        <DropdownLabel>Back to site</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={handleSignOut} disabled={signingOut}>
        <ArrowRightStartOnRectangleIcon {...iconProps()} />
        <DropdownLabel>{signingOut ? "Logging out…" : "Log out"}</DropdownLabel>
      </DropdownItem>
    </>
  ) : (
    <>
      <DropdownItem href="/sign-in">
        <ArrowRightStartOnRectangleIcon {...iconProps()} />
        <DropdownLabel>Sign in</DropdownLabel>
      </DropdownItem>
      <DropdownItem href="/signup">
        <UserIcon {...iconProps()} />
        <DropdownLabel>Create account</DropdownLabel>
      </DropdownItem>
    </>
  );

  const sidebar = (
    <div className="flex h-full flex-col bg-white ring-1 ring-zinc-950/5 dark:bg-zinc-900 dark:ring-white/10">
      <Sidebar>
        <SidebarHeader>
          <Dropdown>
            <DropdownButton as={SidebarItem} className="lg:mb-2.5">
              <Avatar initials="XL" alt="xiaolongbao" className="size-8 bg-indigo-600 text-white" />
              <SidebarLabel>xiaolongbao</SidebarLabel>
              <ChevronDownIcon {...iconProps()} />
            </DropdownButton>
            <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
              <DropdownItem href="/settings">
                <Cog8ToothIcon {...iconProps()} />
                <DropdownLabel>Workspace settings</DropdownLabel>
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem href="/decks">
                <Avatar initials="XL" alt="" className="size-6 bg-indigo-600 text-white" />
                <DropdownLabel>My decks</DropdownLabel>
              </DropdownItem>
              <DropdownItem href="/generate">
                <Avatar initials="NB" alt="" className="size-6 bg-violet-500 text-white" />
                <DropdownLabel>New cards</DropdownLabel>
              </DropdownItem>
              <DropdownDivider />
              <DropdownItem href="/generate">
                <PlusIcon {...iconProps()} />
                <DropdownLabel>New deck…</DropdownLabel>
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
          <SidebarSection className="max-lg:hidden">
            <SidebarItem href="/decks" data-tour="nav-search">
              <MagnifyingGlassIcon {...iconProps()} />
              <SidebarLabel>Search decks</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/generate" data-tour="nav-generate-shortcut">
              <InboxIcon {...iconProps()} />
              <SidebarLabel>Generate</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
        </SidebarHeader>
        <SidebarBody data-tour="nav-sidebar">
          <SidebarSection>
            <SidebarItem href="/" current={onHome} data-tour="nav-home">
              <HomeIcon {...iconProps()} />
              <SidebarLabel>Home</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/decks" current={onDecks} data-tour="nav-decks">
              <Square2StackIcon {...iconProps()} />
              <SidebarLabel>Decks</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/explore" current={onExplore} data-tour="nav-explore" title="Browse community decks">
              <MagnifyingGlassIcon {...iconProps()} />
              <SidebarLabel>Explore</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/generate" current={onGenerate} data-tour="nav-generate" title="Generate flashcards from notes with AI">
              <SparklesIcon {...iconProps()} />
              <SidebarLabel>Generate</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/pricing" data-tour="nav-pricing">
              <MegaphoneIcon {...iconProps()} />
              <SidebarLabel>Pricing</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/billing" current={onBilling} data-tour="nav-billing">
              <CreditCardIcon {...iconProps()} />
              <SidebarLabel>Billing</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/settings" current={onSettings} data-tour="nav-settings" title="Open settings">
              <Cog6ToothIcon {...iconProps()} />
              <SidebarLabel>Settings</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
          <SidebarSection className="max-lg:hidden">
            <SidebarHeading>Shortcuts</SidebarHeading>
            <SidebarItem href="/decks">Open deck library</SidebarItem>
            <SidebarItem href="/explore">Browse community decks</SidebarItem>
            <SidebarItem href="/generate">Create flashcards</SidebarItem>
            <SidebarItem href="/pricing">Compare plans</SidebarItem>
          </SidebarSection>
          <SidebarSpacer />
          <SidebarSection>
            <SidebarItem href="/help" current={onHelp} data-tour="nav-help">
              <QuestionMarkCircleIcon {...iconProps()} />
              <SidebarLabel>Help</SidebarLabel>
            </SidebarItem>
            <SidebarItem href="/">
              <ArrowTopRightOnSquareIcon {...iconProps()} />
              <SidebarLabel>Landing</SidebarLabel>
            </SidebarItem>
          </SidebarSection>
        </SidebarBody>
        <SidebarFooter className="max-lg:hidden">
          {isSignedIn ? (
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar
                    initials={initials}
                    square
                    alt={displayName}
                    className="size-10 bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-white"
                  />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950 dark:text-white">
                      {displayName}
                    </span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500 dark:text-zinc-400">
                      {displayEmail}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon {...iconProps()} />
              </DropdownButton>
              <DropdownMenu className="min-w-64" anchor="top start">
                {accountMenu}
              </DropdownMenu>
            </Dropdown>
          ) : (
            <SidebarItem href="/sign-in">
              <ArrowRightStartOnRectangleIcon {...iconProps()} />
              <SidebarLabel>Sign in</SidebarLabel>
            </SidebarItem>
          )}
        </SidebarFooter>
      </Sidebar>
    </div>
  );

  const navbar = (
    <Navbar>
      <NavbarSpacer />
      <NavbarSection>
        <NavbarItem href="/explore" aria-label="Explore community decks" data-tour="nav-explore-mobile">
          <MagnifyingGlassIcon {...iconProps()} />
        </NavbarItem>
        <NavbarItem href="/generate" aria-label="Generate flashcards" data-tour="nav-generate-mobile">
          <InboxIcon {...iconProps()} />
        </NavbarItem>
        <Dropdown>
          <DropdownButton as={NavbarItem} aria-label={isSignedIn ? "Account menu" : "Sign in"}>
            <Avatar
              initials={initials}
              square
              alt={displayName}
              className="size-8 bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-white"
            />
          </DropdownButton>
          <DropdownMenu className="min-w-64" anchor="bottom end">
            {accountMenu}
          </DropdownMenu>
        </Dropdown>
      </NavbarSection>
    </Navbar>
  );

  return <SidebarLayout navbar={navbar} sidebar={sidebar}>{children}</SidebarLayout>;
}

export function AppDashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <AppDashboardShellInner>{children}</AppDashboardShellInner>
    </OnboardingProvider>
  );
}
