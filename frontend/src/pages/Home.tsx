import React from "react";
import { Search, Bell, PlusCircle, Users, History } from "lucide-react";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";

const projectCards = [
  {
    title: "Collaborative Task Management App",
    description:
      "A web-based task management application that allows teams to collaborate in real-time, assign tasks, set deadlines, and track progress with an intuitive interface and notifications.",
    teamSize: "3-5",
    duration: "3 months",
    techStack: ["React", "Node.js", "MongoDB"],
    tags: ["Web Development", "Full Stack", "Open Source"],
    author: "Rohit Sharma",
  },
  {
    title: "AI-Powered Personal Finance Tracker",
    description:
      "An intelligent finance tracking app that uses AI to analyze spending habits, provide budgeting advice, and forecast future expenses to help users manage their money better.",
    teamSize: "2-4",
    duration: "4 months",
    techStack: ["Python", "Django", "PostgreSQL"],
    tags: ["AI", "Finance", "Data Science"],
    author: "Priya Singh",
  },
  {
    title: "Smart Home Automation Dashboard",
    description:
      "A centralized dashboard to control and monitor smart home devices, featuring customizable scenes, voice command integration, and energy usage analytics.",
    teamSize: "4-6",
    duration: "5 months",
    techStack: ["Angular", "Node.js", "Firebase"],
    tags: ["IoT", "Home Automation", "Full Stack"],
    author: "Ankit Verma",
  },
  {
    title: "E-Learning Platform with Gamification",
    description:
      "An interactive e-learning platform that incorporates gamification elements like badges, leaderboards, and quizzes to enhance student engagement and motivation.",
    teamSize: "3-5",
    duration: "6 months",
    techStack: ["Vue.js", "Laravel", "MySQL"],
    tags: ["Education", "Web Development", "Gamification"],
    author: "Sneha Patel",
  },
  {
    title: "Real-Time Language Translation Chat App",
    description:
      "A chat application that provides real-time language translation to facilitate seamless communication between users speaking different languages.",
    teamSize: "3-4",
    duration: "4 months",
    techStack: ["React Native", "Node.js", "Google Cloud Translation API"],
    tags: ["Mobile App", "Communication", "AI"],
    author: "Arjun Rao",
  },
  // Repeat for other cards...
];

const Home: React.FC = () => {
  return (
    <div className="flex h-screen bg-brand-light/30 dark:bg-brand-dark/95">
      <Sidebar />

      <div className="flex-1 overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-brand-dark/10 bg-white px-8 dark:border-brand-light/10 dark:bg-brand-dark/80">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-xl font-semibold text-brand-dark dark:text-brand-light">
              Explore
            </h1>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-dark/40 dark:text-brand-light/40" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full rounded-lg border border-brand-dark/10 bg-transparent py-2 pl-10 pr-4 text-brand-dark placeholder-brand-dark/40 focus:border-brand-orange focus:outline-none focus:ring-1 focus:ring-brand-orange dark:border-brand-light/10 dark:text-brand-light dark:placeholder-brand-light/40"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
            <button className="rounded-lg p-2 text-brand-dark/60 hover:bg-brand-light/50 dark:text-brand-light/60 dark:hover:bg-brand-dark/50">
              <Bell className="h-5 w-5" />
            </button>
            <Button leftIcon={<PlusCircle className="h-5 w-5" />}>
              Post an Idea
            </Button>
          </div>
        </header>

        <main className="h-[calc(100vh-4rem)] overflow-y-auto p-8">
          <div className="grid gap-6">
            {projectCards.map((card, index) => (
              <div
                key={index}
                className="rounded-lg border border-brand-dark/10 bg-white p-6 transition-all hover:border-brand-orange dark:border-brand-light/10 dark:bg-brand-dark/80"
              >
                <div className="flex items-start gap-6">
                  <div className="h-24 w-24 rounded-lg bg-brand-light/50 dark:bg-brand-dark/50" />
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-medium text-brand-dark dark:text-brand-light">
                        {card.title}
                      </h3>
                      <span className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                        {card.author}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-brand-dark/60 dark:text-brand-light/60">
                      {card.description}
                    </p>
                    <div className="mt-4 flex items-center gap-6">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-brand-dark/40 dark:text-brand-light/40" />
                        <span className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                          Team Size: {card.teamSize}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <History className="h-4 w-4 text-brand-dark/40 dark:text-brand-light/40" />
                        <span className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                          Duration: {card.duration}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {card.techStack.map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow"
                        >
                          {tech}
                        </span>
                      ))}
                      {card.tags.map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="rounded bg-brand-light/50 px-2 py-1 text-xs font-medium text-brand-dark/60 dark:bg-brand-dark/50 dark:text-brand-light/60"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Home;
