import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Upload,
  X,
  Plus,
  Users,
  Calendar,
  Code,
  Target,
  Globe,
  Clock,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/ui/SideBar";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";
import { projectsApi, type CreateProjectRequest } from "../services/api/projects";

interface ProjectIdea {
  title: string;
  description: string;
  category: string;
  techStack: string[];
  teamSize: {
    min: number;
    max: number;
  };
  duration: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  budget: string;
  timeline: string;
  requirements: string[];
  goals: string[];
  isRemote: boolean;
  isOpenSource: boolean;
  contactMethod: "platform" | "email" | "discord";
  additionalInfo: string;
}

const popularTechStack = [
  "React",
  "Vue.js",
  "Angular",
  "Node.js",
  "Python",
  "Java",
  "TypeScript",
  "JavaScript",
  "PHP",
  "Ruby",
  "Go",
  "Rust",
  "Swift",
  "Kotlin",
  "Flutter",
  "React Native",
  "MongoDB",
  "PostgreSQL",
  "MySQL",
  "Redis",
  "Docker",
  "AWS",
  "Firebase",
  "GraphQL",
  "REST API",
];

const PostIdea: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [categories, setCategories] = useState<string[]>([]);
  
  const [projectIdea, setProjectIdea] = useState<ProjectIdea>({
    title: "",
    description: "",
    category: "",
    techStack: [],
    teamSize: { min: 2, max: 5 },
    duration: "",
    difficulty: "intermediate",
    budget: "unpaid",
    timeline: "",
    requirements: [],
    goals: [],
    isRemote: true,
    isOpenSource: false,
    contactMethod: "platform",
    additionalInfo: "",
  });

  const [newTech, setNewTech] = useState("");
  const [newRequirement, setNewRequirement] = useState("");
  const [newGoal, setNewGoal] = useState("");

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await projectsApi.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const handleInputChange = (field: keyof ProjectIdea, value: any) => {
    setProjectIdea((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const addTechStack = (tech: string) => {
    if (tech && !projectIdea.techStack.includes(tech)) {
      setProjectIdea((prev) => ({
        ...prev,
        techStack: [...prev.techStack, tech],
      }));
    }
  };

  const removeTechStack = (tech: string) => {
    setProjectIdea((prev) => ({
      ...prev,
      techStack: prev.techStack.filter((t) => t !== tech),
    }));
  };

  const addCustomTech = () => {
    if (newTech.trim() && !projectIdea.techStack.includes(newTech.trim())) {
      addTechStack(newTech.trim());
      setNewTech("");
    }
  };

  const addRequirement = () => {
    if (newRequirement.trim() && !projectIdea.requirements.includes(newRequirement.trim())) {
      setProjectIdea((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newRequirement.trim()],
      }));
      setNewRequirement("");
    }
  };

  const removeRequirement = (requirement: string) => {
    setProjectIdea((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((r) => r !== requirement),
    }));
  };

  const addGoal = () => {
    if (newGoal.trim() && !projectIdea.goals.includes(newGoal.trim())) {
      setProjectIdea((prev) => ({
        ...prev,
        goals: [...prev.goals, newGoal.trim()],
      }));
      setNewGoal("");
    }
  };

  const removeGoal = (goal: string) => {
    setProjectIdea((prev) => ({
      ...prev,
      goals: prev.goals.filter((g) => g !== goal),
    }));
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!projectIdea.title.trim()) {
          newErrors.title = "Project title is required";
        }
        if (!projectIdea.description.trim()) {
          newErrors.description = "Project description is required";
        }
        if (!projectIdea.category) {
          newErrors.category = "Please select a category";
        }
        break;
      case 2:
        if (projectIdea.techStack.length === 0) {
          newErrors.techStack = "Please select at least one technology";
        }
        if (!projectIdea.duration) {
          newErrors.duration = "Project duration is required";
        }
        break;
      case 3:
        if (projectIdea.teamSize.min < 1) {
          newErrors.teamSizeMin = "Minimum team size must be at least 1";
        }
        if (projectIdea.teamSize.max < projectIdea.teamSize.min) {
          newErrors.teamSizeMax = "Maximum team size must be greater than minimum";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    try {
      const createProjectData: CreateProjectRequest = {
        title: projectIdea.title,
        description: projectIdea.description,
        category: projectIdea.category,
        techStack: projectIdea.techStack,
        teamSize: projectIdea.teamSize,
        duration: projectIdea.duration,
        difficulty: projectIdea.difficulty,
        budget: projectIdea.budget as any,
        timeline: projectIdea.timeline,
        requirements: projectIdea.requirements,
        goals: projectIdea.goals,
        isRemote: projectIdea.isRemote,
        isOpenSource: projectIdea.isOpenSource,
        contactMethod: projectIdea.contactMethod,
        additionalInfo: projectIdea.additionalInfo,
      };

      await projectsApi.createProject(createProjectData);
      
      // Show success and redirect
      navigate("/explore", { 
        state: { 
          message: "Your project idea has been posted successfully!" 
        } 
      });
    } catch (error: any) {
      console.error("Error submitting project idea:", error);
      setErrors({ submit: error.message || "Failed to create project. Please try again." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {[1, 2, 3, 4].map((step) => (
        <React.Fragment key={step}>
          <div
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
              step <= currentStep
                ? "bg-brand-orange text-white"
                : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
            )}
          >
            {step < currentStep ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              step
            )}
          </div>
          {step < 4 && (
            <div
              className={cn(
                "h-1 w-12 mx-2",
                step < currentStep
                  ? "bg-brand-orange"
                  : "bg-gray-200 dark:bg-gray-700"
              )}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
                Project Basics
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                Tell us about your project idea
              </p>
            </div>

            <Input
              label="Project Title"
              value={projectIdea.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              error={errors.title}
              placeholder="e.g., AI-Powered Task Management App"
              required
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Project Description <span className="text-brand-red">*</span>
              </label>
              <textarea
                value={projectIdea.description}
                onChange={(e) => handleInputChange("description", e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all resize-none",
                  "bg-white dark:bg-brand-dark-lighter",
                  "text-brand-dark dark:text-gray-100",
                  errors.description
                    ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                    : "border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600"
                )}
                rows={6}
                placeholder="Describe your project idea, its purpose, and what you want to achieve..."
              />
              {errors.description && (
                <div className="mt-1 flex items-center text-xs text-brand-red">
                  <AlertCircle size={12} className="mr-1" />
                  <span>{errors.description}</span>
                </div>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Category <span className="text-brand-red">*</span>
              </label>
              <select
                value={projectIdea.category}
                onChange={(e) => handleInputChange("category", e.target.value)}
                className={cn(
                  "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all",
                  "bg-white dark:bg-brand-dark-lighter",
                  "text-brand-dark dark:text-gray-100",
                  errors.category
                    ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                    : "border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600"
                )}
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
              {errors.category && (
                <div className="mt-1 flex items-center text-xs text-brand-red">
                  <AlertCircle size={12} className="mr-1" />
                  <span>{errors.category}</span>
                </div>
              )}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
                Technical Details
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                What technologies will you use?
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Tech Stack <span className="text-brand-red">*</span>
              </label>
              
              {/* Selected Technologies */}
              {projectIdea.techStack.length > 0 && (
                <div className="mb-4 flex flex-wrap gap-2">
                  {projectIdea.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="inline-flex items-center rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-medium text-brand-orange dark:bg-brand-orange/20"
                    >
                      {tech}
                      <button
                        onClick={() => removeTechStack(tech)}
                        className="ml-2 rounded-full p-1 hover:bg-brand-orange/20 dark:hover:bg-brand-orange/30"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Popular Technologies */}
              <div className="mb-4">
                <p className="text-sm text-brand-dark/60 dark:text-gray-300 mb-2">
                  Popular technologies:
                </p>
                <div className="flex flex-wrap gap-2">
                  {popularTechStack
                    .filter((tech) => !projectIdea.techStack.includes(tech))
                    .slice(0, 12)
                    .map((tech) => (
                      <button
                        key={tech}
                        onClick={() => addTechStack(tech)}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                      >
                        {tech}
                      </button>
                    ))}
                </div>
              </div>

              {/* Add Custom Technology */}
              <div className="flex gap-2">
                <Input
                  label=""
                  value={newTech}
                  onChange={(e) => setNewTech(e.target.value)}
                  placeholder="Add custom technology"
                  onKeyPress={(e) => e.key === "Enter" && addCustomTech()}
                />
                <Button
                  onClick={addCustomTech}
                  disabled={!newTech.trim()}
                  className="mt-0"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>

              {errors.techStack && (
                <div className="mt-1 flex items-center text-xs text-brand-red">
                  <AlertCircle size={12} className="mr-1" />
                  <span>{errors.techStack}</span>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                  Project Duration <span className="text-brand-red">*</span>
                </label>
                <select
                  value={projectIdea.duration}
                  onChange={(e) => handleInputChange("duration", e.target.value)}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all",
                    "bg-white dark:bg-brand-dark-lighter",
                    "text-brand-dark dark:text-gray-100",
                    errors.duration
                      ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                      : "border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600"
                  )}
                >
                  <option value="">Select duration</option>
                  <option value="1-2 weeks">1-2 weeks</option>
                  <option value="1 month">1 month</option>
                  <option value="2-3 months">2-3 months</option>
                  <option value="3-6 months">3-6 months</option>
                  <option value="6+ months">6+ months</option>
                  <option value="ongoing">Ongoing</option>
                </select>
                {errors.duration && (
                  <div className="mt-1 flex items-center text-xs text-brand-red">
                    <AlertCircle size={12} className="mr-1" />
                    <span>{errors.duration}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                  Difficulty Level
                </label>
                <select
                  value={projectIdea.difficulty}
                  onChange={(e) => handleInputChange("difficulty", e.target.value as any)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
                Team & Collaboration
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                Define your team requirements
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                  Minimum Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={projectIdea.teamSize.min}
                  onChange={(e) => handleInputChange("teamSize", {
                    ...projectIdea.teamSize,
                    min: parseInt(e.target.value) || 1
                  })}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all",
                    "bg-white dark:bg-brand-dark-lighter",
                    "text-brand-dark dark:text-gray-100",
                    errors.teamSizeMin
                      ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                      : "border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600"
                  )}
                />
                {errors.teamSizeMin && (
                  <div className="mt-1 flex items-center text-xs text-brand-red">
                    <AlertCircle size={12} className="mr-1" />
                    <span>{errors.teamSizeMin}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                  Maximum Team Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={projectIdea.teamSize.max}
                  onChange={(e) => handleInputChange("teamSize", {
                    ...projectIdea.teamSize,
                    max: parseInt(e.target.value) || 1
                  })}
                  className={cn(
                    "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all",
                    "bg-white dark:bg-brand-dark-lighter",
                    "text-brand-dark dark:text-gray-100",
                    errors.teamSizeMax
                      ? "border-brand-red focus:border-brand-red focus:ring-2 focus:ring-brand-red/20"
                      : "border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600"
                  )}
                />
                {errors.teamSizeMax && (
                  <div className="mt-1 flex items-center text-xs text-brand-red">
                    <AlertCircle size={12} className="mr-1" />
                    <span>{errors.teamSizeMax}</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Team Requirements
              </label>
              
              {projectIdea.requirements.length > 0 && (
                <div className="mb-4 space-y-2">
                  {projectIdea.requirements.map((requirement, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700"
                    >
                      <span className="text-sm text-brand-dark dark:text-gray-100">
                        {requirement}
                      </span>
                      <button
                        onClick={() => removeRequirement(requirement)}
                        className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  label=""
                  value={newRequirement}
                  onChange={(e) => setNewRequirement(e.target.value)}
                  placeholder="e.g., Experience with React, UI/UX design skills"
                  onKeyPress={(e) => e.key === "Enter" && addRequirement()}
                />
                <Button
                  onClick={addRequirement}
                  disabled={!newRequirement.trim()}
                  className="mt-0"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                  Budget/Compensation
                </label>
                <select
                  value={projectIdea.budget}
                  onChange={(e) => handleInputChange("budget", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  <option value="unpaid">Unpaid/Volunteer</option>
                  <option value="equity">Equity/Revenue Share</option>
                  <option value="paid">Paid Project</option>
                  <option value="negotiable">Negotiable</option>
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                  Work Style
                </label>
                <select
                  value={projectIdea.isRemote ? "remote" : "in-person"}
                  onChange={(e) => handleInputChange("isRemote", e.target.value === "remote")}
                  className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
                >
                  <option value="remote">Remote</option>
                  <option value="in-person">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={projectIdea.isOpenSource}
                  onChange={(e) => handleInputChange("isOpenSource", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand-orange focus:ring-brand-orange"
                />
                <span className="text-sm text-brand-dark dark:text-gray-100">
                  Open Source Project
                </span>
              </label>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-brand-dark dark:text-gray-100 mb-2">
                Goals & Contact
              </h2>
              <p className="text-brand-dark/60 dark:text-gray-300">
                Final details and how to reach you
              </p>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Project Goals
              </label>
              
              {projectIdea.goals.length > 0 && (
                <div className="mb-4 space-y-2">
                  {projectIdea.goals.map((goal, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-700"
                    >
                      <span className="text-sm text-brand-dark dark:text-gray-100">
                        {goal}
                      </span>
                      <button
                        onClick={() => removeGoal(goal)}
                        className="rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <X className="h-4 w-4 text-gray-400" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <Input
                  label=""
                  value={newGoal}
                  onChange={(e) => setNewGoal(e.target.value)}
                  placeholder="e.g., Launch MVP in 3 months, Gain 1000 users"
                  onKeyPress={(e) => e.key === "Enter" && addGoal()}
                />
                <Button
                  onClick={addGoal}
                  disabled={!newGoal.trim()}
                  className="mt-0"
                  leftIcon={<Plus className="h-4 w-4" />}
                >
                  Add
                </Button>
              </div>
            </div>

            <Input
              label="Timeline/Milestones"
              value={projectIdea.timeline}
              onChange={(e) => handleInputChange("timeline", e.target.value)}
              placeholder="e.g., Week 1-2: Planning, Week 3-6: Development, Week 7-8: Testing"
            />

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Preferred Contact Method
              </label>
              <select
                value={projectIdea.contactMethod}
                onChange={(e) => handleInputChange("contactMethod", e.target.value as any)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100"
              >
                <option value="platform">Through Platform</option>
                <option value="email">Email</option>
                <option value="discord">Discord</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                Additional Information
              </label>
              <textarea
                value={projectIdea.additionalInfo}
                onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-brand-dark placeholder-gray-400 focus:border-brand-orange focus:outline-none focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600 dark:bg-brand-dark-lighter dark:text-gray-100 dark:placeholder-gray-500 resize-none"
                rows={4}
                placeholder="Any additional details, links to mockups, or specific requirements..."
              />
            </div>

            {errors.submit && (
              <div className="flex items-center rounded-lg bg-red-100 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
                <AlertCircle className="mr-2 h-4 w-4" />
                {errors.submit}
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
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

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/explore")}
              leftIcon={<ArrowLeft className="h-4 w-4" />}
            >
              Back to Explore
            </Button>

            <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
              Post an Idea
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-brand-light-dark p-4 md:p-8 dark:bg-brand-dark">
          <div className="mx-auto max-w-2xl">
            <StepIndicator />

            <div className="rounded-xl bg-white p-6 md:p-8 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
              {renderStep()}

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-600">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 1}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Previous
                </Button>

                {currentStep < 4 ? (
                  <Button onClick={nextStep}>
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    isLoading={isSubmitting}
                    loadingText="Posting..."
                    leftIcon={<Upload className="h-4 w-4" />}
                  >
                    Post Idea
                  </Button>
                )}
              </div>
            </div>

            {/* Project Preview */}
            {currentStep === 4 && (
              <div className="mt-8 rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100 mb-4">
                  Preview
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-brand-dark dark:text-gray-100">
                      {projectIdea.title}
                    </h4>
                    <p className="text-sm text-brand-dark/60 dark:text-gray-300 mt-1">
                      {projectIdea.description}
                    </p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <span className="rounded bg-brand-orange/10 px-2 py-1 text-xs font-medium text-brand-orange dark:bg-brand-orange/20">
                      {projectIdea.category}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {projectIdea.teamSize.min}-{projectIdea.teamSize.max} members
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {projectIdea.duration}
                    </span>
                    <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                      {projectIdea.difficulty}
                    </span>
                  </div>

                  {projectIdea.techStack.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {projectIdea.techStack.slice(0, 5).map((tech) => (
                        <span
                          key={tech}
                          className="rounded bg-blue-100 px-2 py-1 text-xs font-medium text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                        >
                          {tech}
                        </span>
                      ))}
                      {projectIdea.techStack.length > 5 && (
                        <span className="text-xs text-brand-dark/60 dark:text-gray-300">
                          +{projectIdea.techStack.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostIdea;