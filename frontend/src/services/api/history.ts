import { BaseApi, ApiResponse } from './base';

export type HistoryType = 'project' | 'collaboration' | 'request' | 'task' | 'file';

export type HistoryStatus =
  | 'completed'
  | 'ongoing'
  | 'pending'
  | 'cancelled'
  | 'approved'
  | 'rejected'
  | 'on_hold';

export type HistoryTimeframe = 'week' | 'month' | 'quarter' | 'year';

export interface HistoryItem {
  /** Synthetic id, e.g. "project:<uuid>" or "request:sent:12" */
  id: string;
  type: HistoryType;
  title: string;
  description: string | null;
  /** ISO local date-time without a timezone, e.g. "2026-11-20T10:30:00" */
  timestamp: string;
  status: HistoryStatus | null;
  projectId: string;
  projectName: string;
  relatedUsername: string | null;
}

/** Spring Data page */
export interface HistoryPage {
  content: HistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
  first: boolean;
  last: boolean;
}

export interface HistoryStats {
  totalActivities: number;
  projectsCreated: number;
  collaborationsJoined: number;
  tasksCompleted: number;
  thisWeek: number;
  thisMonth: number;
}

export interface HistoryFilters {
  type?: HistoryType;
  timeframe?: HistoryTimeframe;
  search?: string;
  /** 0-based */
  page?: number;
  /** Defaults to 50 on the server, max 100 */
  size?: number;
}

class HistoryApi extends BaseApi {
  async getHistory(filters: HistoryFilters = {}): Promise<ApiResponse<HistoryPage>> {
    const { type, timeframe, page, size } = filters;
    const search = filters.search?.trim();

    // Empty filters are left out so the server treats them as "no filter"
    const params: Record<string, string | number> = {};
    if (type) params.type = type;
    if (timeframe) params.timeframe = timeframe;
    if (search) params.search = search;
    if (page !== undefined) params.page = page;
    if (size !== undefined) params.size = size;

    return this.get<HistoryPage>('/history', { params });
  }

  async getStats(): Promise<ApiResponse<HistoryStats>> {
    return this.get<HistoryStats>('/history/stats');
  }
}

export const historyApi = new HistoryApi();
