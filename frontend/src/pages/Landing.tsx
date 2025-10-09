import React from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Rocket,
  Target,
  Globe2,
  ArrowRight,
  Github,
  Code2,
  Palette,
} from "lucide-react";
import Button from "../components/ui/Button";
import ThemeToggle from "../components/ui/ThemeToggle";

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-light/30 to-white dark:from-brand-dark/95 dark:to-brand-dark">
      {/* Add Theme Toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-16 text-center lg:pt-32">
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-brand-dark dark:text-brand-light sm:text-7xl">
          Find your perfect{" "}
          <span className="relative whitespace-nowrap">
            <span className="relative bg-gradient-to-r from-brand-orange to-brand-red bg-clip-text text-transparent">
              team
            </span>
          </span>{" "}
          for your next big idea
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-lg text-brand-dark/60 dark:text-brand-light/60">
          Connect with passionate developers, designers, and creators. Build
          amazing projects together and grow your skills in a collaborative
          environment.
        </p>

        <div className="mt-10 flex justify-center gap-x-6">
          <Link to="/register">
            <Button size="lg" className="group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
          <Link to="/explore">
            <Button size="lg" variant="outline">
              Explore Projects
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div className="relative rounded-2xl border border-brand-dark/10 dark:border-brand-light/10 p-8 hover:border-brand-orange transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/10 dark:bg-brand-yellow/10">
              <Users className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
            </div>
            <h3 className="mt-6 text-xl font-medium text-brand-dark dark:text-brand-light">
              Team Formation
            </h3>
            <p className="mt-2 text-brand-dark/60 dark:text-brand-light/60">
              Find teammates based on skills, interests, and availability. Build
              diverse teams for your projects.
            </p>
          </div>

          <div className="relative rounded-2xl border border-brand-dark/10 dark:border-brand-light/10 p-8 hover:border-brand-orange transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/10 dark:bg-brand-yellow/10">
              <Target className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
            </div>
            <h3 className="mt-6 text-xl font-medium text-brand-dark dark:text-brand-light">
              Project Matching
            </h3>
            <p className="mt-2 text-brand-dark/60 dark:text-brand-light/60">
              Get matched with projects that align with your interests and
              expertise level.
            </p>
          </div>

          <div className="relative rounded-2xl border border-brand-dark/10 dark:border-brand-light/10 p-8 hover:border-brand-orange transition-colors">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-orange/10 dark:bg-brand-yellow/10">
              <Globe2 className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
            </div>
            <h3 className="mt-6 text-xl font-medium text-brand-dark dark:text-brand-light">
              Global Community
            </h3>
            <p className="mt-2 text-brand-dark/60 dark:text-brand-light/60">
              Connect with collaborators from around the world and work on
              cross-cultural projects.
            </p>
          </div>
        </div>
      </div>

      {/* Project Categories */}
      <div className="bg-brand-light/30 dark:bg-brand-dark/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-medium text-brand-dark dark:text-brand-light">
            Popular Project Categories
          </h2>
          <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 dark:bg-brand-yellow/10">
                <Code2 className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-brand-dark dark:text-brand-light">
                  Web Development
                </h3>
                <p className="mt-2 text-brand-dark/60 dark:text-brand-light/60">
                  Build modern web applications using the latest technologies.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 dark:bg-brand-yellow/10">
                <Palette className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-brand-dark dark:text-brand-light">
                  UI/UX Design
                </h3>
                <p className="mt-2 text-brand-dark/60 dark:text-brand-light/60">
                  Design beautiful and intuitive user interfaces and
                  experiences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-orange/10 dark:bg-brand-yellow/10">
                <Rocket className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
              </div>
              <div>
                <h3 className="text-xl font-medium text-brand-dark dark:text-brand-light">
                  Startup Projects
                </h3>
                <p className="mt-2 text-brand-dark/60 dark:text-brand-light/60">
                  Join early-stage startups and help build the next big thing.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h2 className="text-3xl font-medium text-brand-dark dark:text-brand-light">
          Ready to find your next project?
        </h2>
        <p className="mt-4 text-lg text-brand-dark/60 dark:text-brand-light/60">
          Join our community of creators and start collaborating today.
        </p>
        <div className="mt-8">
          <Link to="/register">
            <Button size="lg" className="group">
              Join PeerSpace
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-brand-dark/10 dark:border-brand-light/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Users className="h-6 w-6 text-brand-orange dark:text-brand-yellow" />
              <span className="text-xl font-medium text-brand-dark dark:text-brand-light">
                PeerSpace
              </span>
            </div>
            <div className="flex space-x-6">
              <a
                href="#"
                className="text-brand-dark/60 hover:text-brand-orange dark:text-brand-light/60 dark:hover:text-brand-yellow"
              >
                <Github className="h-6 w-6" />
              </a>
            </div>
          </div>
          <div className="mt-8 border-t border-brand-dark/10 dark:border-brand-light/10 pt-8 text-center text-sm text-brand-dark/60 dark:text-brand-light/60">
            <p>
              &copy; {new Date().getFullYear()} PeerSpace. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
