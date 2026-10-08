import { useChats } from '@/store/chats';
import { useSession } from '@/store/session';

/** Everything that has to happen on sign out, in one place. */
export function signOut() {
  useChats.getState().reset();
  useSession.getState().signOut();
}
