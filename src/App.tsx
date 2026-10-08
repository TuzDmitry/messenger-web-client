import { LoginScreen } from '@/features/auth/LoginScreen';
import { AppLayout } from '@/layout/AppLayout';
import { useSession } from '@/store/session';

export function App() {
  const signedIn = useSession((state) => state.credentials !== null);
  return signedIn ? <AppLayout /> : <LoginScreen />;
}
