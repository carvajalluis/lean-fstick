import React, { useState } from 'react';
import { Grid, Home, Search, Settings } from 'lucide-react';
import type { LauncherSection } from '../types/launcher';

interface LeftNavRailProps {
  activeSection: LauncherSection;
  onSelectSection: (section: LauncherSection) => void;
  onOpenSystemSettings: () => void;
}

const NAV_ITEMS: Array<{
  id: LauncherSection;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'find', label: 'Find', icon: Search },
  { id: 'apps', label: 'Apps', icon: Grid },
];

export const LeftNavRail: React.FC<LeftNavRailProps> = ({
  activeSection,
  onSelectSection,
  onOpenSystemSettings,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
      onFocus={() => setExpanded(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setExpanded(false);
        }
      }}
      aria-label="Primary launcher navigation"
      className={`sticky top-0 h-screen shrink-0 z-30 flex flex-col justify-between border-r border-[#2a262c] bg-[#0f0e10]/95 backdrop-blur-md py-7 transition-[width] duration-200 ease-out ${
        expanded ? 'w-48' : 'w-[76px]'
      }`}
    >
      <div className="px-3.5">
        <nav className="flex flex-col gap-2" aria-label="Launcher sections">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectSection(item.id)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={item.label}
                className={`flex items-center gap-3.5 px-3 py-3 rounded-xl text-left transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb020] ${
                  isActive
                    ? 'bg-[#211e24] text-[#ffb020]'
                    : 'text-[#a89f91]/70 hover:text-[#f3ede2] hover:bg-[#19171b]'
                }`}
              >
                <Icon className="w-5 h-5 shrink-0" />
                <span
                  className={`font-display text-base font-semibold whitespace-nowrap transition-opacity duration-150 ${
                    expanded
                      ? 'opacity-100'
                      : 'opacity-0 pointer-events-none w-0 overflow-hidden'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="px-3.5">
        <button
          type="button"
          onClick={onOpenSystemSettings}
          aria-label="Fire TV Settings"
          className="w-full flex items-center gap-3.5 px-3 py-3 rounded-xl text-left text-[#a89f91]/70 hover:text-[#f3ede2] hover:bg-[#19171b] transition-colors duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ffb020]"
        >
          <Settings className="w-5 h-5 shrink-0" />
          <span
            className={`font-display text-base font-semibold whitespace-nowrap transition-opacity duration-150 ${
              expanded
                ? 'opacity-100'
                : 'opacity-0 pointer-events-none w-0 overflow-hidden'
            }`}
          >
            Settings
          </span>
        </button>
      </div>
    </aside>
  );
};
