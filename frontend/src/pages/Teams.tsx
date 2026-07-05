import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Crown,
  ExternalLink,
  LogOut,
  PlusCircle,
  RefreshCw,
  Search,
  UserMinus,
  Users,
} from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { cn } from '../utils/cn';
import { projectsApi } from '../services/api/projects';
import {
  teamsApi,
  type PublicProfile,
  type TeamProjectStatus,
  type TeamSummary,
} from '../services/api/teams';

type RoleFilter = 'all' | 'owned' | 'joined';

type PendingAction =
  | { kind: 'leave'; team: TeamSummary }
  | { kind: 'remove'; team: TeamSummary; member: PublicProfile };

const STATUS_STYLES: Record<TeamProjectStatus, string> = {
  ACTIVE:
    'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/40',
  COMPLETED:
    'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-900/40',
  CANCELLED:
    'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700',
};

const fullName = (p: PublicProfile) => `${p.firstname} ${p.lastname}`.trim();

const initials = (p: PublicProfile) =>
  `${p.firstname.charAt(0)}${p.lastname.charAt(0)}`.toUpperCase() || '?';

const Avatar: React.FC<{ profile: PublicProfile; className?: string }> = ({
  profile,
  className,
}) =>
  profile.profilePictureUrl ? (
    <img
      src={profile.profilePictureUrl}
      alt={fullName(profile)}
      className={cn(
        'h-8 w-8 rounded-full object-cover ring-2 ring-white dark:ring-brand-dark-lighter',
        className
      )}
    />
  ) : (
    <div
      title={fullName(profile)}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full bg-brand-orange/15 text-xs font-semibold text-brand-orange ring-2 ring-white dark:ring-brand-dark-lighter',
        className
      )}
    >
      {initials(profile)}
    </div>
  );

const matchesQuery = (team: TeamSummary, query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const people = [team.owner, ...team.members];
  return (
    team.name.toLowerCase().includes(q) ||
    team.projectTitle.toLowerCase().includes(q) ||
    people.some(
      (p) =>
        fullName(p).toLowerCase().includes(q) ||
        p.username.toLowerCase().includes(q)
    )
  );
};

interface MemberRowProps {
  profile: PublicProfile;
  isOwner: boolean;
  canRemove: boolean;
  onRemove: () => void;
}

const MemberRow: React.FC<MemberRowProps> = ({
  profile,
  isOwner,
  canRemove,
  onRemove,
}) => (
  <li className="flex items-center gap-3 py-2">
    <Avatar profile={profile} />
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2">
        <span className="truncate text-sm font-medium text-brand-dark dark:text-gray-100">
          {fullName(profile)}
        </span>
        {isOwner && (
          <Crown className="h-3.5 w-3.5 text-brand-orange" aria-label="Owner" />
        )}
      </div>
      <p className="truncate text-xs text-brand-dark/50 dark:text-gray-400">
        @{profile.username}
      </p>
      {profile.skills.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {profile.skills.slice(0, 3).map((s) => (
            <span
              key={s.id}
              className="rounded-md border border-gray-100 bg-gray-50 px-2 py-0.5 text-xs text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            >
              {s.name}
            </span>
          ))}
        </div>
      )}
    </div>
    {canRemove && (
      <button
        onClick={onRemove}
        title={`Remove ${fullName(profile)} from the team`}
        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
      >
        <UserMinus className="h-4 w-4" />
      </button>
    )}
  </li>
);

interface TeamCardProps {
  team: TeamSummary;
  onLeave: () => void;
  onRemove: (member: PublicProfile) => void;
}

