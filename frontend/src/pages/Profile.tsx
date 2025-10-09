import React, { useState, useRef } from "react";
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import { cn } from "../utils/cn";

interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  bio: string;
  education: string;
  country: string;
  skills: string[];
  role: "USER" | "ADMIN";
  avatarUrl: string;
}

const Profile: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [newSkill, setNewSkill] = useState("");

  const [profile, setProfile] = useState<UserProfile>({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    username: "johndoe",
    bio: "Full-stack developer passionate about building great user experiences.",
    education: "B.S. Computer Science",
    country: "United States",
    skills: ["React", "TypeScript", "Node.js", "Tailwind CSS"],
    role: "USER",
    avatarUrl:
      "https://images.pexels.com/photos/2269872/pexels-photo-2269872.jpeg?auto=compress&cs=tinysrgb&w=150",
  });

  const [errors, setErrors] = useState<Partial<UserProfile>>({});

  const completionItems = [
    { key: "avatar", label: "Profile Picture", completed: !!profile.avatarUrl },
    { key: "bio", label: "Bio", completed: !!profile.bio },
    { key: "education", label: "Education", completed: !!profile.education },
    { key: "country", label: "Country", completed: !!profile.country },
    { key: "skills", label: "Skills", completed: profile.skills.length > 0 },
  ];

  const completionPercentage = Math.round(
    (completionItems.filter((item) => item.completed).length /
      completionItems.length) *
      100
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // In a real app, you would upload the file to a server
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newSkill.trim()) {
      e.preventDefault();
      if (!profile.skills.includes(newSkill.trim())) {
        setProfile((prev) => ({
          ...prev,
          skills: [...prev.skills, newSkill.trim()],
        }));
      }
      setNewSkill("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setProfile((prev) => ({
      ...prev,
      skills: prev.skills.filter((skill) => skill !== skillToRemove),
    }));
  };

  const handleSave = () => {
    const newErrors: Partial<UserProfile> = {};

    if (!profile.firstName) newErrors.firstName = "First name is required";
    if (!profile.lastName) newErrors.lastName = "Last name is required";
    if (!profile.bio) newErrors.bio = "Bio is required";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsEditing(false);
    // In a real app, you would save the profile to a server here
  };

  return (
    <div className="min-h-screen bg-brand-light/30 p-8 dark:bg-brand-dark/95">
      <div className="mx-auto max-w-4xl">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Sidebar */}
          <div className="md:col-span-1">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-brand-dark/80">
              <div className="relative mb-6 text-center">
                <div
                  className="relative mx-auto h-32 w-32 cursor-pointer overflow-hidden rounded-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <img
                    src={profile.avatarUrl}
                    alt={`${profile.firstName} ${profile.lastName}`}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity hover:opacity-100">
                    <Upload className="h-6 w-6 text-white" />
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileUpload}
                />
              </div>

              <div className="text-center">
                <h2 className="text-xl font-semibold text-brand-dark dark:text-brand-light">
                  {profile.firstName} {profile.lastName}
                </h2>
                <p className="mt-1 text-sm text-brand-dark/60 dark:text-brand-light/60">
                  @{profile.username}
                </p>
                <span className="mt-2 inline-block rounded-full bg-brand-orange/10 px-3 py-1 text-xs font-medium text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow">
                  {profile.role}
                </span>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span className="text-brand-dark/60 dark:text-brand-light/60">
                    Profile Completion
                  </span>
                  <span className="font-medium text-brand-orange dark:text-brand-yellow">
                    {completionPercentage}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-light dark:bg-brand-dark">
                  <div
                    className="h-full bg-brand-orange transition-all dark:bg-brand-yellow"
                    style={{ width: `${completionPercentage}%` }}
                  />
                </div>
                <ul className="mt-4 space-y-2">
                  {completionItems.map((item) => (
                    <li key={item.key} className="flex items-center text-sm">
                      {item.completed ? (
                        <CheckCircle2 className="mr-2 h-4 w-4 text-brand-orange dark:text-brand-yellow" />
                      ) : (
                        <AlertCircle className="mr-2 h-4 w-4 text-brand-dark/40 dark:text-brand-light/40" />
                      )}
                      <span
                        className={cn(
                          "text-brand-dark/60 dark:text-brand-light/60",
                          item.completed &&
                            "text-brand-dark dark:text-brand-light"
                        )}
                      >
                        {item.label}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Main Panel */}
          <div className="md:col-span-2">
            <div className="rounded-lg bg-white p-6 shadow-md dark:bg-brand-dark/80">
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-2xl font-semibold text-brand-dark dark:text-brand-light">
                  Profile Settings
                </h1>
                <Button
                  variant={isEditing ? "primary" : "outline"}
                  onClick={() =>
                    isEditing ? handleSave() : setIsEditing(true)
                  }
                >
                  {isEditing ? "Save Changes" : "Edit Profile"}
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-brand-dark dark:text-brand-light">
                    Basic Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="First Name"
                      value={profile.firstName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          firstName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      error={errors.firstName}
                      required
                    />
                    <Input
                      label="Last Name"
                      value={profile.lastName}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          lastName: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                      error={errors.lastName}
                      required
                    />
                    <Input label="Email" value={profile.email} disabled />
                    <Input label="Username" value={profile.username} disabled />
                  </div>
                </div>

                {/* About */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-brand-dark dark:text-brand-light">
                    About
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-brand-light">
                        Bio
                        <span className="text-brand-red ml-1">*</span>
                      </label>
                      <textarea
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile((prev) => ({
                            ...prev,
                            bio: e.target.value,
                          }))
                        }
                        disabled={!isEditing}
                        className={cn(
                          "w-full rounded-lg border px-4 py-2 text-sm outline-none transition-all",
                          "placeholder:text-transparent focus:ring-2",
                          "bg-white dark:bg-brand-dark/90",
                          "text-brand-dark dark:text-brand-light",
                          isEditing
                            ? "border-brand-orange focus:border-brand-orange focus:ring-brand-orange/20"
                            : "border-brand-dark/20 dark:border-brand-light/20",
                          errors.bio &&
                            "border-brand-red focus:border-brand-red focus:ring-brand-red/20"
                        )}
                        rows={4}
                      />
                      {errors.bio && (
                        <p className="mt-1 text-xs text-brand-red">
                          {errors.bio}
                        </p>
                      )}
                    </div>
                    <Input
                      label="Education"
                      value={profile.education}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          education: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                    />
                    <Input
                      label="Country"
                      value={profile.country}
                      onChange={(e) =>
                        setProfile((prev) => ({
                          ...prev,
                          country: e.target.value,
                        }))
                      }
                      disabled={!isEditing}
                    />
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h3 className="mb-4 text-lg font-medium text-brand-dark dark:text-brand-light">
                    Skills
                  </h3>
                  <div className="space-y-4">
                    {isEditing && (
                      <Input
                        label="Add Skill"
                        value={newSkill}
                        onChange={(e) => setNewSkill(e.target.value)}
                        onKeyDown={handleAddSkill}
                        placeholder="Press Enter to add"
                      />
                    )}
                    <div className="flex flex-wrap gap-2">
                      {profile.skills.map((skill) => (
                        <span
                          key={skill}
                          className={cn(
                            "inline-flex items-center rounded-full bg-brand-orange/10 px-3 py-1 text-sm",
                            "text-brand-orange dark:bg-brand-yellow/10 dark:text-brand-yellow"
                          )}
                        >
                          {skill}
                          {isEditing && (
                            <button
                              onClick={() => handleRemoveSkill(skill)}
                              className="ml-2 text-brand-orange/60 hover:text-brand-orange dark:text-brand-yellow/60 dark:hover:text-brand-yellow"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div>
                  <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="flex w-full items-center justify-between rounded-lg border border-brand-dark/10 p-4 text-left transition-colors hover:bg-brand-light/30 dark:border-brand-light/10 dark:hover:bg-brand-dark/50"
                  >
                    <div className="flex items-center">
                      <Lock className="mr-3 h-5 w-5 text-brand-orange dark:text-brand-yellow" />
                      <span className="text-brand-dark dark:text-brand-light">
                        Change Password
                      </span>
                    </div>
                    <span className="text-2xl text-brand-dark/60 dark:text-brand-light/60">
                      {showPasswordSection ? "-" : "+"}
                    </span>
                  </button>

                  {showPasswordSection && (
                    <div className="mt-4 space-y-4 rounded-lg border border-brand-dark/10 p-4 dark:border-brand-light/10">
                      <Input
                        label="Current Password"
                        type="password"
                        required
                      />
                      <Input label="New Password" type="password" required />
                      <Input
                        label="Confirm New Password"
                        type="password"
                        required
                      />
                      <Button className="w-full">Update Password</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
