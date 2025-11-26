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
  Menu,
  Check,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import Toggle from "../components/ui/Toggle";
import Sidebar from "../components/ui/SideBar";
import { useTheme } from "../context/ThemeContext";

const SettingsPage = () => {
  const navigate = useNavigate();
  const { themeColor, setThemeColor } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);
  const [openForTeamInvites, setOpenForTeamInvites] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const themeColors = [
    { name: "Orange", value: "orange", color: "#FFAC34" },
    { name: "Blue", value: "blue", color: "#3B82F6" },
    { name: "Purple", value: "purple", color: "#A855F7" },
    { name: "Green", value: "green", color: "#22C55E" },
  ] as const;

  const handleLogout = () => {
    navigate("/");
  };

  const handleDeleteAccount = () => {
    // Handle account deletion logic
  };

  const handleColorChange = (color: typeof themeColors[0]["value"]) => {
    setThemeColor(color);
  };

  return (
    <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
      <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
      
      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 dark:border-gray-600 dark:bg-brand-dark-light">
          <div className="flex items-center gap-4">
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
              Settings
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-brand-light-dark p-4 sm:p-8 dark:bg-brand-dark">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-6 md:grid-cols-4">
              {/* Settings Sidebar */}
              <div className="md:col-span-1">
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                  <h2 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100">
                    <Settings className="mr-3 h-5 w-5" />
                    Settings
                  </h2>

                  <nav className="space-y-2">
                    <button
                      onClick={() =>
                        document.getElementById("account")?.scrollIntoView()
                      }
                      className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <User className="mr-3 h-5 w-5" />
                      Account
                    </button>

                    <button
                      onClick={() =>
                        document.getElementById("notifications")?.scrollIntoView()
                      }
                      className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <Bell className="mr-3 h-5 w-5" />
                      Notifications
                    </button>

                    <button
                      onClick={() =>
                        document.getElementById("privacy")?.scrollIntoView()
                      }
                      className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <Shield className="mr-3 h-5 w-5" />
                      Privacy & Security
                    </button>

                    <button
                      onClick={() =>
                        document.getElementById("team")?.scrollIntoView()
                      }
                      className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
                    >
                      <TeamIcon className="mr-3 h-5 w-5" />
                      Team Preferences
                    </button>

                    <button
                      onClick={() =>
                        document.getElementById("appearance")?.scrollIntoView()
                      }
                      className="flex w-full items-center rounded-lg px-4 py-3 text-left text-brand-dark hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700"
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
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg"
                  >
                    <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100">
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
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg"
                  >
                    <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100">
                      <Bell className="mr-3 h-5 w-5" />
                      Notification Preferences
                    </h3>

                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-brand-dark dark:text-gray-100">
                            Enable Notifications
                          </h4>
                          <p className="text-sm text-brand-dark/60 dark:text-gray-300">
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
                          <h4 className="font-medium text-brand-dark dark:text-gray-100">
                            Email Notifications
                          </h4>
                          <p className="text-sm text-brand-dark/60 dark:text-gray-300">
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
                          <h4 className="font-medium text-brand-dark dark:text-gray-100">
                            Project Invitations
                          </h4>
                          <p className="text-sm text-brand-dark/60 dark:text-gray-300">
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
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg"
                  >
                    <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100">
                      <Shield className="mr-3 h-5 w-5" />
                      Privacy & Security
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-4 font-medium text-brand-dark dark:text-gray-100">
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
                        <h4 className="mb-4 font-medium text-brand-dark dark:text-gray-100">
                          Account Deletion
                        </h4>
                        <p className="mb-4 text-sm text-brand-dark/60 dark:text-gray-300">
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
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg"
                  >
                    <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100">
                      <TeamIcon className="mr-3 h-5 w-5" />
                      Team Preferences
                    </h3>

                    <div className="space-y-6">
                      <div>
                        <h4 className="mb-2 font-medium text-brand-dark dark:text-gray-100">
                          Looking For Team
                        </h4>
                        <p className="mb-4 text-sm text-brand-dark/60 dark:text-gray-300">
                          Enable this to show you're open to team invitations
                        </p>
                        <Toggle
                          enabled={openForTeamInvites}
                          setEnabled={setOpenForTeamInvites}
                        />
                      </div>

                      <div>
                        <h4 className="mb-2 font-medium text-brand-dark dark:text-gray-100">
                          Preferred Team Size
                        </h4>
                        <select className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100">
                          <option>2-4 members</option>
                          <option>5-7 members</option>
                          <option>8+ members</option>
                          <option>No preference</option>
                        </select>
                      </div>

                      <div>
                        <h4 className="mb-2 font-medium text-brand-dark dark:text-gray-100">
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
                          <button className="flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600">
                            + Add Interest
                          </button>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Appearance */}
                  <section
                    id="appearance"
                    className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg"
                  >
                    <h3 className="mb-6 flex items-center text-xl font-semibold text-brand-dark dark:text-gray-100">
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
                          <h4 className="font-medium text-brand-dark dark:text-gray-100">
                            Dark Mode
                          </h4>
                          <p className="text-sm text-brand-dark/60 dark:text-gray-300">
                            Switch between light and dark theme
                          </p>
                        </div>
                        <ThemeToggle />
                      </div>

                      <div>
                        <h4 className="mb-4 font-medium text-brand-dark dark:text-gray-100">
                          Theme Color
                        </h4>
                        <p className="mb-4 text-sm text-brand-dark/60 dark:text-gray-300">
                          Choose your preferred accent color for the interface
                        </p>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          {themeColors.map((color) => (
                            <button
                              key={color.value}
                              onClick={() => handleColorChange(color.value)}
                              className={`relative flex items-center justify-center rounded-lg border-2 p-4 transition-all hover:scale-105 ${
                                themeColor === color.value
                                  ? "border-gray-400 dark:border-gray-500"
                                  : "border-gray-200 dark:border-gray-600"
                              }`}
                            >
                              <div
                                className="h-8 w-8 rounded-full shadow-md"
                                style={{ backgroundColor: color.color }}
                              />
                              {themeColor === color.value && (
                                <div className="absolute -top-1 -right-1 rounded-full bg-green-500 p-1">
                                  <Check className="h-3 w-3 text-white" />
                                </div>
                              )}
                              <span className="mt-2 text-xs font-medium text-brand-dark dark:text-gray-100">
                                {color.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;