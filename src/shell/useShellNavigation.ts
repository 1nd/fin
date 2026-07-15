// CCA: 4
import { useState } from 'react';

export type ShellView = 'home' | 'settings';

export function useShellNavigation(initialView: ShellView = 'home') {
  const [activeView, setActiveView] = useState<ShellView>(initialView);
  return { activeView, navigate: setActiveView };
}
