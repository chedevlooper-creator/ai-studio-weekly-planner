import type { PlanStats } from './StatsCards';
import type { SyncStatus } from './SyncStatusIndicator';
import { MobileHeader } from './MobileHeader';
import { DesktopHeader } from './DesktopHeader';

interface AppHeaderProps {
  user: { email?: string } | null;
  stats: PlanStats;
  syncStatus: SyncStatus;
  activeUserId: string | null;
  onExport: () => void;
  onImport: () => void;
  onSignOut: () => void;
}

export function AppHeader(props: AppHeaderProps) {
  return (
    <header className="no-print glass-panel px-3 py-3 sm:px-6 sm:py-5 border-gradient" role="banner">
      <MobileHeader {...props} />
      <DesktopHeader {...props} />
    </header>
  );
}
