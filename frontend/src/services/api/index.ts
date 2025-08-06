// Central API exports
export * from './base';
export * from './auth';
export * from './profile';
export * from './projects';
export * from './workspace';
export * from './requests';
export * from './achievements';
export * from './history';
export * from './settings';
export * from './teams';

// API instances
export { authApi } from './auth';
export { profileApi } from './profile';
export { projectsApi } from './projects';
export { workspaceApi } from './workspace';
export { requestsApi } from './requests';
export { achievementsApi } from './achievements';
export { historyApi } from './history';
export { settingsApi } from './settings';
export { teamsApi } from './teams';

// Re-export the base API client for custom requests
export { default as apiClient } from './base';