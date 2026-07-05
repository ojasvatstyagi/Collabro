import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Award,
  Code2,
  CheckCircle2,
  Crown,
  Hammer,
  Handshake,
  Info,
  ListChecks,
  Lock,
  MessageSquare,
  Paperclip,
  RefreshCw,
  Rocket,
  Sparkles,
  Trophy,
  UserCheck,
  Users,
  type LucideIcon,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import { cn } from '../utils/cn';
import {
  achievementsApi,
  type Achievement,
  type AchievementCategory,
  type AchievementOverview,
  type AchievementRarity,
} from '../services/api/achievements';

const ICONS: Record<string, LucideIcon> = {
  Rocket,
  Hammer,
  CheckCircle2,
  Users,
  Handshake,
  Crown,
  ListChecks,
  Trophy,
  MessageSquare,
  Paperclip,
  UserCheck,
  Sparkles,
  Code2,
};

const getIcon = (name: string): LucideIcon => ICONS[name] ?? Award;

const CATEGORIES: Array<{ id: AchievementCategory; label: string }> = [
  { id: 'projects', label: 'Projects' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'skills', label: 'Skills' },
  { id: 'badges', label: 'Badges' },
];

type Filter = 'all' | AchievementCategory;

const RARITY_STYLES: Record<
  AchievementRarity,
  { label: string; badge: string; icon: string }
> = {
  common: {
    label: 'Common',
    badge: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
    icon: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
  },
  rare: {
    label: 'Rare',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
  },
  epic: {
    label: 'Epic',
    badge:
      'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
  },
  legendary: {
    label: 'Legendary',
    badge:
      'bg-brand-orange/10 text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow',
    icon: 'bg-brand-orange/10 text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow',
  },
};

const percent = (current: number, required: number): number =>
  required > 0 ? Math.min(100, Math.round((current / required) * 100)) : 0;

const ProgressBar: React.FC<{ current: number; required: number }> = ({
  current,
  required,
}) => (
  <div
    role="progressbar"
    aria-valuemin={0}
    aria-valuemax={required}
    aria-valuenow={current}
    className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-600"
  >
    <div
      className="h-full rounded-full bg-brand-orange transition-all dark:bg-brand-yellow"
      style={{ width: `${percent(current, required)}%` }}
    />
  </div>
);

const card =
  'rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-600 dark:bg-brand-dark-lighter dark:shadow-lg';

const LoadingSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-8" aria-busy="true" aria-label="Loading achievements">
    <div className="h-40 rounded-xl bg-gray-200 dark:bg-brand-dark-lighter" />
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-brand-dark-lighter" />
      ))}
    </div>
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-32 rounded-lg bg-gray-200 dark:bg-brand-dark-lighter" />
      ))}
    </div>
  </div>
);

