import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Clock, Compass, ExternalLink, RefreshCw, Send, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { JoinRequest, REQUESTS_CHANGED_EVENT, requestsApi } from '../services/api/requests';
import { cn } from '../utils/cn';
import { errorMessage } from '../utils/errors';
import { formatDate } from '../utils/helper';
import { profilePath } from '../utils/people';

type Filter = 'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS: Record<JoinRequest['status'], { label: string; className: string }> = {
  PENDING: {
    label: 'Waiting for a reply',
    className:
      'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-400',
  },
  APPROVED: {
    label: 'Approved',
    className:
      'border-green-200 bg-green-50 text-green-700 dark:border-green-900/40 dark:bg-green-900/20 dark:text-green-400',
  },
  REJECTED: {
    label: 'Declined',
    className: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-400',
  },
  ON_HOLD: {
    label: 'On hold',
    className: 'border-gray-200 bg-gray-50 text-gray-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
};

const FILTERS: Array<{ key: Filter; label: string }> = [
  { key: 'ALL', label: 'All' },
  { key: 'PENDING', label: 'Waiting' },
  { key: 'APPROVED', label: 'Approved' },
  { key: 'REJECTED', label: 'Declined' },
];

interface CardProps {
  request: JoinRequest;
  onWithdraw: (request: JoinRequest) => void;
}

const RequestCard: React.FC<CardProps> = ({ request, onWithdraw }) => {
  const status = STATUS[request.status] ?? STATUS.ON_HOLD;
  const ownerLink = profilePath(request.ownerUsername);
  const owner = request.ownerDisplayName || request.ownerUsername || 'the project owner';

  return (
    <li className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-600 dark:bg-brand-dark-lighter">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100">{request.projectTitle}</h3>
          <p className="mt-1 text-sm text-brand-dark/60 dark:text-gray-400">
            Sent to{' '}
            {ownerLink ? (
              <Link to={ownerLink} className="font-medium hover:underline">
                {owner}
              </Link>
            ) : (
              owner
            )}{' '}
            · {formatDate(request.createdAt)}
          </p>
        </div>
        <span className={cn('rounded-full border px-3 py-1 text-xs font-medium', status.className)}>{status.label}</span>
      </div>

      {request.message && (
        <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm italic text-brand-dark/80 dark:bg-brand-dark dark:text-gray-300">
          "{request.message}"
        </p>
      )}

      {request.status === 'APPROVED' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" /> You are on the team
          </span>
          <Link
            to={`/project/${request.projectId}`}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange"
          >
            Open workspace <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      )}

      {request.status === 'REJECTED' && (
        <div className="mt-4 text-sm text-red-700 dark:text-red-400">
          <span className="flex items-center gap-2 font-medium">
            <XCircle className="h-5 w-5" /> The owner declined this request
          </span>
          {request.rejectionReason && (
            <p className="mt-1 text-brand-dark/70 dark:text-gray-300">Reason: {request.rejectionReason}</p>
          )}
        </div>
      )}

      {request.status === 'PENDING' && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-sm text-brand-dark/60 dark:text-gray-400">
            <Clock className="h-4 w-4" /> The owner has not replied yet
          </span>
          <Button variant="outline" size="sm" onClick={() => onWithdraw(request)}>
            Withdraw request
          </Button>
        </div>
      )}
    </li>
  );
};

/** The requests I sent to join other people's projects, with where each one stands. */
const MyRequests: React.FC = () => {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [withdrawing, setWithdrawing] = useState<JoinRequest | null>(null);
  const [isActing, setIsActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestsApi.getSentRequests();
      setRequests(response.data ?? []);
    } catch (err) {
      setError(errorMessage(err, 'Could not load your requests'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const counts = useMemo(() => {
    const byStatus = (s: JoinRequest['status']) => requests.filter((r) => r.status === s).length;
    return { ALL: requests.length, PENDING: byStatus('PENDING'), APPROVED: byStatus('APPROVED'), REJECTED: byStatus('REJECTED') };
  }, [requests]);

  const visible = filter === 'ALL' ? requests : requests.filter((r) => r.status === filter);

  const withdraw = async () => {
    if (!withdrawing) return;
    setIsActing(true);
    try {
      await requestsApi.cancelRequest(withdrawing.id);
      setRequests((current) => current.filter((r) => r.id !== withdrawing.id));
      toast.success('Request withdrawn');
      window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT));
      setWithdrawing(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not withdraw the request'));
    } finally {
      setIsActing(false);
    }
  };

  return (
    <DashboardLayout title="Sent requests">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold text-brand-dark dark:text-gray-100">Requests you sent</h1>
        <p className="mb-6 text-sm text-brand-dark/60 dark:text-gray-400">
          Your requests to join other people's projects, and what the owners answered.
        </p>

        {loading ? (
          <div className="space-y-4" aria-label="Loading your requests">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-28 animate-pulse rounded-xl border border-gray-200 bg-white dark:border-gray-600 dark:bg-brand-dark-lighter"
              />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center dark:border-red-900/40 dark:bg-red-900/10">
            <p className="mb-4 text-red-700 dark:text-red-400">{error}</p>
            <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />} onClick={() => void load()}>
              Retry
            </Button>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center rounded-xl border border-dashed border-gray-300 p-12 text-center dark:border-gray-600">
            <div className="rounded-full bg-brand-orange/10 p-6">
              <Send className="h-10 w-10 text-brand-orange" />
            </div>
            <h2 className="mt-4 text-lg font-semibold text-brand-dark dark:text-gray-100">
              You have not asked to join any project yet
            </h2>
            <p className="mt-1 text-sm text-brand-dark/60 dark:text-gray-400">
              Find a project you like and send a request: it shows up here with the answer.
            </p>
            <Link
              to="/explore"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-orange hover:underline"
            >
              <Compass className="h-4 w-4" /> Find a project
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-2">
              {FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={cn(
                    'rounded-full border px-4 py-1.5 text-sm font-medium transition-colors',
                    filter === f.key
                      ? 'border-brand-orange bg-brand-orange text-white'
                      : 'border-gray-200 bg-white text-brand-dark/70 hover:border-brand-orange/50 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-300'
                  )}
                >
                  {f.label} ({counts[f.key]})
                </button>
              ))}
            </div>
            {visible.length === 0 ? (
              <p className="text-sm text-brand-dark/60 dark:text-gray-400">Nothing in this list.</p>
            ) : (
              <ul className="space-y-4">
                {visible.map((request) => (
                  <RequestCard key={request.id} request={request} onWithdraw={setWithdrawing} />
                ))}
              </ul>
            )}
          </>
        )}
      </div>

      <Modal isOpen={withdrawing !== null} onClose={() => !isActing && setWithdrawing(null)} title="Withdraw request?">
        {withdrawing && (
          <div>
            <p className="text-sm text-brand-dark/70 dark:text-gray-300">
              Your request to join {withdrawing.projectTitle} will be removed and the owner will no longer see it. You
              can send a new one later.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => setWithdrawing(null)} disabled={isActing}>
                Keep it
              </Button>
              <Button onClick={() => void withdraw()} isLoading={isActing} className="bg-red-600 hover:bg-red-700">
                Withdraw
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
};

export default MyRequests;
