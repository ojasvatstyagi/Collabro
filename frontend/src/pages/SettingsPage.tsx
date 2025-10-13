import React, { useState } from "react";
import {
  Settings,
  User,
  Bell,
  Moon,
  Sun,
  LogOut,
  Shield,
  Users as TeamIcon,
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import Toggle from "../components/ui/Toggle";
const SettingsPage = () => {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);
  const [openForTeamInvites, setOpenForTeamInvites] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleLogout = () => {
    // Handle logout logic
    navigate("/");
  };

  const handleDeleteAccount = () => {
    // Handle account deletion logic
  };

  return (
    <div className="min-h-screen bg-brand-light/30 p-4 sm:p-8 dark:bg-brand-dark/95 bg-white shadow-lg transition-all hover:shadow-xl dark:shadow-md dark:shadow-brand-light/5 hover:dark:shadow-brand-light/10">
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-6 md:grid-cols-4">
          {/* Settings Sidebar */}
          <div className="md:col-span-1">
            <button
              onClick={() => navigate("/explore")}
              className="mb-4 flex w-full items-center justify-center rounded-lg bg-brand-light/50 py-2 text-brand-dark/60 hover:bg-brand-light/70 hover:text-brand-dark dark:bg-brand-dark/50 dark:text-brand-light/60 dark:hover:bg-brand-dark/70 dark:hover:text-brand-light"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Back to Explore
            </button>
            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-brand-dark/80">
              <h2 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-brand-light">
                <Settings className="mr-3 h-5 w-5" />
                Settings
              </h2>

              <nav className="space-y-2">
                <button
                  onClick={() =>
                    document.getElementById("account")?.scrollIntoView()
                  }
                  className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-brand-light/30 dark:text-brand-light dark:hover:bg-brand-dark/50"
                >
                  <User className="mr-3 h-5 w-5" />
                  Account
                </button>

                <button
                  onClick={() =>
                    document.getElementById("notifications")?.scrollIntoView()
                  }
                  className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-brand-light/30 dark:text-brand-light dark:hover:bg-brand-dark/50"
                >
                  <Bell className="mr-3 h-5 w-5" />
                  Notifications
                </button>

                <button
                  onClick={() =>
                    document.getElementById("privacy")?.scrollIntoView()
                  }
                  className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-brand-light/30 dark:text-brand-light dark:hover:bg-brand-dark/50"
                >
                  <Shield className="mr-3 h-5 w-5" />
                  Privacy & Security
                </button>

                <button
                  onClick={() =>
                    document.getElementById("team")?.scrollIntoView()
                  }
                  className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-brand-light/30 dark:text-brand-light dark:hover:bg-brand-dark/50"
                >
                  <TeamIcon className="mr-3 h-5 w-5" />
                  Team Preferences
                </button>

                <button
                  onClick={() =>
                    document.getElementById("appearance")?.scrollIntoView()
                  }
                  className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-brand-light/30 dark:text-brand-light dark:hover:bg-brand-dark/50"
                >
                  {darkMode ? (
                    <Sun className="mr-3 h-5 w-5" />
                  ) : (
                    <Moon className="mr-3 h-5 w-5" />
                  )}
                  Appearance
                </button>
              </nav>
            </div>
          </div>

          {/* Main Settings Content */}
          <div className="md:col-span-3">
            <div className="space-y-6">
              {/* Account Settings */}
              <section
                id="account"
                className="rounded-xl bg-white p-6 shadow-lg dark:bg-brand-dark/80"
              >
                <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-brand-light">
                  <User className="mr-3 h-5 w-5" />
                  Account Settings
                </h3>

                <div className="space-y-4">
                  <Input label="Username" value="johndoe" disabled />

                  <Input label="Email" value="john.doe@example.com" />

                  <div className="pt-2">
                    <Button variant="outline">Update Email</Button>
                  </div>
                </div>
              </section>

              {/* Notification Settings */}
              <section
                id="notifications"
                className="rounded-xl bg-white p-6 shadow-lg dark:bg-brand-dark/80"
              >
                <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-brand-light">
                  <Bell className="mr-3 h-5 w-5" />
                  Notification Preferences
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-brand-dark dark:text-brand-light">
                        Enable Notifications
                      </h4>
                      <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                        Receive notifications for team activities
                      </p>
                    </div>
                    <Toggle
                      enabled={notificationsEnabled}
                      setEnabled={setNotificationsEnabled}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-brand-dark dark:text-brand-light">
                        Email Notifications
                      </h4>
                      <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                        Get important updates via email
                      </p>
                    </div>
                    <Toggle
                      enabled={emailNotifications}
                      setEnabled={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-brand-dark dark:text-brand-light">
                        Project Invitations
                      </h4>
                      <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                        Notify when invited to new projects
                      </p>
                    </div>
                    <Toggle
                      enabled={projectNotifications}
                      setEnabled={setProjectNotifications}
                    />
                  </div>
                </div>
              </section>

              {/* Privacy & Security */}
              <section
                id="privacy"
                className="rounded-xl bg-white p-6 shadow-lg dark:bg-brand-dark/80"
              >
                <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-brand-light">
                  <Shield className="mr-3 h-5 w-5" />
                  Privacy & Security
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-4 font-medium text-brand-dark dark:text-brand-light">
                      Change Password
                    </h4>
                    <div className="space-y-4">
                      <Input
                        label="Current Password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                      <Input
                        label="New Password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                      <Button>Update Password</Button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <h4 className="mb-4 font-medium text-brand-dark dark:text-brand-light">
                      Account Deletion
                    </h4>
                    <p className="mb-4 text-sm text-brand-dark/60 dark:text-brand-light/60">
                      Deleting your account will remove all your data from our
                      servers. This action cannot be undone.
                    </p>
                    <Button variant="outline" onClick={handleDeleteAccount}>
                      Delete Account
                    </Button>
                  </div>
                </div>
              </section>

              {/* Team Preferences */}
              <section
                id="team"
                className="rounded-xl bg-white p-6 shadow-lg dark:bg-brand-dark/80"
              >
                <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-brand-light">
                  <TeamIcon className="mr-3 h-5 w-5" />
                  Team Preferences
                </h3>

                <div className="space-y-6">
                  <div>
                    <h4 className="mb-2 font-medium text-brand-dark dark:text-brand-light">
                      Looking For Team
                    </h4>
                    <p className="mb-4 text-sm text-brand-dark/60 dark:text-brand-light/60">
                      Enable this to show you're open to team invitations
                    </p>
                    <Toggle
                      enabled={openForTeamInvites}
                      setEnabled={setOpenForTeamInvites}
                    />
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-brand-dark dark:text-brand-light">
                      Preferred Team Size
                    </h4>
                    <select className="w-full rounded-lg border border-brand-dark/10 bg-transparent px-4 py-2 text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-brand-light/10 dark:text-brand-light">
                      <option>2-4 members</option>
                      <option>5-7 members</option>
                      <option>8+ members</option>
                      <option>No preference</option>
                    </select>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-brand-dark dark:text-brand-light">
                      Project Interests
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow">
                        Web Development
                      </span>
                      <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow">
                        Mobile Apps
                      </span>
                      <span className="rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow">
                        AI/ML
                      </span>
                      <button className="flex items-center rounded-full bg-brand-light/50 px-3 py-1 text-xs font-medium text-brand-dark/60 hover:bg-brand-light/70 dark:bg-brand-dark/50 dark:text-brand-light/60 dark:hover:bg-brand-dark/70">
                        + Add Interest
                      </button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Appearance */}
              <section
                id="appearance"
                className="rounded-xl bg-white p-6 shadow-lg dark:bg-brand-dark/80"
              >
                <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-brand-light">
                  {darkMode ? (
                    <Sun className="mr-3 h-5 w-5" />
                  ) : (
                    <Moon className="mr-3 h-5 w-5" />
                  )}
                  Appearance
                </h3>

                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-brand-dark dark:text-brand-light">
                        Dark Mode
                      </h4>
                      <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                        Switch between light and dark theme
                      </p>
                    </div>
                    <ThemeToggle />
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium text-brand-dark dark:text-brand-light">
                      Theme Color
                    </h4>
                    <div className="flex gap-3">
                      <button className="h-10 w-10 rounded-full bg-brand-orange"></button>
                      <button className="h-10 w-10 rounded-full bg-blue-500"></button>
                      <button className="h-10 w-10 rounded-full bg-purple-500"></button>
                      <button className="h-10 w-10 rounded-full bg-green-500"></button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Logout Button */}
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="flex items-center"
                >
                  <LogOut className="mr-2 h-5 w-5" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
