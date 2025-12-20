import { ApplicationConfig, provideExperimentalZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [
    // Enable zoneless change detection - required for MFE mode without Zone.js
    provideExperimentalZonelessChangeDetection(),
  ],
};
