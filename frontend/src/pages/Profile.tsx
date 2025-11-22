import React, { useState, useEffect } from "react";
import {
  User,
  Mail,
  MapPin,
  Briefcase,
  Lock,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Save,
  Edit3,
  Camera,
  Menu,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FileUpload from "../components/ui/FileUpload";
import SkillsManager from "../components/ui/SkillsManager";
import ProfileCompletionTracker from "../components/ui/ProfileCompletionTracker";
import Sidebar from "../components/ui/SideBar";
import ThemeToggle from "../components/ui/ThemeToggle";
import { cn } from "../utils/cn";
import {
  profileApi,
  ProfileData,
  ProfileStatus,
} from "../services/api/profile";

// Dummy data for UI testing
const dummyProfile: ProfileData = {
  id: "1",
  firstname: "John",
  lastname: "Doe",
  email: "john.doe@example.com",
  bio: "Full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies. Passionate about building scalable web applications and mentoring junior developers.",
  education: "B.S. Computer Science, Stanford University",
  profilePictureUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
  skills: [
    { id: "1", name: "React", userId: "1" },
    { id: "2", name: "TypeScript", userId: "1" },
    { id: "3", name: "Node.js", userId: "1" },
    { id: "4", name: "Python", userId: "1" },
    { id: "5", name: "AWS", userId: "1" },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const dummyProfileStatus: ProfileStatus = {
  isComplete: false,
  completionPercentage: 85,
  missingFields: ["location", "phone"],
};

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // Profile data state
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    bio: "",
    education: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      
      // Use dummy data for now since APIs are not working
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Try to load real data, but fall back to dummy data if it fails
      try {
        const [profileResponse, statusResponse] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getProfileStatus(),
        ]);
        // Extract data from API response objects
        const profileData = profileResponse.data;
        const statusData = statusResponse.data;
        
        setProfile(profileData);
        setProfileStatus(statusData);
        setFormData({
          firstname: profileData.firstname || "",
          lastname: profileData.lastname || "",
          bio: profileData.bio || "",
          education: profileData.education || "",
        });
      } catch (apiError) {
        console.log("API not available, using dummy data for UI testing");
        setProfile(dummyProfile);
        setProfileStatus(dummyProfileStatus);
        setFormData({
          firstname: dummyProfile.firstname,
          lastname: dummyProfile.lastname,
          bio: dummyProfile.bio,
          education: dummyProfile.education,
        });
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      // Even if there's an error, use dummy data for UI testing
      setProfile(dummyProfile);
      setProfileStatus(dummyProfileStatus);
      setFormData({
        firstname: dummyProfile.firstname,
        lastname: dummyProfile.lastname,
        bio: dummyProfile.bio,
        education: dummyProfile.education,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfileStatus = async () => {
    try {
      const statusResponse = await profileApi.getProfileStatus();
      // Extract data from API response object
      const statusData = statusResponse.data;
      setProfileStatus(statusData);
    } catch (error) {
      console.error("Error refreshing profile status:", error);
      // Use dummy data if API fails
      setProfileStatus(dummyProfileStatus);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstname.trim()) {
      newErrors.firstname = "First name is required";
    }
    if (!formData.lastname.trim()) {
      newErrors.lastname = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;

    try {
      setIsSaving(true);
      
      try {
        const updatedProfileResponse = await profileApi.updateProfile(formData);
        // Extract data from API response object
        const updatedProfile = updatedProfileResponse.data;
        setProfile(updatedProfile);
      } catch (apiError) {
        console.log("API not available, updating local dummy data");
        // Update local dummy data for UI testing
        setProfile(prev => prev ? { ...prev, ...formData } : null);
      }
      
      setIsEditing(false);
      await refreshProfileStatus();
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (file: File | null) => {
    if (!file || !profile) return;

    try {
      setIsUploadingImage(true);
      
      try {
        const resultResponse = await profileApi.uploadProfilePicture(file);
        // Extract data from API response object
        const result = resultResponse.data;
        setProfile((prev) => prev ? { ...prev, profilePictureUrl: result.profilePictureUrl } : null);
      } catch (apiError) {
        console.log("API not available, simulating image upload");
        // Simulate image upload for UI testing
        const imageUrl = URL.createObjectURL(file);
        setProfile((prev) => prev ? { ...prev, profilePictureUrl: imageUrl } : null);
      }
      
      await refreshProfileStatus();
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddSkill = async (skillName: string) => {
    try {
      try {
        const newSkillResponse = await profileApi.addSkill(skillName);
        // Extract data from API response object
        const newSkill = newSkillResponse.data;
        setProfile((prev) => prev ? {
          ...prev,
          skills: [...prev.skills, newSkill]
        } : null);
      } catch (apiError) {
        console.log("API not available, adding skill to local dummy data");
        // Add skill to local dummy data for UI testing
        const newSkill = {
          id: Date.now().toString(),
          name: skillName,
          userId: profile?.id || "1"
        };
        setProfile((prev) => prev ? {
          ...prev,
          skills: [...prev.skills, newSkill]
        } : null);
      }
      
      await refreshProfileStatus();
    } catch (error) {
      console.error("Error adding skill:", error);
    }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      try {
        await profileApi.removeSkill(skillId);
      } catch (apiError) {
        console.log("API not available, removing skill from local dummy data");
      }
      
      setProfile((prev) => prev ? {
        ...prev,
        skills: prev.skills.filter(skill => skill.id !== skillId)
      } : null);
      await refreshProfileStatus();
    } catch (error) {
      console.error("Error removing skill:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
            <p className="text-brand-dark dark:text-gray-100">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profileStatus) {
    return (
      <div className="flex h-screen bg-brand-light-dark dark:bg-brand-dark">
        <Sidebar isCollapsed={sidebarCollapsed} setIsCollapsed={setSidebarCollapsed} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-brand-dark dark:text-gray-100">Error loading profile data</p>
            <Button onClick={loadProfileData} className="mt-4">
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

            <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
              Profile
            </h1>
          </div>

          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Button
              onClick={() => navigate("/explore")}
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              className="hidden sm:flex"
            >
              Back to Explore
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-brand-light-dark p-4 md:p-8 dark:bg-brand-dark">
          <div className="mx-auto max-w-6xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Left Sidebar - Profile Header & Completion */}
              <div className="lg:col-span-1 space-y-6">
                {/* Profile Header Card */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                  <div className="text-center">
                    {/* Profile Picture Upload */}
                    <div className="relative mx-auto mb-6">
                      <FileUpload
                        currentImage={profile.profilePictureUrl}
                        onImageChange={handleImageUpload}
                        className="mx-auto"
                      />
                      {isUploadingImage && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>

                    {/* Profile Info */}
                    <h2 className="text-xl font-semibold text-brand-dark dark:text-gray-100">
                      {profile.firstname} {profile.lastname}
                    </h2>
                    <p className="mt-1 text-sm text-brand-dark/60 dark:text-gray-300">
                      @{(profile.firstname || '').toLowerCase()}{(profile.lastname || '').toLowerCase()}
                    </p>
                    
                    {/* Bio */}
                    {profile.bio && (
                      <p className="mt-4 text-sm text-brand-dark/80 dark:text-gray-200">
                        {profile.bio}
                      </p>
                    )}

                    {/* Edit Profile Button */}
                    <div className="mt-6">
                      <Button
                        onClick={() => setIsEditing(!isEditing)}
                        variant={isEditing ? "outline" : "primary"}
                        className="w-full"
                        leftIcon={isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}
                      >
                        {isEditing ? "Cancel" : "Edit Profile"}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Profile Completion Tracker */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                  <ProfileCompletionTracker
                    isComplete={profileStatus.isComplete}
                    completionPercentage={profileStatus.completionPercentage}
                    missingFields={profileStatus.missingFields}
                  />
                </div>
              </div>

              {/* Right Main Panel - Profile Details */}
              <div className="lg:col-span-2 space-y-6">
                {/* Basic Information */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-brand-dark dark:text-gray-100 flex items-center">
                      <User className="mr-2 h-5 w-5" />
                      Basic Information
                    </h3>
                    {isEditing && (
                      <Button
                        onClick={handleSaveProfile}
                        isLoading={isSaving}
                        loadingText="Saving..."
                        leftIcon={<Save className="h-4 w-4" />}
                      >
                        Save Changes
                      </Button>
                    )}
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="First Name"
                      name="firstname"
                      value={formData.firstname}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={errors.firstname}
                      required
                    />
                    <Input
                      label="Last Name"
                      name="lastname"
                      value={formData.lastname}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={errors.lastname}
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-brand-dark dark:text-gray-100">
                      Bio
                    </label>
                    <textarea
                      name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={cn(
                        "w-full rounded-lg border px-4 py-3 text-sm outline-none transition-all resize-none",
                        "bg-white dark:bg-brand-dark-lighter",
                        "text-brand-dark dark:text-gray-100",
                        isEditing
                          ? "border-gray-300 focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/20 dark:border-gray-600"
                          : "border-gray-200 dark:border-gray-700"
                      )}
                      rows={4}
                      placeholder="Tell us about yourself..."
                    />
                  </div>

                  <div className="mt-4">
                    <Input
                      label="Education"
                      name="education"
                      value={formData.education}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      placeholder="e.g., B.S. Computer Science, Stanford University"
                    />
                  </div>
                </div>

                {/* Skills Section */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                  <SkillsManager
                    skills={profile.skills}
                    onAddSkill={handleAddSkill}
                    onRemoveSkill={handleRemoveSkill}
                    isEditing={isEditing}
                  />
                </div>

                {/* Security Section */}
                <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-200 dark:bg-brand-dark-lighter dark:border-gray-600 dark:shadow-lg">
                  <button
                    onClick={() => setShowPasswordSection(!showPasswordSection)}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700"
                  >
                    <div className="flex items-center">
                      <Lock className="mr-3 h-5 w-5 text-brand-orange" />
                      <span className="font-medium text-brand-dark dark:text-gray-100">
                        Change Password
                      </span>
                    </div>
                    <span className="text-2xl text-brand-dark/60 dark:text-gray-400">
                      {showPasswordSection ? "-" : "+"}
                    </span>
                  </button>

                  {showPasswordSection && (
                    <div className="mt-4 space-y-4 rounded-lg border border-gray-200 p-4 dark:border-gray-600">
                      <Input
                        label="Current Password"
                        type="password"
                        required
                      />
                      <Input
                        label="New Password"
                        type="password"
                        required
                      />
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