import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import Button from "./Button";
import Input from "./Input";
import { cn } from "../../utils/cn";
import { profileApi } from "../../services/api/profile";

interface Skill {
  id: string;
  name: string;
  proficiency?: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT';
}

interface SkillsManagerProps {
  skills: Skill[];
  onAddSkill: (skillName: string, proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT') => void;
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
  const [proficiency, setProficiency] = useState<'BEGINNER' | 'INTERMEDIATE' | 'EXPERT'>('BEGINNER');
  const [isAdding, setIsAdding] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    setNewSkill(query);
    if (query.trim().length > 1) {
      setIsSearching(true);
      try {
        const response = await profileApi.searchSkills(query);
        if (response.data) {
          setSuggestions(response.data);
        }
      } catch (error) {
        console.error("Error searching skills", error);
      } finally {
        setIsSearching(false);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.some(skill => skill.name.toLowerCase() === newSkill.trim().toLowerCase())) {
      onAddSkill(newSkill.trim(), proficiency);
      setNewSkill("");
      setSuggestions([]);
      setIsAdding(false);
    }
  };

  const selectSuggestion = (suggestion: string) => {
    setNewSkill(suggestion);
    setSuggestions([]);
  };

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-dark dark:text-gray-100 flex items-center gap-2">
          Skills & Expertise
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
        <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 space-y-4">
          <div className="relative">
            <Input
              label="Skill Name"
              value={newSkill}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="e.g., React, Python..."
              className="w-full"
            />
            {suggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Proficiency Level</label>
            <div className="flex gap-2">
              {(['BEGINNER', 'INTERMEDIATE', 'EXPERT'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setProficiency(level)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-xs font-semibold transition-colors border",
                    proficiency === level
                      ? "bg-brand-orange text-white border-brand-orange"
                      : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600 hover:border-brand-orange/50"
                  )}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2">
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
            <Button size="sm" onClick={handleAddSkill} disabled={!newSkill.trim()}>
              Add Skill
            </Button>
          </div>
        </div>
      )}

      {/* Skills display */}
      <div className="flex flex-wrap gap-2">
        {skills.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 italic">
            No professional skills added yet. {isEditing && "Click 'Add Skill' to showcase your expertise."}
          </p>
        ) : (
          skills.map((skill) => (
            <div
              key={skill.id}
              className={cn(
                "inline-flex items-center rounded-lg border px-3 py-1.5 transition-all hover:shadow-sm",
                "bg-white dark:bg-gray-800/80 border-gray-200 dark:border-gray-700"
              )}
            >
              <div className="flex flex-col mr-2">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{skill.name}</span>
                <span className="text-[10px] uppercase tracking-wider font-bold text-brand-orange">
                  {skill.proficiency || "Beginner"}
                </span>
              </div>
              {isEditing && (
                <button
                  onClick={() => onRemoveSkill(skill.id)}
                  className="ml-1 rounded-full p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Remove skill"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default SkillsManager;