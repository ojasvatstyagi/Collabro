import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import { cn } from "../../utils/cn";

interface Skill {
  id: string;
  skillName: string;
}

interface SkillsManagerProps {
  skills: Skill[];
  onAddSkill: (skillName: string) => void;
  onRemoveSkill: (skillId: string) => void;
  isEditing?: boolean;
  className?: string;
}

const SkillsManager: React.FC<SkillsManagerProps> = ({
  skills,
  onAddSkill,
  onRemoveSkill,
  isEditing = false,
  className,
}) => {
  const [newSkill, setNewSkill] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.some(skill => skill.skillName.toLowerCase() === newSkill.toLowerCase())) {
      onAddSkill(newSkill.trim());
      setNewSkill("");
      setIsAdding(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleAddSkill();
    } else if (e.key === "Escape") {
      setNewSkill("");
      setIsAdding(false);
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-brand-dark dark:text-gray-100">
          Skills
        </h3>
        {isEditing && !isAdding && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsAdding(true)}
            leftIcon={<Plus className="h-4 w-4" />}
          >
            Add Skill
          </Button>
        )}
      </div>

      {/* Add skill input */}
      {isEditing && isAdding && (
        <div className="flex gap-2">
          <Input
            label="Skill Name"
            value={newSkill}
            onChange={(e) => setNewSkill(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="e.g., React, Python, UI/UX Design"
            className="flex-1"
          />
          <div className="flex gap-2 pt-6">
            <Button size="sm" onClick={handleAddSkill} disabled={!newSkill.trim()}>
              Add
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setNewSkill("");
                setIsAdding(false);
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Skills display */}
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No skills added yet. {isEditing && "Click 'Add Skill' to get started."}
          </p>
        ) : (
          skills.map((skill) => (
            <span
              key={skill.id}
              className={cn(
                "inline-flex items-center rounded-full bg-brand-orange/10 px-3 py-1 text-sm font-medium text-brand-orange dark:bg-brand-orange/20 dark:text-brand-orange",
                isEditing && "pr-1"
              )}
            >
              {skill.skillName}
              {isEditing && (
                <button
                  onClick={() => onRemoveSkill(skill.id)}
                  className="ml-2 rounded-full p-1 hover:bg-brand-orange/20 dark:hover:bg-brand-orange/30"
                  title="Remove skill"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </span>
          ))
        )}
      </div>
    </div>
  );
};

export default SkillsManager;