const TeamCard: React.FC<TeamCardProps> = ({ team, onLeave, onRemove }) => {
  const [expanded, setExpanded] = useState(false);
  const isOwner = team.role === 'OWNER';
  const everyone = [team.owner, ...team.members];

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-brand-orange/50 hover:shadow-md dark:border-gray-600 dark:bg-brand-dark-lighter dark:shadow-lg">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="line-clamp-1 text-lg font-semibold text-brand-dark dark:text-gray-100">
            {team.name}
          </h3>
          <p className="line-clamp-1 text-sm text-brand-dark/60 dark:text-gray-400">
            {team.projectTitle}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium',
              STATUS_STYLES[team.projectStatus]
            )}
          >
            {team.projectStatus.charAt(0) +
              team.projectStatus.slice(1).toLowerCase()}
          </span>
          <span
            className={cn(
              'rounded-full border px-2.5 py-0.5 text-xs font-medium',
              isOwner
                ? 'border-brand-orange/30 bg-brand-orange/10 text-brand-orange'
                : 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300'
            )}
          >
            {isOwner ? 'Owner' : 'Member'}
          </span>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <div className="flex -space-x-2">
          {everyone.slice(0, 5).map((p) => (
            <Avatar key={p.id} profile={p} />
          ))}
          {everyone.length > 5 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-medium text-gray-600 ring-2 ring-white dark:bg-gray-700 dark:text-gray-300 dark:ring-brand-dark-lighter">
              +{everyone.length - 5}
            </div>
          )}
        </div>
        <span className="flex items-center gap-1 text-sm text-brand-dark/60 dark:text-gray-400">
          <Users className="h-4 w-4" />
          {team.memberCount} {team.memberCount === 1 ? 'member' : 'members'}
        </span>
      </div>

      <button
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="mb-2 flex items-center gap-1 self-start text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange"
      >
        {expanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        {expanded ? 'Hide members' : 'Show members'}
      </button>

      {expanded && (
        <ul className="mb-4 divide-y divide-gray-100 dark:divide-gray-700">
          <MemberRow
            profile={team.owner}
            isOwner
            canRemove={false}
            onRemove={() => undefined}
          />
          {team.members.map((m) => (
            <MemberRow
              key={m.id}
              profile={m}
              isOwner={false}
              canRemove={isOwner}
              onRemove={() => onRemove(m)}
            />
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
        <Link
          to={`/project/${team.projectId}`}
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange"
        >
          Open workspace <ExternalLink className="h-4 w-4" />
        </Link>
        {isOwner ? (
          <span className="text-xs text-brand-dark/50 dark:text-gray-400">
            Owners cannot leave. Delete the project from its workspace instead.
          </span>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<LogOut className="h-4 w-4" />}
            onClick={onLeave}
          >
            Leave team
          </Button>
        )}
      </div>
    </div>
  );
};

const Teams: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [teams, setTeams] = useState<TeamSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [isActing, setIsActing] = useState(false);

  const loadTeams = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await teamsApi.getMyTeams();
      setTeams(response.data ?? []);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (err as { message?: string }).message || 'Failed to load teams';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTeams();
  }, [loadTeams]);

  const counts = useMemo(
    () => ({
      all: teams.length,
      owned: teams.filter((t) => t.role === 'OWNER').length,
      joined: teams.filter((t) => t.role === 'MEMBER').length,
    }),
    [teams]
  );

  const visible = useMemo(
    () =>
      teams.filter(
        (t) =>
          (roleFilter === 'all' ||
            (roleFilter === 'owned' ? t.role === 'OWNER' : t.role === 'MEMBER')) &&
          matchesQuery(t, searchQuery)
      ),
    [teams, roleFilter, searchQuery]
  );

  const confirm = async () => {
    if (!pending) return;
    setIsActing(true);
    try {
      if (pending.kind === 'leave') {
        await projectsApi.leaveProject(pending.team.projectId);
        toast.success(`You left ${pending.team.name}`);
      } else {
        await projectsApi.removeTeamMember(
          pending.team.projectId,
          pending.member.id
        );
        toast.success(`${fullName(pending.member)} was removed from the team`);
      }
      setPending(null);
      await loadTeams();
    } catch (err) {
      toast.error(
        (err as { message?: string }).message || 'Something went wrong'
      );
    } finally {
      setIsActing(false);
    }
  };

  const filters: Array<{ key: RoleFilter; label: string }> = [
    { key: 'all', label: 'All' },
    { key: 'owned', label: 'Owned' },
    { key: 'joined', label: 'Joined' },
  ];

  return (
    <DashboardLayout
      title="Teams"
      showSearch
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchPlaceholder="Search teams, projects or people..."
    >
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setRoleFilter(f.key)}
              className={cn(
                'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                roleFilter === f.key
                  ? 'border-brand-orange bg-brand-orange text-white'
                  : 'border-gray-200 bg-white text-brand-dark/70 hover:border-brand-orange/50 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-300'
              )}
            >
              {f.label} ({counts[f.key]})
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-56 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-brand-dark-lighter"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-900/10">
            <p className="mb-4 text-red-700 dark:text-red-400">{error}</p>
            <Button
              variant="outline"
              leftIcon={<RefreshCw className="h-4 w-4" />}
              onClick={() => void loadTeams()}
            >
              Retry
            </Button>
          </div>
        ) : teams.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
            <div className="rounded-full bg-brand-orange/10 p-6">
              <Users className="h-10 w-10 text-brand-orange" />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-brand-dark dark:text-gray-100">
              No teams yet
            </h2>
            <p className="mt-2 max-w-md text-brand-dark/60 dark:text-gray-400">
              A team forms around a project once its owner approves the first
              join request. Find a project to join or post your own idea.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/explore">
                <Button leftIcon={<Search className="h-4 w-4" />}>
                  Find a project to join
                </Button>
              </Link>
              <Link to="/post-idea">
                <Button
                  variant="outline"
                  leftIcon={<PlusCircle className="h-4 w-4" />}
                >
                  Post an idea
                </Button>
              </Link>
            </div>
          </div>
        ) : visible.length === 0 ? (
          <p className="py-12 text-center text-brand-dark/60 dark:text-gray-400">
            No teams match your filters.
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((team) => (
              <TeamCard
                key={team.id}
                team={team}
                onLeave={() => setPending({ kind: 'leave', team })}
                onRemove={(member) =>
                  setPending({ kind: 'remove', team, member })
                }
              />
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={pending !== null}
        onClose={() => !isActing && setPending(null)}
        title={pending?.kind === 'leave' ? 'Leave team?' : 'Remove member?'}
      >
        {pending && (
          <div>
            <p className="text-sm text-brand-dark/70 dark:text-gray-300">
              {pending.kind === 'leave'
                ? `You will lose access to ${pending.team.projectTitle}'s workspace.`
                : `${fullName(pending.member)} will lose access to ${pending.team.projectTitle}'s workspace.`}
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setPending(null)}
                disabled={isActing}
              >
                Cancel
              </Button>
              <Button
                onClick={() => void confirm()}
                isLoading={isActing}
                className="bg-red-600 hover:bg-red-700"
              >
                {pending.kind === 'leave' ? 'Leave team' : 'Remove'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default Teams;
