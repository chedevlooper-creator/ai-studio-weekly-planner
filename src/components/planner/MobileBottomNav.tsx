import { useState, type ReactNode } from 'react';
import { Calendar, Users, Bot, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export type MobileTab = 'hafta' | 'takim' | 'ai' | 'notlar';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  aiOpen?: boolean;
  onAiOpen?: () => void;
  onTabChange: (tab: MobileTab) => void;
}

const tabs: { id: MobileTab; label: string; icon: ReactNode }[] = [
  { id: 'hafta', label: 'Hafta', icon: <Calendar className="size-[18px]" /> },
  { id: 'takim', label: 'Takım', icon: <Users className="size-[18px]" /> },
  { id: 'ai', label: 'AI', icon: <Bot className="size-[18px]" /> },
  { id: 'notlar', label: 'Notlar', icon: <FileText className="size-[18px]" /> },
];

export function MobileBottomNav({ activeTab, aiOpen = false, onAiOpen, onTabChange }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[40] border-t border-white/[0.07] bg-surface-0/95 backdrop-blur-2xl sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobil gezinme"
    >
      <div className="flex items-stretch px-1.5 pt-1.5">
        {tabs.map((tab) => {
          const isAiTab = tab.id === 'ai';
          const isActive = isAiTab ? aiOpen : activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => (isAiTab ? onAiOpen?.() : onTabChange(tab.id))}
              className={cn(
                'relative flex min-h-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-xl px-1.5 py-2.5 text-[10px] font-semibold transition-all',
                isActive
                  ? 'bg-white/[0.04] text-accent-light'
                  : 'text-slate-600 hover:text-slate-400',
              )}
              aria-label={tab.label}
              aria-current={!isAiTab && isActive ? 'page' : undefined}
              aria-pressed={isAiTab ? isActive : undefined}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-violet-500" />
              )}
              <span className={cn(
                'transition-transform duration-150',
                isActive && 'scale-110',
              )}>
                {tab.icon}
              </span>
              <span className={isActive ? 'text-accent-light' : ''}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
