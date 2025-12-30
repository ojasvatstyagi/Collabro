import React, { useState, useEffect } from "react";
import {
  User,
  Bell,
  Moon,
  Sun,
  Users as TeamIcon,
  Menu,
  Check,
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import Toggle from "../components/ui/Toggle";
import Sidebar from "../components/ui/SideBar";
import { useTheme } from "../context/ThemeContext";
import { profileApi, ProfileData } from "../services/api/profile";

const SettingsPage = () => {
  const { themeColor, setThemeColor, theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [projectNotifications, setProjectNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);

  const [openForTeamInvites, setOpenForTeamInvites] = useState(false);
  const [preferredTeamSize, setPreferredTeamSize] = useState("No preference");
  const [projectInterests, setProjectInterests] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("account");

  const themeColors = [
    { name: "Orange", value: "orange", color: "#FFAC34" },
    { name: "Blue", value: "blue", color: "#3B82F6" },
    { name: "Purple", value: "purple", color: "#A855F7" },
    { name: "Green", value: "green", color: "#22C55E" },
  ] as const;

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
        if (p.projectInterests) setProjectInterests(p.projectInterests);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateBackend = async (updates: any) => {
    if (!profileData) return;

    const payload = {
      firstname: profileData.firstname,
      lastname: profileData.lastname,
      bio: profileData.bio || "",
      education: profileData.education || "",
      location: profileData.location || "",
      phone: profileData.phone || "",
      ...updates,
    };

    try {
      setIsSaving(true);
      const res = await profileApi.updateProfile(payload);
      if (res.data) setProfileData(res.data);
    } catch (err) {
      console.error("Failed to update settings", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    alert("Account deletion is not yet implemented.");
  };

  const handleColorChange = (color: (typeof themeColors)[number]["value"]) => {
    setThemeColor(color);
  };

  const scrollToSection = (id: string) => {
    setActiveTab(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-brand-light-dark to-gray-100 dark:from-brand-dark dark:to-black">
      <Sidebar
        isCollapsed={sidebarCollapsed}
        setIsCollapsed={setSidebarCollapsed}
      />

      <div className="flex-1 overflow-y-auto">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-4 md:px-8 dark:border-gray-600 dark:bg-brand-dark-light">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:block dark:text-gray-400 dark:hover:bg-brand-dark-lighter"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold tracking-tight text-brand-dark dark:text-gray-100">
              Settings
            </h1>
          </div>
          <ThemeToggle />
        </header>

        {/* Floating Top Navigation */}
        <div className="sticky top-20 z-20 mx-auto mt-6 max-w-6xl px-4 sm:px-8">
          <div className="rounded-2xl bg-white/80 backdrop-blur shadow-lg ring-1 ring-gray-200 dark:bg-brand-dark/80 dark:ring-gray-700">
            <nav className="flex items-center gap-8 px-6">
              {[
                { id: "account", label: "Account", icon: User },
                { id: "notifications", label: "Notifications", icon: Bell },
                { id: "team", label: "Team", icon: TeamIcon },
                {
                  id: "appearance",
                  label: "Appearance",
                  icon: theme === "dark" ? Sun : Moon,
                },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => scrollToSection(id)}
                  className={`relative flex items-center gap-2 py-4 text-sm font-medium transition-all ${
                    activeTab === id
                      ? "text-brand-orange"
                      : "text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
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
              <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold">
                <User className="h-5 w-5 text-brand-orange" />
                Account & Security
              </h2>

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Username"
                  value={profileData?.username || ""}
                  disabled
                />
                <Input
                  label="Email"
                  value={profileData?.email || ""}
                  disabled
                />
              </div>

              <div className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/10">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-700 dark:text-red-300">
                      Delete Account
                    </p>
                    <p className="text-sm text-red-600 dark:text-red-400">
                      This action is permanent.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800"
                    onClick={handleDeleteAccount}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </section>

            {/* Notifications */}
            <section
              id="notifications"
              className="scroll-mt-28 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-200 dark:bg-brand-dark-lighter dark:ring-gray-700"
            >
              <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold">
                <Bell className="h-5 w-5 text-brand-orange" />
                Notifications
              </h2>

              {[
                {
                  title: "Enable Notifications",
                  desc: "Receive notifications for team activities",
                  value: notificationsEnabled,
                  setter: setNotificationsEnabled,
                  key: "notificationsEnabled",
                },
                {
                  title: "Email Notifications",
                  desc: "Get important updates via email",
                  value: emailNotifications,
                  setter: setEmailNotifications,
                  key: "emailNotifications",
                },
                {
                  title: "Project Invitations",
                  desc: "Notify when invited to projects",
                  value: projectNotifications,
                  setter: setProjectNotifications,
                  key: "projectNotifications",
                },
              ].map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium">{item.title}</p>
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
              <h2 className="mb-6 flex items-center gap-3 text-lg font-semibold">
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
                className="mt-4 w-full rounded-xl border border-gray-300 px-4 py-2 dark:border-gray-600 dark:bg-brand-dark-lighter"
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
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 text-brand-orange" />
                ) : (
                  <Moon className="h-5 w-5 text-brand-orange" />
                )}
                Appearance
              </h2>

              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {themeColors.map((color) => (
                  <button
                    key={color.value}
                    onClick={() => handleColorChange(color.value)}
                    className={`relative rounded-xl p-4 ring-1 transition hover:scale-105 ${
                      themeColor === color.value
                        ? "ring-brand-orange"
                        : "ring-gray-200 dark:ring-gray-600"
                    }`}
                  >
                    <div
                      className="mx-auto h-8 w-8 rounded-full"
                      style={{ backgroundColor: color.color }}
                    />
                    {themeColor === color.value && (
                      <Check className="absolute top-2 right-2 h-4 w-4 text-green-500" />
                    )}
                    <p className="mt-2 text-xs font-medium text-center">
                      {color.name}
                    </p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
};

export default SettingsPage;
