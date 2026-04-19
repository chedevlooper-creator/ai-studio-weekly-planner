import { useState, type ReactNode } from 'react';
import { Calendar, Users, Bot, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

export type MobileTab = 'hafta' | 'takim' | 'ai' | 'notlar';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

const tabs: { id: MobileTab; label: string; icon: ReactNode }[] = [
  { id: 'hafta', label: 'Hafta', icon: <Calendar className="size-[18px]" /> },
  { id: 'takim', label: 'Takım', icon: <Users className="size-[18px]" /> },
  { id: 'ai', label: 'AI', icon: <Bot className="size-[18px]" /> },
  { id: 'notlar', label: 'Notlar', icon: <FileText className="size-[18px]" /> },
];

export function MobileBottomNav({ activeTab, onTabChange }: MobileBottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[40] border-t border-white/[0.07] bg-surface-0/95 backdrop-blur-2xl sm:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-semibold transition-all',
              activeTab === tab.id
                ? 'text-accent-light'
                : 'text-slate-600 hover:text-slate-400',
            )}
            aria-label={tab.label}
          >
            {activeTab === tab.id && (
              <span className="absolute top-0 left-1/2 h-0.5 w-10 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent to-violet-500" />
            )}
            <span className={cn(
              'transition-transform duration-150',
              activeTab === tab.id && 'scale-110',
            )}>
              {tab.icon}
            </span>
            <span className={activeTab === tab.id ? 'text-accent-light' : ''}>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
