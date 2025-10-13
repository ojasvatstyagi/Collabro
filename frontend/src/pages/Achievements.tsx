import React, { useState } from "react";
import {
  ClipboardList,
  Award,
  Users,
  Clock,
  Download,
  Shield,
  Info,
} from "lucide-react";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import { cn } from "../utils/cn";

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  dateEarned: string;
  category: "projects" | "badges" | "collaborations" | "time";
}

const mockAchievements: Achievement[] = [
  {
    id: "1",
    name: "First Project",
    description: "Successfully completed your first project",
    icon: "/badges/first-project.png",
    dateEarned: "2024-03-15",
    category: "projects",
  },
  {
    id: "2",
    name: "Team Player",
    description: "Collaborated with 5 different teams",
    icon: "/badges/team-player.png",
    dateEarned: "2024-03-10",
    category: "collaborations",
  },
  {
    id: "3",
    name: "Early Adopter",
    description: "Joined during the platform's first month",
    icon: "/badges/early-adopter.png",
    dateEarned: "2024-02-01",
    category: "badges",
  },
  // Add more achievements as needed
];

const stats = [
  {
    title: "Projects Completed",
    value: "05",
    icon: ClipboardList,
    color:
      "bg-brand-orange/10 text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow",
  },
  {
    title: "Badges Earned",
    value: "12",
    icon: Award,
    color:
      "bg-brand-blue/10 text-brand-blue dark:bg-brand-lightBlue/10 dark:text-brand-lightBlue",
  },
  {
    title: "Collaborations Achieved",
    value: "08",
    icon: Users,
    color:
      "bg-brand-red/10 text-brand-red dark:bg-brand-orange/10 dark:text-brand-orange",
  },
  {
    title: "Time Contributed",
    value: "120h",
    icon: Clock,
    color:
      "bg-green-100 text-green-600 dark:bg-green-900/10 dark:text-green-400",
  },
];

const Achievements: React.FC = () => {
  const [selectedBadge, setSelectedBadge] = useState<Achievement | null>(null);

  return (
    <div className="flex h-screen bg-brand-light/30 dark:bg-brand-dark/95">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <div className="container mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-brand-dark dark:text-brand-light">
            Achievements
          </h1>

          {/* Stats Grid */}
          <div className="mb-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-xl bg-white p-6 shadow-md transition-all hover:shadow-lg dark:bg-brand-dark/80"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                      {stat.title}
                    </p>
                    <p className="mt-2 text-3xl font-bold text-brand-dark dark:text-brand-light">
                      {stat.value}
                    </p>
                  </div>
                  <div className={cn("rounded-full p-3", stat.color)}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Badges Grid */}
            <div className="lg:col-span-2">
              <h2 className="mb-6 text-xl font-semibold text-brand-dark dark:text-brand-light">
                Your Badges
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {mockAchievements.map((achievement) => (
                  <button
                    key={achievement.id}
                    onClick={() => setSelectedBadge(achievement)}
                    className={cn(
                      "rounded-lg bg-white p-4 text-left shadow-md transition-all hover:shadow-lg dark:bg-brand-dark/80",
                      selectedBadge?.id === achievement.id &&
                        "ring-2 ring-brand-orange dark:ring-brand-yellow"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-orange/10 dark:bg-brand-yellow/10">
                        <Shield className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
                      </div>
                      <div>
                        <h3 className="font-medium text-brand-dark dark:text-brand-light">
                          {achievement.name}
                        </h3>
                        <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                          {new Date(
                            achievement.dateEarned
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Badge Details */}
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-brand-dark/80">
              <h2 className="mb-6 text-xl font-semibold text-brand-dark dark:text-brand-light">
                Badge Details
              </h2>

              {selectedBadge ? (
                <div className="space-y-6">
                  <div className="flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full bg-brand-orange/10 dark:bg-brand-yellow/10">
                      <Shield className="h-12 w-12 text-brand-orange dark:text-brand-yellow" />
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-lg font-medium text-brand-dark dark:text-brand-light">
                      {selectedBadge.name}
                    </h3>
                    <p className="mt-2 text-sm text-brand-dark/60 dark:text-brand-light/60">
                      {selectedBadge.description}
                    </p>
                    <p className="mt-4 text-sm text-brand-dark/60 dark:text-brand-light/60">
                      Earned on:{" "}
                      {new Date(selectedBadge.dateEarned).toLocaleDateString()}
                    </p>
                  </div>

                  <Button
                    className="w-full"
                    leftIcon={<Download className="h-4 w-4" />}
                  >
                    Download Badge
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center space-y-4 py-12 text-center">
                  <Info className="h-12 w-12 text-brand-dark/20 dark:text-brand-light/20" />
                  <p className="text-brand-dark/60 dark:text-brand-light/60">
                    Select a badge to view its details
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Achievements;
