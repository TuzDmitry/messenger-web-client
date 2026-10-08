import { useChats } from '@/store/chats';
import { useSession } from '@/store/session';

/**
 * Everything that has to happen on sign out, in one place.
 * The poller stops by itself: it lives as long as the signed-in layout.
 */
export function signOut(notice?: string) {
  useChats.getState().reset();
  useSession.getState().signOut(notice);
}
