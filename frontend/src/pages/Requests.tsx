import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Bell,
  PlusCircle,
  Menu,
  Loader2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/ui/SideBar';
import Button from '../components/ui/Button';
import ThemeToggle from '../components/ui/ThemeToggle';
import { requestsApi, JoinRequest, REQUESTS_CHANGED_EVENT } from '../services/api/requests';
import { toast } from 'react-hot-toast';
import { errorMessage } from '../utils/errors';
import { displayName, initials, profilePath } from '../utils/people';

const RequestCard: React.FC<{
  request: JoinRequest;
  onApprove: (id: number) => void;
  onReject: (id: number) => void;
  isProcessing: boolean;
}> = ({ request, onApprove, onReject, isProcessing }) => {
  return (
    <div className="rounded-lg bg-white p-4 md:p-6 shadow-sm border border-gray-200 transition-all hover:shadow-md dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
      <div className="flex flex-col sm:flex-row items-start gap-4">
        {request.requester.profilePictureUrl ? (
          <img
            src={request.requester.profilePictureUrl}
            alt={request.requester.username}
            className="h-12 w-12 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-brand-orange/10 text-lg font-bold text-brand-orange">
            {initials(request.requester)}
          </div>
        )}

        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
            <div>
              <h3 className="font-medium text-brand-dark dark:text-gray-100">
                {profilePath(request.requester.username) ? (
                  <Link
                    to={profilePath(request.requester.username) as string}
                    className="hover:underline"
                  >
                    {displayName(request.requester)}
                  </Link>
                ) : (
                  displayName(request.requester)
                )}
              </h3>
              {/* Someone without a name is already shown by their username */}
              {displayName(request.requester) !== request.requester.username && (
                <p className="text-sm text-brand-dark/60 dark:text-gray-400">
                  @{request.requester.username}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-brand-dark/60 dark:text-gray-300">
              Requested to join
            </p>
            <p className="mt-1 font-medium text-brand-dark dark:text-gray-100">
              {request.projectTitle}
            </p>
          </div>

          {request.message && (
            <div className="mt-3 p-3 bg-gray-50 dark:bg-brand-dark rounded-lg">
              <p className="text-sm text-brand-dark/80 dark:text-gray-300 italic">
                "{request.message}"
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {request.requester.skills.map((skill, index) => (
              <span
                key={index}
                className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
              >
                {skill}
              </span>
            ))}
          </div>

          {request.status === 'PENDING' && (
            <div className="mt-6 flex flex-col sm:flex-row gap-3">
              <Button
                className="flex-1"
                onClick={() => onApprove(request.id)}
                disabled={isProcessing}
                leftIcon={
                  isProcessing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )
                }
              >
                {isProcessing ? 'Processing...' : 'Add to team'}
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onReject(request.id)}
                disabled={isProcessing}
                leftIcon={<XCircle className="h-4 w-4" />}
              >
                Decline
              </Button>
            </div>
          )}

          {request.status === 'APPROVED' && (
            <div className="mt-4 flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Approved</span>
            </div>
          )}

          {request.status === 'REJECTED' && (
            <div className="mt-4">
              <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                <span className="text-sm font-medium">Rejected</span>
              </div>
              {request.rejectionReason && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  Reason: {request.rejectionReason}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Requests: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'
  >('PENDING');

  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const status = statusFilter === 'ALL' ? undefined : statusFilter;
      const response = await requestsApi.getReceivedRequests(status);

      if (response.success && response.data) {
        setRequests(response.data);
      } else {
        setError('Failed to fetch requests');
      }
    } catch (err) {
      setError(errorMessage(err, 'Failed to fetch requests'));
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  // Fetch requests on mount and when the filter changes
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: number) => {
    try {
      setProcessingId(requestId);

      const response = await requestsApi.approveRequest(requestId);
      window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT));

      if (response.success) {
        toast.success(
          response.message || 'Request approved! User added to team.'
        );

        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: 'APPROVED' as const } : req
          )
        );
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to approve request'));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      setProcessingId(requestId);

      const response = await requestsApi.rejectRequest(requestId);
      window.dispatchEvent(new Event(REQUESTS_CHANGED_EVENT));

      if (response.success) {
        toast.success(response.message || 'Request rejected');

        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: 'REJECTED' as const } : req
          )
        );
      }
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to reject request'));
    } finally {
      setProcessingId(null);
    }
  };

  // Filter requests by search query
  const filteredRequests = requests.filter((request) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      request.requester.username.toLowerCase().includes(searchLower) ||
      displayName(request.requester).toLowerCase().includes(searchLower) ||
      request.projectTitle.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 dark:border-gray-600 dark:bg-brand-dark-light">
          <div className="flex flex-1 items-center gap-4">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden dark:text-gray-400 dark:hover:bg-brand-dark-lighter"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Desktop toggle button */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:block dark:text-gray-400 dark:hover:bg-brand-dark-lighter"
            >
              <Menu className="h-5 w-5" />
            </button>

            <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
              Requests
            </h1>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-4 text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <button className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brand-dark-lighter">
              <Bell className="h-5 w-5" />
            </button>
            <Button
              leftIcon={<PlusCircle className="h-5 w-5" />}
              className="hidden sm:flex"
              onClick={() => navigate('/post-idea')}
            >
              New Project
            </Button>
            <Button
              size="sm"
              className="sm:hidden"
              onClick={() => navigate('/post-idea')}
            >
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <div className="container mx-auto max-w-5xl px-4 py-8 bg-brand-light-dark dark:bg-brand-dark">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
            <h1 className="text-2xl md:text-3xl font-bold text-brand-dark dark:text-gray-100">
              Requests to join your projects
            </h1>

            {/* Status filter */}
            <div className="flex gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(
                (status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-brand-orange text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-brand-orange" />
              <span className="ml-3 text-gray-600 dark:text-gray-400">
                Loading requests...
              </span>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="rounded-lg bg-red-50 dark:bg-red-900/20 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-medium text-red-800 dark:text-red-300">
                  Error loading requests
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                  {error}
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  className="mt-3"
                  onClick={fetchRequests}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No requests found
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery
                  ? 'Try adjusting your search query'
                  : "You don't have any join requests at the moment"}
              </p>
            </div>
          )}

          {/* Requests list */}
          {!loading && !error && filteredRequests.length > 0 && (
            <div className="grid gap-6">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.id}
                  request={request}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  isProcessing={processingId === request.id}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Requests;
