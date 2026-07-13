// CCA: 4
import { RequireGuest } from '@/features/auth/AuthGate';
import { SignInScreen } from '@/features/auth/SignInScreen';

export default function SignInRoute() {
  return (
    <RequireGuest>
      <SignInScreen />
    </RequireGuest>
  );
}
