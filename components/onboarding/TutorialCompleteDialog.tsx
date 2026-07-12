"use client";

import {
  Dialog,
  DialogActions,
  DialogDescription,
  DialogTitle,
} from "@/components/catalyst/dialog";
import { Button } from "@/components/catalyst/button";

type TutorialCompleteDialogProps = {
  open: boolean;
  onFinish: () => void;
  onReplay: () => void;
};

export function TutorialCompleteDialog({
  open,
  onFinish,
  onReplay,
}: TutorialCompleteDialogProps) {
  return (
    <Dialog open={open} onClose={onFinish} size="md">
      <DialogTitle>You&apos;re all set!</DialogTitle>
      <DialogDescription>
        You now know the basics of Xiaolongbao.
        <br />
        Enjoy studying!
      </DialogDescription>
      <DialogActions>
        <Button outline onClick={onReplay}>
          Replay Tutorial
        </Button>
        <Button color="indigo" onClick={onFinish}>
          Finish
        </Button>
      </DialogActions>
    </Dialog>
  );
}
