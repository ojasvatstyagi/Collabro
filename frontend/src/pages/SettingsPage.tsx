import { useState, useEffect } from 'react';
import { User, Bell, Moon, Sun, Users as TeamIcon, Check } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Toggle from '../components/ui/Toggle';
import DashboardLayout from '../components/layout/DashboardLayout';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { profileApi, ProfileData } from '../services/api/profile';
import { authApi } from '../services/api/auth';
import { toast } from 'react-hot-toast';
import { errorMessage } from '../utils/errors';
import { useNavigate } from 'react-router-dom';
import { themeColors } from '../utils/helper';

const SettingsPage = () => {
  const { themeColor, setThemeColor, theme } = useTheme();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    current: '',
    next: '',
    confirm: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {}
  );
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [openForTeamInvites, setOpenForTeamInvites] = useState(false);
  const [preferredTeamSize, setPreferredTeamSize] = useState('No preference');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  const [profileData, setProfileData] = useState<ProfileData | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const response = await profileApi.getProfile();
      if (response.data) {
        const p = response.data;
        setProfileData(p);
        if (p.notificationsEnabled !== undefined)
          setNotificationsEnabled(p.notificationsEnabled);
        if (p.emailNotifications !== undefined)
          setEmailNotifications(p.emailNotifications);
        if (p.projectNotifications !== undefined)
          setProjectNotifications(p.projectNotifications);
        if (p.openForTeamInvites !== undefined)
          setOpenForTeamInvites(p.openForTeamInvites);
        if (p.preferredTeamSize) setPreferredTeamSize(p.preferredTeamSize);
      }
    } catch (error) {
      toast.error(errorMessage(error, 'Could not load your settings'));
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackend = async (updates: Record<string, unknown>) => {
    if (!profileData) return;

    const payload = {
      firstname: profileData.firstname,
      lastname: profileData.lastname,
      bio: profileData.bio || '',
      education: profileData.education || '',
      location: profileData.location || '',
      phone: profileData.phone || '',
      ...updates,
    };

    try {
      setIsSaving(true);
      const res = await profileApi.updateProfile(payload);
      if (res.data) setProfileData(res.data);
    } catch (err) {
      toast.error(errorMessage(err, 'Could not save your settings'));
      // The toggles update optimistically, so put them back to what the server has
      await loadSettings();
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};
    if (!passwordForm.current) errors.current = 'Enter your current password';
    if (passwordForm.next.length < 6)
      errors.next = 'Use at least 6 characters';
    else if (passwordForm.next === passwordForm.current)
      errors.next = 'Choose a password different from the current one';
    if (passwordForm.confirm !== passwordForm.next)
      errors.confirm = 'The passwords do not match';
    setPasswordErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsChangingPassword(true);
    try {
      await authApi.changePassword({
        currentPassword: passwordForm.current,
        newPassword: passwordForm.next,
      });
      setPasswordForm({ current: '', next: '', confirm: '' });
      toast.success('Password changed. Your other sessions were signed out.');
    } catch (error) {
      // A wrong current password comes back as a 400 with its own message
      setPasswordErrors({
        current: errorMessage(error, 'Could not change your password'),
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const closeDeleteConfirm = () => {
    setShowDeleteConfirm(false);
    setDeletePassword('');
    setDeleteError(null);
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setDeleteError('Enter your password to confirm');
      return;
    }
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await profileApi.deleteAccount(deletePassword);
      // The account is gone: end the session (token and user state) and leave
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      setDeleteError(errorMessage(error, 'Could not delete your account'));
      setIsDeleting(false);
    }
  };

  const handleColorChange = (color: (typeof themeColors)[number]['value']) => {
    setThemeColor(color);
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Settings">
        <p className="p-8 text-gray-600 dark:text-gray-300">
          Loading settings...
        </p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Settings">
      {/* Floating Top Navigation */}
      <div className="sticky top-20 z-20 mx-auto mt-6 max-w-6xl px-4 sm:px-8">
        <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-gray-200 dark:bg-brand-dark/80 dark:ring-gray-700">
          <nav className="flex items-center gap-8 px-6 overflow-x-auto no-scrollbar">
            {[
              { id: 'account', label: 'Account', icon: User },
              { id: 'notifications', label: 'Notifications', icon: Bell },
              { id: 'team', label: 'Team', icon: TeamIcon },
              {
                id: 'appearance',
                label: 'Appearance',
                icon: theme === 'dark' ? Sun : Moon,
              },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => scrollToSection(id)}
                className={`relative flex items-center gap-2 py-4 text-sm font-medium transition-all ${
                  activeTab === id
                    ? 'text-brand-orange'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="h-4 w-4" />

                {label}

                {/* Active underline */}
                {activeTab === id && (
                  <span className="absolute left-0 right-0 -bottom-1 mx-auto h-0.5 w-full rounded-full bg-brand-orange" />
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="px-4 py-8 sm:px-8">
        <div className="mx-auto max-w-4xl space-y-10">
          {/* Account */}
          <section
            id="account"
            className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-brand-dark-lighter dark:ring-gray-700"
          >
            <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <User className="h-5 w-5 text-brand-orange" />
              Account & Security
            </h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Username"
                value={profileData?.username || ''}
                disabled
              />
              <Input label="Email" value={profileData?.email || ''} disabled />
            </div>

            <form
              onSubmit={handleChangePassword}
              className="mt-8 space-y-4 rounded-xl border border-gray-200 p-4 dark:border-gray-700"
            >
              <p className="font-medium text-gray-900 dark:text-gray-100">
                Change password
              </p>
              <div className="grid gap-4 md:grid-cols-3">
                <Input
                  label="Current password"
                  type="password"
                  autoComplete="current-password"
                  value={passwordForm.current}
                  error={passwordErrors.current}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, current: e.target.value })
                  }
                />
                <Input
                  label="New password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.next}
                  error={passwordErrors.next}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, next: e.target.value })
                  }
                />
                <Input
                  label="Confirm new password"
                  type="password"
                  autoComplete="new-password"
                  value={passwordForm.confirm}
                  error={passwordErrors.confirm}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirm: e.target.value })
                  }
                />
              </div>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? 'Changing...' : 'Change password'}
              </Button>
            </form>

            <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium text-red-700 dark:text-red-300">
                    Delete Account
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400">
                    This action is permanent and cannot be undone.
                  </p>
                </div>
                {showDeleteConfirm ? (
                  <div className="flex w-full flex-col gap-2 sm:w-80">
                    <Input
                      label="Enter your password to confirm"
                      type="password"
                      autoComplete="current-password"
                      value={deletePassword}
                      error={deleteError ?? undefined}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        className="border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-transparent dark:text-gray-300"
                        onClick={closeDeleteConfirm}
                        disabled={isDeleting}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
                        onClick={handleDeleteAccount}
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    Delete
                  </Button>
                )}
              </div>
            </div>
          </section>

          {/* Notifications */}
          <section
            id="notifications"
            className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-brand-dark-lighter dark:ring-gray-700"
          >
            <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <Bell className="h-5 w-5 text-brand-orange" />
              Notifications
              {isSaving && (
                <span className="text-xs font-normal text-gray-500 dark:text-gray-400">
                  Saving...
                </span>
              )}
            </h2>

            {[
              {
                title: 'Enable Notifications',
                desc: 'Receive notifications for team activities',
                value: notificationsEnabled,
                setter: setNotificationsEnabled,
                key: 'notificationsEnabled',
              },
              {
                title: 'Email Notifications',
                desc: 'Get important updates via email',
                value: emailNotifications,
                setter: setEmailNotifications,
                key: 'emailNotifications',
              },
              {
                title: 'Project Invitations',
                desc: 'Notify when invited to projects',
                value: projectNotifications,
                setter: setProjectNotifications,
                key: 'projectNotifications',
              },
            ].map((item) => (
              <div
                key={item.key}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-200">
                    {item.title}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {item.desc}
                  </p>
                </div>
                <Toggle
                  enabled={item.value}
                  setEnabled={(val) => {
                    item.setter(val);
                    updateBackend({ [item.key]: val });
                  }}
                />
              </div>
            ))}
          </section>

          {/* Team */}
          <section
            id="team"
            className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-brand-dark-lighter dark:ring-gray-700"
          >
            <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold text-gray-900 dark:text-gray-100">
              <TeamIcon className="h-5 w-5 text-brand-orange" />
              Team Preferences
            </h2>

            <Toggle
              enabled={openForTeamInvites}
              setEnabled={(val) => {
                setOpenForTeamInvites(val);
                updateBackend({ openForTeamInvites: val });
              }}
            />

            <select
              className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
              value={preferredTeamSize}
              onChange={(e) => {
                setPreferredTeamSize(e.target.value);
                updateBackend({ preferredTeamSize: e.target.value });
              }}
            >
              <option>2-4 members</option>
              <option>5-7 members</option>
              <option>8+ members</option>
              <option>No preference</option>
            </select>
          </section>

          {/* Appearance */}
          <section
            id="appearance"
            className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-brand-dark-lighter dark:ring-gray-700"
          >
            <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold">
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 text-brand-orange" />
              ) : (
                <Moon className="h-5 w-5 text-brand-orange" />
              )}
              <span className="text-gray-900 dark:text-gray-100">
                Appearance
              </span>
            </h2>

            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {themeColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  className={`relative rounded-xl p-4 ring-1 transition hover:scale-105 ${
                    themeColor === color.value
                      ? 'ring-brand-orange'
                      : 'ring-gray-200 dark:ring-gray-600'
                  }`}
                >
                  <div
                    className="mx-auto h-8 w-8 rounded-full"
                    style={{ backgroundColor: color.color }}
                  />
                  {themeColor === color.value && (
                    <Check className="absolute top-2 right-2 h-4 w-4 text-green-500" />
                  )}
                  <p className="mt-2 text-xs font-medium text-center text-gray-900 dark:text-gray-200">
                    {color.name}
                  </p>
                </button>
              ))}
            </div>
          </section>
        </div>
      </main>
    </DashboardLayout>
  );
};

export default SettingsPage;
