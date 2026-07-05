import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  FileText,
  FolderKanban,
  GitBranch,
  ListChecks,
  Send,
  UserPlus,
  XCircle,
} from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  historyApi,
  type HistoryFilters,
  type HistoryItem,
  type HistoryStats,
  type HistoryStatus,
  type HistoryTimeframe,
  type HistoryType,
} from '../services/api/history';

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

const typeOptions: Array<{ value: HistoryType | 'all'; label: string }> = [
  { value: 'all', label: 'All Activities' },
  { value: 'project', label: 'Projects' },
  { value: 'collaboration', label: 'Collaborations' },
  { value: 'request', label: 'Requests' },
  { value: 'task', label: 'Tasks' },
  { value: 'file', label: 'Files' },
];

const timeframeOptions: Array<{ value: HistoryTimeframe | 'all'; label: string }> = [
  { value: 'all', label: 'All Time' },
  { value: 'week', label: 'Past Week' },
  { value: 'month', label: 'Past Month' },
  { value: 'quarter', label: 'Past 3 Months' },
  { value: 'year', label: 'Past Year' },
];

const statusConfig: Record<HistoryStatus, { label: string; className: string }> = {
  completed: {
    label: 'Completed',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  ongoing: {
    label: 'Ongoing',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  },
  pending: {
    label: 'Pending',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  on_hold: {
    label: 'On hold',
    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  cancelled: {
    label: 'Cancelled',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
};

type IconComponent = React.ComponentType<{ className?: string }>;

// Icon and colour per item: status wins for the outcome of a request or task, otherwise the type decides
const getIconAndColor = (item: HistoryItem): { icon: IconComponent; color: string } => {
  if (item.status === 'rejected' || item.status === 'cancelled') {
    return { icon: XCircle, color: 'text-red-500' };
  }
  switch (item.type) {
    case 'project':
      return item.status === 'completed'
        ? { icon: CheckCircle2, color: 'text-green-500' }
        : { icon: FolderKanban, color: 'text-brand-orange' };
    case 'collaboration':
      return { icon: UserPlus, color: 'text-blue-500' };
    case 'request':
      return item.status === 'approved'
        ? { icon: CheckCircle2, color: 'text-green-500' }
        : { icon: Send, color: 'text-yellow-500' };
    case 'task':
      return item.status === 'completed'
        ? { icon: ListChecks, color: 'text-green-500' }
        : { icon: ListChecks, color: 'text-purple-500' };
    case 'file':
      return { icon: FileText, color: 'text-gray-500 dark:text-gray-400' };
  }
};

// Timestamps carry no timezone; new Date() reads them as local time
const dayKey = (timestamp: string): string => new Date(timestamp).toDateString();

const formatGroupDate = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

const formatTime = (timestamp: string): string =>
  new Date(timestamp).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

const errorMessage = (err: unknown, fallback: string): string =>
  typeof err === 'object' && err !== null && 'message' in err && typeof err.message === 'string'
    ? err.message
    : fallback;

const selectClass =
  'rounded-lg border border-gray-300 bg-white px-3 py-1 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100';

const HistoryCard: React.FC<{ item: HistoryItem }> = ({ item }) => {
  const { icon: Icon, color } = getIconAndColor(item);
  const status = item.status ? statusConfig[item.status] : undefined;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md md:p-6 dark:border-gray-600 dark:bg-brand-dark-lighter dark:shadow-lg">
      <div className="flex items-start gap-4">
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700',
            color
          )}
        >
          <Icon className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <h3 className="font-medium text-brand-dark dark:text-gray-100">{item.title}</h3>
                {status && (
                  <span
                    className={cn('rounded-full px-2 py-1 text-xs font-medium', status.className)}
                  >
                    {status.label}
                  </span>
                )}
              </div>
              {item.description && (
                <p className="mb-2 break-words text-sm text-brand-dark/60 dark:text-gray-300">
                  {item.description}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Link
                  to={`/project/${item.projectId}`}
                  className="flex items-center gap-1 text-sm font-medium text-brand-orange hover:underline"
                >
                  <FolderKanban className="h-4 w-4 text-gray-400" />
                  {item.projectName}
                </Link>
                {item.relatedUsername && (
                  <span className="text-sm text-brand-dark/60 dark:text-gray-300">
                    with @{item.relatedUsername}
                  </span>
                )}
              </div>
            </div>
            <span className="shrink-0 text-xs text-gray-500 dark:text-gray-400">
              {formatTime(item.timestamp)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  label: string;
  value: number | undefined;
  icon: IconComponent;
  color: string;
}> = ({ label, value, icon: Icon, color }) => (
  <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-brand-dark-lighter">
    <div className="flex items-center gap-3">
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700',
          color
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        {value === undefined ? (
          <div className="h-6 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-600" />
        ) : (
          <div className="text-2xl font-bold text-brand-dark dark:text-gray-100">{value}</div>
        )}
        <div className="text-xs text-brand-dark/60 dark:text-gray-300">{label}</div>
      </div>
    </div>
  </div>
);

const History: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [type, setType] = useState<HistoryType | 'all'>('all');
  const [timeframe, setTimeframe] = useState<HistoryTimeframe | 'all'>('all');

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [page, setPage] = useState(0);
  const [isLast, setIsLast] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<HistoryStats | null>(null);
  const [statsFailed, setStatsFailed] = useState(false);

  // Only the latest request may update the list; slower, older responses are dropped
  const requestId = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const buildFilters = useCallback(
    (pageNumber: number): HistoryFilters => ({
      type: type === 'all' ? undefined : type,
      timeframe: timeframe === 'all' ? undefined : timeframe,
      search: debouncedSearch || undefined,
      page: pageNumber,
      size: PAGE_SIZE,
    }),
    [type, timeframe, debouncedSearch]
  );

  const loadFirstPage = useCallback(async () => {
    const id = ++requestId.current;
    setIsLoading(true);
    setIsLoadingMore(false);
    setError(null);
    try {
      const response = await historyApi.getHistory(buildFilters(0));
      if (id !== requestId.current) return;
      const data = response.data;
      setItems(data?.content ?? []);
      setPage(0);
      setIsLast(data?.last ?? true);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      if (id !== requestId.current) return;
      const message = errorMessage(err, 'Failed to load history');
      setItems([]);
      setError(message);
      toast.error(message);
    } finally {
      if (id === requestId.current) setIsLoading(false);
    }
  }, [buildFilters]);

  // Any filter change (including the debounced search) restarts from page 0
  useEffect(() => {
    void loadFirstPage();
  }, [loadFirstPage]);

  const loadStats = useCallback(async () => {
    setStatsFailed(false);
    try {
      const response = await historyApi.getStats();
      setStats(response.data ?? null);
    } catch (err) {
      setStatsFailed(true);
      toast.error(errorMessage(err, 'Failed to load history stats'));
    }
  }, []);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  const loadMore = async () => {
    const id = ++requestId.current;
    const nextPage = page + 1;
    setIsLoadingMore(true);
    try {
      const response = await historyApi.getHistory(buildFilters(nextPage));
      if (id !== requestId.current) return;
      const data = response.data;
      setItems((current) => {
        const known = new Set(current.map((item) => item.id));
        return [...current, ...(data?.content ?? []).filter((item) => !known.has(item.id))];
      });
      setPage(nextPage);
      setIsLast(data?.last ?? true);
      setTotalElements(data?.totalElements ?? 0);
    } catch (err) {
      if (id !== requestId.current) return;
      toast.error(errorMessage(err, 'Failed to load more history'));
    } finally {
      if (id === requestId.current) setIsLoadingMore(false);
    }
  };

  const groups = useMemo(() => {
    const byDay = new Map<string, HistoryItem[]>();
    const sorted = [...items].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    for (const item of sorted) {
      const key = dayKey(item.timestamp);
      const group = byDay.get(key);
      if (group) group.push(item);
      else byDay.set(key, [item]);
    }
    return Array.from(byDay.entries());
  }, [items]);

  const hasFilters = type !== 'all' || timeframe !== 'all' || searchQuery.trim() !== '';

  const clearFilters = () => {
    setType('all');
    setTimeframe('all');
    setSearchQuery('');
  };

  const statCards: Array<{ label: string; key: keyof HistoryStats; icon: IconComponent; color: string }> = [
    { label: 'Total activities', key: 'totalActivities', icon: Clock, color: 'text-brand-orange' },
    { label: 'Projects created', key: 'projectsCreated', icon: GitBranch, color: 'text-blue-500' },
    { label: 'Collaborations joined', key: 'collaborationsJoined', icon: UserPlus, color: 'text-purple-500' },
    { label: 'Tasks completed', key: 'tasksCompleted', icon: CheckCircle2, color: 'text-green-500' },
    { label: 'This week', key: 'thisWeek', icon: Clock, color: 'text-gray-500 dark:text-gray-400' },
    { label: 'This month', key: 'thisMonth', icon: Clock, color: 'text-gray-500 dark:text-gray-400' },
  ];

  return (
    <DashboardLayout
      title="History"
      showSearch={true}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchPlaceholder="Search activities..."
    >
      <div className="min-h-screen bg-brand-light-dark p-4 md:p-8 dark:bg-brand-dark">
        <div className="mx-auto max-w-4xl">
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3">
            {statCards.map((card) => (
              <StatCard
                key={card.key}
                label={card.label}
                icon={card.icon}
                color={card.color}
                value={statsFailed ? 0 : stats?.[card.key]}
              />
            ))}
          </div>
          {statsFailed && (
            <p className="-mt-3 mb-6 text-sm text-red-600 dark:text-red-400">
              Could not load stats.{' '}
              <button onClick={() => void loadStats()} className="font-medium underline">
                Retry
              </button>
            </p>
          )}

          {/* Filters */}
          <div className="mb-6 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-600 dark:bg-brand-dark-light">
            <div className="flex items-center gap-2">
              <label
                htmlFor="history-type"
                className="text-sm font-medium text-brand-dark dark:text-gray-100"
              >
                Type:
              </label>
              <select
                id="history-type"
                value={type}
                onChange={(e) => setType(e.target.value as HistoryType | 'all')}
                className={selectClass}
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label
                htmlFor="history-timeframe"
                className="text-sm font-medium text-brand-dark dark:text-gray-100"
              >
                Time:
              </label>
              <select
                id="history-timeframe"
                value={timeframe}
                onChange={(e) => setTimeframe(e.target.value as HistoryTimeframe | 'all')}
                className={selectClass}
              >
                {timeframeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear Filters
              </Button>
            )}
            {!isLoading && !error && (
              <div className="ml-auto text-sm text-brand-dark/60 dark:text-gray-300">
                {totalElements} {totalElements === 1 ? 'activity' : 'activities'}
              </div>
            )}
          </div>

          {/* Timeline */}
          {isLoading ? (
            <div className="space-y-4" aria-busy="true">
              {[0, 1, 2].map((n) => (
                <div
                  key={n}
                  className="h-24 animate-pulse rounded-lg border border-gray-200 bg-white dark:border-gray-600 dark:bg-brand-dark-lighter"
                />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertCircle className="mb-4 h-12 w-12 text-red-400" />
              <h3 className="mb-2 text-lg font-medium text-brand-dark dark:text-gray-100">
                Could not load history
              </h3>
              <p className="mb-4 text-brand-dark/60 dark:text-gray-300">{error}</p>
              <Button variant="outline" onClick={() => void loadFirstPage()}>
                Try again
              </Button>
            </div>
          ) : groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="mb-4 h-12 w-12 text-gray-400" />
              <h3 className="mb-2 text-lg font-medium text-brand-dark dark:text-gray-100">
                {hasFilters ? 'Nothing matches your filters' : 'No activity yet'}
              </h3>
              <p className="text-brand-dark/60 dark:text-gray-300">
                {hasFilters
                  ? 'Try adjusting your filters or search terms'
                  : 'Your activity history will appear here as you use the platform'}
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {groups.map(([day, dayItems]) => (
                <div key={day} className="space-y-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-brand-dark dark:text-gray-100">
                      {formatGroupDate(day)}
                    </h2>
                    <div className="h-px flex-1 bg-gray-200 dark:bg-gray-600" />
                    <span className="text-sm text-brand-dark/60 dark:text-gray-300">
                      {dayItems.length} {dayItems.length === 1 ? 'activity' : 'activities'}
                    </span>
                  </div>
                  <div className="space-y-4">
                    {dayItems.map((item) => (
                      <HistoryCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
              ))}

              {!isLast && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={() => void loadMore()}
                    isLoading={isLoadingMore}
                    loadingText="Loading..."
                  >
                    Load more
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default History;
