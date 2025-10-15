import React from "react";
import {
  Star,
  User,
  ExternalLink,
  Search,
  Bell,
  PlusCircle,
} from "lucide-react";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";

interface JoinRequest {
  id: string;
  username: string;
  rating: number;
  projectTitle: string;
  techStack: string[];
  profileImage: string;
}

const mockRequests: JoinRequest[] = [
  {
    id: "1",
    username: "sarah_dev",
    rating: 4.5,
    projectTitle: "Modern E-commerce Platform",
    techStack: ["React", "Node.js", "TypeScript", "PostgreSQL", "Redis"],
    profileImage:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: "2",
    username: "alex_coder",
    rating: 4.8,
    projectTitle: "AI-Powered Analytics Dashboard",
    techStack: ["Python", "TensorFlow", "React", "D3.js"],
    profileImage:
      "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: "3",
    username: "mike_frontend",
    rating: 4.2,
    projectTitle: "Mobile Fitness App",
    techStack: ["React Native", "Firebase", "Redux", "Node.js"],
    profileImage:
      "https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: "4",
    username: "emma_backend",
    rating: 4.7,
    projectTitle: "Social Media Analytics Tool",
    techStack: ["Django", "PostgreSQL", "Celery", "Redis"],
    profileImage:
      "https://images.pexels.com/photos/3992656/pexels-photo-3992656.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: "5",
    username: "david_fullstack",
    rating: 4.4,
    projectTitle: "Project Management System",
    techStack: ["Vue.js", "Express", "MongoDB", "Socket.io"],
    profileImage:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
  {
    id: "6",
    username: "lisa_designer",
    rating: 4.9,
    projectTitle: "Real-time Chat Application",
    techStack: ["Figma", "React", "Tailwind CSS", "Framer Motion"],
    profileImage:
      "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=150",
  },
];

const RequestCard: React.FC<{ request: JoinRequest }> = ({ request }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-lg transition-all hover:shadow-xl dark:bg-brand-dark/80 dark:shadow-md dark:shadow-brand-light/5 hover:dark:shadow-brand-light/10">
      <div className="flex items-start gap-4">
        <img
          src={request.profileImage}
          alt={request.username}
          className="h-12 w-12 rounded-full object-cover"
        />

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-brand-dark dark:text-brand-light">
                {request.username}
              </h3>
              <div className="mt-1 flex items-center gap-1">
                <Star className="h-4 w-4 fill-brand-yellow text-brand-yellow" />
                <span className="text-sm text-brand-dark/60 dark:text-brand-light/60">
                  Rating {request.rating}
                </span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="group"
              rightIcon={
                <ExternalLink className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              }
            >
              View Profile
            </Button>
          </div>

          <div className="mt-4">
            <p className="text-sm text-brand-dark/60 dark:text-brand-light/60">
              The user has requested to join the
            </p>
            <p className="mt-1 font-medium text-brand-dark dark:text-brand-light">
              {request.projectTitle}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {request.techStack.map((tech, index) => (
              <span
                key={index}
                className="rounded bg-brand-light/50 px-2 py-1 text-xs font-medium text-brand-dark/60 dark:bg-brand-dark/50 dark:text-brand-light/60"
              >
                {tech}
              </span>
            ))}
          </div>

          <div className="mt-6 flex gap-3">
            <Button className="flex-1">Add to team</Button>
            <Button variant="outline" className="flex-1">
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

const Requests: React.FC = () => {
  return (
    <div className="flex h-screen bg-brand-light/30 dark:bg-brand-dark/95">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        <header className="flex h-16 items-center justify-between border-b border-brand-dark/10 bg-white px-8 dark:border-brand-light/10 dark:bg-brand-dark/80">
          <div className="flex flex-1 items-center gap-4">
            <h1 className="text-xl font-semibold text-brand-dark dark:text-brand-light">
              Requests
            </h1>
            <div className="relative flex-1 max-w-2xl">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-brand-dark/40 dark:text-brand-light/40" />
              <input
                type="text"
                placeholder="Search requests..."
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
              New Project
            </Button>
          </div>
        </header>

        <div className="container mx-auto max-w-5xl px-4 py-8">
          <h1 className="mb-8 text-3xl font-bold text-brand-dark dark:text-brand-light">
            Requests to join your projects
          </h1>

          <div className="grid gap-6">
            {mockRequests.map((request) => (
              <RequestCard key={request.id} request={request} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Requests;
