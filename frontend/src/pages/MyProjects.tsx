import React from "react";
import { Users, ChevronRight, Search, Bell, PlusCircle } from "lucide-react";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";

interface Project {
  id: string;
  title: string;
  description: string;
  teamSize: string;
  status: "ongoing" | "completed";
  thumbnail: string;
  techStack: string[];
}

const mockProjects: Project[] = [
  {
    id: "1",
    title: "Modern E-commerce Platform",
    description:
      "A full-stack e-commerce solution with real-time inventory management",
    teamSize: "4",
    status: "ongoing",
    thumbnail:
      "https://images.pexels.com/photos/39284/macbook-apple-imac-computer-39284.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    techStack: ["React", "Node.js", "PostgreSQL"],
  },
  {
    id: "2",
    title: "AI-Powered Analytics Dashboard",
    description: "Data visualization platform with machine learning insights",
    teamSize: "5",
    status: "ongoing",
    thumbnail:
      "https://images.pexels.com/photos/265087/pexels-photo-265087.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    techStack: ["Python", "React", "TensorFlow"],
  },
  {
    id: "3",
    title: "Mobile Fitness App",
    description: "Cross-platform fitness tracking application",
    teamSize: "3",
    status: "ongoing",
    thumbnail:
      "https://images.pexels.com/photos/1749303/pexels-photo-1749303.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    techStack: ["React Native", "Firebase"],
  },
  {
    id: "4",
    title: "Social Media Analytics Tool",
    description: "Analytics platform for social media performance tracking",
    teamSize: "4",
    status: "completed",
    thumbnail:
      "https://images.pexels.com/photos/533446/pexels-photo-533446.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    techStack: ["Vue.js", "Django", "PostgreSQL"],
  },
  {
    id: "5",
    title: "Project Management System",
    description: "Collaborative project management platform",
    teamSize: "6",
    status: "completed",
    thumbnail:
      "https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    techStack: ["React", "Express", "MongoDB"],
  },
  {
    id: "6",
    title: "Real-time Chat Application",
    description: "Instant messaging platform with video calls",
    teamSize: "3",
    status: "completed",
    thumbnail:
      "https://images.pexels.com/photos/3182812/pexels-photo-3182812.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
    techStack: ["React", "Socket.io", "WebRTC"],
  },
];

const ProjectCard: React.FC<{ project: Project }> = ({ project }) => {
  const isOngoing = project.status === "ongoing";

  return (
    <div className="group relative overflow-hidden rounded-lg bg-white shadow-lg transition-all hover:shadow-xl dark:bg-brand-dark/80 dark:shadow-md dark:shadow-brand-light/5 hover:dark:shadow-brand-light/10">
      <div className="relative h-48 overflow-hidden">
        <img
          src={project.thumbnail}
          alt={project.title}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <h3 className="absolute bottom-4 left-4 right-4 text-lg font-semibold text-white">
          {project.title}
        </h3>
      </div>

      <div className="p-4">
        <p className="mb-4 text-sm text-brand-dark/60 dark:text-brand-light/60">
          {project.description}
        </p>

        <div className="mb-4 flex items-center gap-2">
          <Users className="h-4 w-4 text-brand-dark/40 dark:text-brand-light/40" />
          <span className="text-sm text-brand-dark/60 dark:text-brand-light/60">
            Team Size: {project.teamSize}
          </span>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {project.techStack.map((tech, index) => (
            <span
              key={index}
              className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow"
            >
              {tech}
            </span>
          ))}
        </div>

        <Button
          variant={isOngoing ? "primary" : "secondary"}
          className="w-full"
          rightIcon={<ChevronRight className="h-4 w-4" />}
        >
          {isOngoing ? "Project Board" : "View"}
        </Button>
      </div>
    </div>
  );
};

const ProjectSection: React.FC<{
  title: string;
  projects: Project[];
  showAll?: boolean;
}> = ({ title, projects, showAll = false }) => (
  <div className="mb-12">
    <div className="mb-6 flex items-center justify-between">
      <h2 className="text-xl font-semibold text-brand-dark dark:text-brand-light">
        {title}
      </h2>
      {showAll && (
        <button className="text-sm font-medium text-brand-orange hover:text-brand-red dark:text-brand-yellow dark:hover:text-brand-orange">
          see all
        </button>
      )}
    </div>
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  </div>
);

const MyProjects: React.FC = () => {
  const ongoingProjects = mockProjects.filter((p) => p.status === "ongoing");
  const pastProjects = mockProjects.filter((p) => p.status === "completed");

  return (
    <div className="flex h-screen bg-brand-light/30 dark:bg-brand-dark/95">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b border-brand-dark/10 bg-white px-8 dark:border-brand-light/10 dark:bg-brand-dark/80">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-xl font-semibold text-brand-dark dark:text-brand-light">
              Projects
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

        <div className="container mx-auto max-w-7xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-brand-dark dark:text-brand-light">
            Your Projects
          </h1>

          <ProjectSection
            title="Ongoing Projects"
            projects={ongoingProjects}
            showAll={ongoingProjects.length > 3}
          />

          <ProjectSection
            title="Past Projects"
            projects={pastProjects}
            showAll={pastProjects.length > 3}
          />
        </div>
      </div>
    </div>
  );
};

export default MyProjects;