const Achievements: React.FC = () => {
  const [overview, setOverview] = useState<AchievementOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await achievementsApi.getMyAchievements();
      if (!response.data) {
        throw new Error('No achievements returned');
      }
      setOverview(response.data);
    } catch (err) {
      const message =
        (err as { message?: string })?.message || 'Failed to load achievements';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const achievements = useMemo(() => overview?.achievements ?? [], [overview]);

  const counts = useMemo(() => {
    const result: Record<Filter, { unlocked: number; total: number }> = {
      all: { unlocked: 0, total: 0 },
      projects: { unlocked: 0, total: 0 },
      collaborations: { unlocked: 0, total: 0 },
      leadership: { unlocked: 0, total: 0 },
      skills: { unlocked: 0, total: 0 },
      badges: { unlocked: 0, total: 0 },
    };
    for (const a of achievements) {
      for (const key of ['all', a.category] as const) {
        if (!result[key]) continue;
        result[key].total += 1;
        if (a.isUnlocked) result[key].unlocked += 1;
      }
    }
    return result;
  }, [achievements]);

  const visible = useMemo(
    () =>
      filter === 'all'
        ? achievements
        : achievements.filter((a) => a.category === filter),
    [achievements, filter]
  );

  const selected: Achievement | null =
    achievements.find((a) => a.id === selectedId) ?? null;

  const renderBody = () => {
    if (isLoading) return <LoadingSkeleton />;

    if (error || !overview) {
      return (
        <div className={cn(card, 'flex flex-col items-center gap-4 p-12 text-center')}>
          <p className="text-brand-dark/70 dark:text-gray-300">
            {error ?? 'Could not load achievements.'}
          </p>
          <Button onClick={() => void load()} leftIcon={<RefreshCw className="h-4 w-4" />}>
            Retry
          </Button>
        </div>
      );
    }

    const { stats } = overview;
    const counters = [
      { title: 'Projects Created', value: stats.projectsCreated, icon: Hammer },
      { title: 'Projects Completed', value: stats.projectsCompleted, icon: CheckCircle2 },
      { title: 'Collaborations', value: stats.collaborations, icon: Users },
      { title: 'Tasks Completed', value: stats.tasksCompleted, icon: ListChecks },
    ];

    return (
      <>
        {/* Level / progress summary */}
        <div className={cn(card, 'mb-8 p-6')}>
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <p className="text-sm text-brand-dark/60 dark:text-gray-300">Level</p>
              <p className="text-4xl font-bold text-brand-dark dark:text-gray-100">
                {stats.level}
              </p>
              <span className="mt-2 inline-block rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow">
                {stats.rank}
              </span>
            </div>
            <div className="flex gap-8">
              <div>
                <p className="text-sm text-brand-dark/60 dark:text-gray-300">Badges earned</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                  {stats.badgesEarned} / {stats.totalBadges}
                </p>
              </div>
              <div>
                <p className="text-sm text-brand-dark/60 dark:text-gray-300">Total points</p>
                <p className="text-2xl font-bold text-brand-dark dark:text-gray-100">
                  {stats.totalPoints}
                </p>
              </div>
            </div>
          </div>
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm text-brand-dark/60 dark:text-gray-300">
              <span>Experience</span>
              <span>
                {stats.experience.current} / {stats.experience.required} XP
              </span>
            </div>
            <ProgressBar
              current={stats.experience.current}
              required={stats.experience.required}
            />
          </div>
        </div>

        {/* Counters */}
        <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {counters.map(({ title, value, icon: Icon }) => (
            <div key={title} className={cn(card, 'p-6 transition-all hover:shadow-md')}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-brand-dark/60 dark:text-gray-300">{title}</p>
                  <p className="mt-2 text-3xl font-bold text-brand-dark dark:text-gray-100">
                    {value}
                  </p>
                </div>
                <div className="rounded-full bg-brand-orange/10 p-3 text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow">
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {achievements.length === 0 ? (
          <div className={cn(card, 'flex flex-col items-center gap-3 p-12 text-center')}>
            <Award className="h-12 w-12 text-gray-400" />
            <p className="text-brand-dark/60 dark:text-gray-300">
              No achievements are available yet.
            </p>
          </div>
        ) : (
          <>
            {/* Category tabs */}
            <div className="mb-6 flex flex-wrap gap-2" role="tablist">
              {[{ id: 'all' as const, label: 'All' }, ...CATEGORIES].map((tab) => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    filter === tab.id
                      ? 'border-brand-orange bg-brand-orange text-white dark:border-brand-yellow dark:bg-brand-yellow dark:text-brand-dark'
                      : 'border-gray-200 bg-white text-brand-dark/70 hover:bg-gray-50 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-300 dark:hover:bg-brand-dark-light'
                  )}
                >
                  {tab.label} ({counts[tab.id].unlocked}/{counts[tab.id].total})
                </button>
              ))}
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
              {/* Badge grid */}
              <div className="lg:col-span-2">
                {visible.length === 0 ? (
                  <p className="py-8 text-center text-brand-dark/60 dark:text-gray-300">
                    No badges in this category.
                  </p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {visible.map((a) => {
                      const Icon = getIcon(a.icon);
                      const rarity = RARITY_STYLES[a.rarity] ?? RARITY_STYLES.common;
                      return (
                        <button
                          key={a.id}
                          onClick={() => setSelectedId(a.id)}
                          className={cn(
                            card,
                            'p-4 text-left transition-all hover:shadow-md',
                            !a.isUnlocked && 'opacity-75',
                            selectedId === a.id &&
                              'ring-2 ring-brand-orange dark:ring-brand-yellow'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={cn(
                                'flex h-12 w-12 shrink-0 items-center justify-center rounded-full',
                                a.isUnlocked
                                  ? rarity.icon
                                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
                              )}
                            >
                              {a.isUnlocked ? (
                                <Icon className="h-6 w-6" />
                              ) : (
                                <Lock className="h-5 w-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <h3 className="truncate font-medium text-brand-dark dark:text-gray-100">
                                {a.name}
                              </h3>
                              <div className="mt-1 flex items-center gap-2 text-xs">
                                <span className={cn('rounded-full px-2 py-0.5 font-medium', rarity.badge)}>
                                  {rarity.label}
                                </span>
                                <span className="text-brand-dark/60 dark:text-gray-300">
                                  {a.points} pts
                                </span>
                              </div>
                            </div>
                          </div>
                          {!a.isUnlocked && (
                            <div className="mt-4">
                              <ProgressBar current={a.progress.current} required={a.progress.required} />
                              <p className="mt-1 text-xs text-brand-dark/60 dark:text-gray-300">
                                {a.progress.current} / {a.progress.required}
                              </p>
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Detail panel */}
              <div className={cn(card, 'h-fit p-6')}>
                <h2 className="mb-6 text-xl font-semibold text-brand-dark dark:text-gray-100">
                  Badge Details
                </h2>
                {selected ? (
                  <BadgeDetails badge={selected} />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
                    <Info className="h-12 w-12 text-gray-400" />
                    <p className="text-brand-dark/60 dark:text-gray-300">
                      Select a badge to view its details
                    </p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </>
    );
  };

  return (
    <DashboardLayout title="Achievements">
      <div className="container mx-auto max-w-7xl bg-brand-light-dark px-4 py-8 dark:bg-brand-dark">
        {renderBody()}
      </div>
    </DashboardLayout>
  );
};

const BadgeDetails: React.FC<{ badge: Achievement }> = ({ badge }) => {
  const Icon = getIcon(badge.icon);
  const rarity = RARITY_STYLES[badge.rarity] ?? RARITY_STYLES.common;
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div
          className={cn(
            'flex h-24 w-24 items-center justify-center rounded-full',
            badge.isUnlocked
              ? rarity.icon
              : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
          )}
        >
          <Icon className="h-12 w-12" />
        </div>
      </div>
      <div className="text-center">
        <h3 className="text-lg font-medium text-brand-dark dark:text-gray-100">{badge.name}</h3>
        <div className="mt-2 flex items-center justify-center gap-2 text-xs">
          <span className={cn('rounded-full px-2 py-0.5 font-medium', rarity.badge)}>
            {rarity.label}
          </span>
          <span className="text-brand-dark/60 dark:text-gray-300">{badge.points} pts</span>
          <span className="font-medium text-brand-dark/80 dark:text-gray-200">
            {badge.isUnlocked ? 'Unlocked' : 'Locked'}
          </span>
        </div>
        <p className="mt-3 text-sm text-brand-dark/60 dark:text-gray-300">{badge.description}</p>
      </div>
      <div>
        <div className="mb-2 flex justify-between text-sm text-brand-dark/60 dark:text-gray-300">
          <span>Progress</span>
          <span>
            {badge.progress.current} / {badge.progress.required}
          </span>
        </div>
        <ProgressBar current={badge.progress.current} required={badge.progress.required} />
      </div>
      {badge.requirements.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-brand-dark dark:text-gray-100">
            Requirements
          </h4>
          <ul className="list-inside list-disc space-y-1 text-sm text-brand-dark/70 dark:text-gray-300">
            {badge.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Achievements;
