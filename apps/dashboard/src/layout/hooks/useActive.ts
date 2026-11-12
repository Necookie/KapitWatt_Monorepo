import { usePathname } from 'expo-router';
import { type Destination } from '../utils/navigation';

export function useActive(item: Destination): boolean {
  const pathname = usePathname();
  return item.match ? item.match(pathname) : pathname === item.href;
}
