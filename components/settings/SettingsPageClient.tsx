"use client";

import { useState } from "react";
import { Button } from "@/components/catalyst/button";
import { Divider } from "@/components/catalyst/divider";
import { Heading, Subheading } from "@/components/catalyst/heading";
import { Text, TextLink } from "@/components/catalyst/text";
import { FeatureTip } from "@/components/onboarding/FeatureTip";
import { useOnboarding } from "@/components/onboarding/onboarding-context";
import { getUserDisplayName, getUserEmail } from "@/lib/auth/display";
import { useAuthUser } from "@/lib/hooks/useAuthUser";

export function SettingsPageClient() {
  const { user } = useAuthUser();
  const { startTutorial, hasCompletedTutorial, isTourOpen } = useOnboarding();
  const [starting, setStarting] = useState(false);

  const displayName = user ? getUserDisplayName(user) : "Guest";
  const displayEmail = user ? getUserEmail(user) : "";

  async function handleReplay() {
    if (starting || isTourOpen) return;
    setStarting(true);
    try {
      startTutorial({ replay: true });
    } finally {
      setStarting(false);
    }
  }

  return (
    <section className="w-full" data-tour="settings-page">
      <header className="mb-8">
        <Heading>Settings</Heading>
        <Text className="mt-2 max-w-2xl">
          Manage your account preferences, reopen the product tour, and jump into help docs.
        </Text>
      </header>

      <div className="space-y-10">
        <section>
          <Subheading>Profile</Subheading>
          <Text className="mt-2">
            Signed in as <span className="font-medium text-zinc-950 dark:text-white">{displayName}</span>
            {displayEmail ? (
              <>
                {" "}
                (<span className="text-zinc-500 dark:text-zinc-400">({displayEmail})</span>
              </>
            ) : null}
            .
          </Text>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button outline href="/billing">
              Manage billing
            </Button>
            <Button outline href="/pricing">
              View plans
            </Button>
          </div>
        </section>

        <Divider />

        <section data-tour="settings-tutorial">
          <Subheading>Onboarding</Subheading>
          <Text className="mt-2 max-w-2xl">
            {hasCompletedTutorial
              ? "You’ve completed the interactive tutorial. Replay it anytime for a guided refresher."
              : "The interactive tutorial is still available. Start it now or wait for the automatic prompt."}
          </Text>
          <div className="mt-4">
            <FeatureTip tipId="settings">
              <Button
                color="indigo"
                onClick={() => void handleReplay()}
                disabled={starting || isTourOpen}
                data-tour="cta-replay-tutorial"
              >
                {isTourOpen ? "Tutorial in progress…" : "Replay Interactive Tutorial"}
              </Button>
            </FeatureTip>
          </div>
        </section>

        <Divider />

        <section>
          <Subheading>Help</Subheading>
          <Text className="mt-2 max-w-2xl">
            Browse guides for generating decks, studying, community sharing, and more in the Help
            Center.
          </Text>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button outline href="/help">
              Open Help Center
            </Button>
            <Text className="self-center text-sm">
              Or jump to <TextLink href="/help">Getting Started</TextLink>.
            </Text>
          </div>
        </section>
      </div>
    </section>
  );
}
