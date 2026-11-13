import React from 'react';
import type { InstalledApp } from '../types/launcher';
import { AppLogoMark } from './AppLogoMark';

interface AppsGridViewProps {
  apps: InstalledApp[];
  onLaunchApp: (app: InstalledApp) => void;
}

export const AppsGridView: React.FC<AppsGridViewProps> = ({
  apps,
  onLaunchApp,
}) => {
  return (
    <div className="space-y-8 pb-12">
      <h1 className="font-display text-3xl md:text-4xl font-bold text-[#f3ede2]">
        Apps
      </h1>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {apps.map((app) => (
          <button
            key={app.id}
            type="button"
            onClick={() => onLaunchApp(app)}
            aria-label={`Open ${app.name}`}
            className="nc-focus-card relative w-full aspect-[16/10] rounded-2xl border border-white/10 overflow-hidden block cursor-pointer focus-visible:outline-none"
          >
            <AppLogoMark
              appId={app.id}
              shortCode={app.shortCode}
              accentColor={app.accentColor}
            />
          </button>
        ))}
      </div>
    </div>
  );
};
