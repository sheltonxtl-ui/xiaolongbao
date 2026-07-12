"use client";

import {
  Dialog,
  DialogActions,
  DialogBody,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst/dialog";
import { Button } from "@/components/catalyst/button";

type TutorialWelcomeDialogProps = {
  open: boolean;
  onStart: () => void;
  onSkip: () => void;
};

export function TutorialWelcomeDialog({ open, onStart, onSkip }: TutorialWelcomeDialogProps) {
  return (
    <Dialog open={open} onClose={onSkip} size="md">
      <DialogTitle>Welcome to Xiaolongbao</DialogTitle>
      <DialogDescription>
        Welcome! This short interactive guide will introduce the main features of Xiaolongbao and
        show you how to use the application.
      </DialogDescription>
      <DialogBody>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">It only takes a minute.</p>
      </DialogBody>
      <DialogActions>
        <Button outline onClick={onSkip}>
          Skip Tutorial
        </Button>
        <Button color="indigo" onClick={onStart}>
          Start Tutorial
        </Button>
      </DialogActions>
    </Dialog>
  );
}
