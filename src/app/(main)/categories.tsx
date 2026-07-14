// CCA: 4
import { useAuth } from '@/features/auth/auth-context';
import { CategoryScreen } from '@/features/categories/CategoryScreen';

export default function CategoriesRoute() {
  const auth = useAuth();
  if (auth.status !== 'signed-in') return null;
  return <CategoryScreen userId={auth.user.userId} />;
}
