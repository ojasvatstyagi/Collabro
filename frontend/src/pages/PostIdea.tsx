import React, { useState } from 'react';
import { ArrowLeft, Upload } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import Button from '../components/ui/Button';
import {
  projectsApi,
  type CreateProjectRequest,
} from '../services/api/projects';

// Import extracted components
import { ProjectIdeaState } from '../components/post-idea/types';
import StepIndicator from '../components/post-idea/StepIndicator';
import StepBasics from '../components/post-idea/StepBasics';
import StepTech from '../components/post-idea/StepTech';
import StepTeam from '../components/post-idea/StepTeam';
import StepGoals from '../components/post-idea/StepGoals';
import ProjectPreview from '../components/post-idea/ProjectPreview';

const PostIdea: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [projectIdea, setProjectIdea] = useState<ProjectIdeaState>({
    title: '',
    description: '',
    category: '',
    techStack: [],
    teamSize: { min: 2, max: 5 }, // Keeping structure for now but will use just one value in submit
    duration: '',
    difficulty: 'intermediate',
    budget: 'unpaid',
    isRemote: true,
    isOpenSource: false,
    contactMethod: 'platform',
    additionalInfo: '',
  });

  const handleInputChange = (field: keyof ProjectIdeaState, value: any) => {
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

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1:
        if (!projectIdea.title.trim()) {
          newErrors.title = 'Project title is required';
        }
        if (!projectIdea.description.trim()) {
          newErrors.description = 'Project description is required';
        }
        if (!projectIdea.category) {
          newErrors.category = 'Please select a category';
        }
        break;
      case 2:
        if (projectIdea.techStack.length === 0) {
          newErrors.techStack = 'Please select at least one technology';
        }
        if (!projectIdea.duration) {
          newErrors.duration = 'Project duration is required';
        }
        break;
      case 3:
        if (projectIdea.teamSize.max < 1) {
          // Using max as the single source of truth for team size
          newErrors.teamSizeMax = 'Team size must be at least 1';
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
        technologies: projectIdea.techStack,
        teamSize: projectIdea.teamSize.max, // Using max as the single value
        duration: projectIdea.duration,
        level: projectIdea.difficulty.toUpperCase() as any, // Map to enum
        budget: projectIdea.budget,
        isRemote: projectIdea.isRemote,
        isOpenSource: projectIdea.isOpenSource,
        contactMethod: projectIdea.contactMethod,
        additionalInfo: projectIdea.additionalInfo,
        status: 'ACTIVE',
      };

      await projectsApi.createProject(createProjectData);

      // Show success and redirect
      navigate('/explore', {
        state: {
          message: 'Your project idea has been posted successfully!',
        },
      });
    } catch (error: any) {
      console.error('Error submitting project idea:', error);
      setErrors({
        submit: error.message || 'Failed to create project. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasics
            data={projectIdea}
            onChange={handleInputChange}
            errors={errors}
          />
        );
      case 2:
        return (
          <StepTech
            data={projectIdea}
            onChange={handleInputChange}
            errors={errors}
          />
        );
      case 3:
        return (
          <StepTeam
            data={projectIdea}
            onChange={handleInputChange}
            errors={errors}
          />
        );
      case 4:
        return (
          <StepGoals
            data={projectIdea}
            onChange={handleInputChange}
            errors={errors}
          />
        );
      default:
        return null;
    }
  };

  return (
    <DashboardLayout
      title="Post an Idea"
      actions={
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/explore')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Explore
        </Button>
      }
    >
      <div className="bg-brand-light-dark p-4 md:p-8 dark:bg-brand-dark min-h-full">
        <div className="mx-auto max-w-2xl">
          <StepIndicator currentStep={currentStep} />

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
                <Button onClick={nextStep}>Next</Button>
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
          {currentStep === 4 && <ProjectPreview data={projectIdea} />}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PostIdea;
