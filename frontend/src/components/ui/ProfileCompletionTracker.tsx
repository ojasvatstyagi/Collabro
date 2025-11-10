import React from "react";
import { CheckCircle2, AlertCircle, Award } from "lucide-react";
import { cn } from "../../utils/cn";

interface ProfileCompletionTrackerProps {
  isComplete: boolean;
  completionPercentage: number;
  missingFields: string[];
  className?: string;
}

const ProfileCompletionTracker: React.FC<ProfileCompletionTrackerProps> = ({
  isComplete,
  completionPercentage,
  missingFields,
  className,
}) => {
  const fieldLabels: Record<string, string> = {
    firstname: "First Name",
    lastname: "Last Name",
    bio: "Bio",
    education: "Education",
    skills: "Skills",
    profilePictureUrl: "Profile Picture",
  };

  const getFieldLabel = (field: string) => fieldLabels[field] || field;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Status Badge */}
      <div className="flex items-center gap-2">
        {isComplete ? (
          <>
            <Award className="h-5 w-5 text-green-500" />
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700 dark:bg-green-900/20 dark:text-green-400">
              Profile Complete
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-5 w-5 text-amber-500" />
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
              Profile Incomplete
            </span>
          </>
        )}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-brand-dark/60 dark:text-gray-300">
            Profile Completion
          </span>
          <span className="font-medium text-brand-orange dark:text-brand-orange">
            {completionPercentage}%
          </span>
        </div>
        <div className="h-3 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-brand-orange to-brand-red transition-all duration-500"
            style={{ width: `${completionPercentage}%` }}
          />
        </div>
      </div>

      {/* Missing Fields */}
      {!isComplete && missingFields.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-brand-dark dark:text-gray-100">
            Complete your profile by adding:
          </h4>
          <ul className="space-y-1">
            {missingFields.map((field) => (
              <li key={field} className="flex items-center gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                <span className="text-brand-dark/60 dark:text-gray-300">
                  {getFieldLabel(field)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Completion Message */}
      {isComplete && (
        <div className="rounded-lg bg-green-50 p-3 dark:bg-green-900/10">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-400">
              Congratulations! Your profile is complete and visible to other users.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileCompletionTracker;