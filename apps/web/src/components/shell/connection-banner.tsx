import { AnimatePresence, motion } from 'motion/react';
import { WifiOffIcon } from 'lucide-react';
import { useConnectionState } from '@/lib/connection';

/** Shown while the Realtime socket is closed and until the board has caught up. */
export function ConnectionBanner() {
  const state = useConnectionState();
  return (
    <AnimatePresence initial={false}>
      {state !== 'live' && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 32, opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="shrink-0 overflow-hidden"
        >
          <div
            role="status"
            className="flex h-8 items-center justify-center gap-2 border-b border-warning/20 bg-warning/10 text-12 font-medium text-warning"
          >
            <WifiOffIcon className="size-3.5" />
            {state === 'offline' ? 'Live updates paused. Reconnecting…' : 'Catching up…'}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
