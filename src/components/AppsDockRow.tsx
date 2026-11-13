import React from 'react';
import type { InstalledApp } from '../types/launcher';
import { AppLogoMark } from './AppLogoMark';

interface AppsDockRowProps {
  apps: InstalledApp[];
  focusedCol: number | null;
  onFocusCol: (col: number) => void;
  onOpenApp: (app: InstalledApp) => void;
}

export const AppsDockRow: React.FC<AppsDockRowProps> = ({
  apps,
  focusedCol,
  onFocusCol,
  onOpenApp,
}) => {
  return (
    <section aria-label="Installed streaming apps" className="space-y-4">
      <h2 className="font-display text-2xl font-semibold text-[#f3ede2]">
        Apps
      </h2>

      <div className="flex items-stretch gap-5 overflow-x-auto no-scrollbar py-2 px-1">
        {apps.map((app, index) => {
          const isFocused = focusedCol === index;
          return (
            <button
              key={app.id}
              type="button"
              onClick={() => onOpenApp(app)}
              onMouseEnter={() => onFocusCol(index)}
              onFocus={() => onFocusCol(index)}
              data-focused={isFocused ? 'true' : 'false'}
              aria-label={app.name}
              className="nc-focus-card relative w-[132px] h-[82px] rounded-xl border border-white/10 overflow-hidden shrink-0 cursor-pointer focus-visible:outline-none"
            >
              <AppLogoMark
                appId={app.id}
                shortCode={app.shortCode}
                accentColor={app.accentColor}
              />
            </button>
          );
        })}
      </div>
    </section>
  );
};
