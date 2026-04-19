import type { RefObject } from 'react';
import type { Assignee } from '../../types/plan';
import type { PlanStats } from './StatsCards';
import type { SyncStatus } from './SyncStatusIndicator';
import { MobileHeader } from './MobileHeader';
import { DesktopHeader } from './DesktopHeader';

interface AppHeaderProps {
  user: { email?: string } | null;
  stats: PlanStats;
  assigneeStats: { member: Assignee; assigned: number; done: number }[];
  syncStatus: SyncStatus;
  activeUserId: string | null;
  onExport: () => void;
  onImport: () => void;
  onSignOut: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
}

export function AppHeader(props: AppHeaderProps) {
  return (
    <header className="no-print glass-panel px-4 py-4 sm:px-6 sm:py-5 border-gradient" role="banner">
      <MobileHeader {...props} />
      <DesktopHeader {...props} />
    </header>
  );
}
