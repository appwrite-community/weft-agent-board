import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Card } from '@/lib/types';
import { useBoard } from './board-context';

type DeleteCardDialogProps = {
  card: Card;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDeleted?: () => void;
};

export function DeleteCardDialog({ card, open, onOpenChange, onDeleted }: DeleteCardDialogProps) {
  const { actions } = useBoard();
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle className="text-16 font-semibold">Delete this card?</AlertDialogTitle>
        <AlertDialogDescription className="mt-2 text-13 text-muted">
          “{card.title}” will be deleted for everyone on the board. You can't undo this.
        </AlertDialogDescription>
        <div className="mt-5 flex justify-end gap-2">
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              actions.deleteCard(card.$id);
              onDeleted?.();
            }}
          >
            Delete card
          </AlertDialogAction>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
