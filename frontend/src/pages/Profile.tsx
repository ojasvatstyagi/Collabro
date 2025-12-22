import React, { useState, useEffect } from "react";
import {
  User,
  Lock,
  AlertCircle,
  ArrowLeft,
  Save,
  Edit3,
  Menu,
  Calendar,
  Globe,
  Phone,
  Book
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import FileUpload from "../components/ui/FileUpload";
import SkillsManager from "../components/ui/SkillsManager";
import ProfileCompletionTracker from "../components/ui/ProfileCompletionTracker";
import Sidebar from "../components/ui/SideBar";
import ThemeToggle from "../components/ui/ThemeToggle";
import SocialLinksManager from "../components/ui/SocialLinksManager";
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
  bio: "Full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies. Passionate about building scalable web applications and mentoring junior developers.",
  education: "B.S. Computer Science, Stanford University",
  location: "San Francisco, CA",
  phone: "+1 (555) 123-4567",
  profilePictureUrl: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
  skills: [
    { id: "1", skillName: "React", proficiency: "EXPERT", createdAt: new Date().toISOString() },
    { id: "2", skillName: "TypeScript", proficiency: "INTERMEDIATE", createdAt: new Date().toISOString() },
    { id: "3", skillName: "Node.js", proficiency: "EXPERT", createdAt: new Date().toISOString() },
  ],
  socialLinks: [
    { platform: "GITHUB", url: "https://github.com/johndoe" },
    { platform: "LINKEDIN", url: "https://linkedin.com/in/johndoe" }
  ],
  isProfileComplete: false,
  completionPercentage: 85,
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
    location: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load profile data on component mount
  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1000));

      try {
        const [profileResponse, statusResponse] = await Promise.all([
          profileApi.getProfile(),
          profileApi.getProfileStatus(),
        ]);
        const profileData = profileResponse.data;
        const statusData = statusResponse.data;

        if (profileData && statusData) {
          setProfile(profileData);
          setProfileStatus(statusData);
          setFormData({
            firstname: profileData.firstname || "",
            lastname: profileData.lastname || "",
            bio: profileData.bio || "",
            education: profileData.education || "",
            location: profileData.location || "",
            phone: profileData.phone || "",
          });
        }
      } catch (apiError) {
        setProfile(dummyProfile);
        setProfileStatus(dummyProfileStatus);
        setFormData({
          firstname: dummyProfile.firstname,
          lastname: dummyProfile.lastname,
          bio: dummyProfile.bio,
          education: dummyProfile.education,
          location: dummyProfile.location,
          phone: dummyProfile.phone,
        });
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfileStatus = async () => {
    try {
      const statusResponse = await profileApi.getProfileStatus();
      const statusData = statusResponse.data;
      if (statusData) {
        setProfileStatus(statusData);
      }
    } catch (error) {
      setProfileStatus(dummyProfileStatus);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleAddSocialLink = async (platform: string, url: string) => {
    const optimisticLink = { id: `temp-${Date.now()}`, platform, url } as any;
    setProfile(prev => {
      if (!prev) return null;
      return { ...prev, socialLinks: [...prev.socialLinks, optimisticLink] };
    });

    const response = await profileApi.addSocialLink({ platform: platform as any, url });
    if (response.success && response.data) {
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          socialLinks: prev.socialLinks.map(l => l.id === optimisticLink.id ? response.data! : l)
        };
      });
    } else {
      setProfile(prev => {
        if (!prev) return null;
        return { ...prev, socialLinks: prev.socialLinks.filter(l => l.id !== optimisticLink.id) };
      });
    }
  };

  const handleRemoveSocialLink = async (linkId: string) => {
    if (!profile) return;
    const prevLinks = profile.socialLinks;
    setProfile(prev => {
      if (!prev) return null;
      return { ...prev, socialLinks: prev.socialLinks.filter(l => l.id !== linkId) };
    });

    const response = await profileApi.removeSocialLink(linkId);
    if (!response.success) {
      setProfile(prev => (prev ? { ...prev, socialLinks: prevLinks } : null));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstname.trim()) newErrors.firstname = "First name is required";
    if (!formData.lastname.trim()) newErrors.lastname = "Last name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    try {
      setIsSaving(true);
      try {
        const updatedProfileResponse = await profileApi.updateProfile(formData);
        const updatedProfile = updatedProfileResponse.data;
        if (updatedProfile) setProfile(updatedProfile);
      } catch (apiError) {
        setProfile(prev => prev ? { ...prev, ...formData } : null);
      }
      setIsEditing(false);
      await refreshProfileStatus();
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
        const result = resultResponse.data;
        if (result) {
          setProfile((prev) => prev ? { ...prev, profilePictureUrl: result.profilePictureUrl } : null);
        }
      } catch (apiError) {
        const imageUrl = URL.createObjectURL(file);
        setProfile((prev) => prev ? { ...prev, profilePictureUrl: imageUrl } : null);
      }
      await refreshProfileStatus();
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleDeleteProfilePicture = async () => {
    if (!profile || !profile.profilePictureUrl) return;
    try {
      setIsUploadingImage(true);
      await profileApi.deleteProfilePicture();
      setProfile(prev => prev ? { ...prev, profilePictureUrl: "" } : null);
      await refreshProfileStatus();
    } catch (error) {
      console.error("Failed to delete profile picture", error);
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleAddSkill = async (skillName: string, proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'EXPERT') => {
    try {
      try {
        const newSkillResponse = await profileApi.addSkill({ skillName, proficiency });
        const newSkill = newSkillResponse.data;
        if (newSkill) {
          setProfile((prev) => prev ? { ...prev, skills: [...prev.skills, newSkill] } : null);
        }
      } catch (apiError) {
        // Optimistic update for demo/testing if backend fails or is mocked
        const newSkill = { id: Date.now().toString(), skillName, proficiency, createdAt: new Date().toISOString() };
        setProfile((prev) => prev ? { ...prev, skills: [...prev.skills, newSkill] } : null);
      }
      await refreshProfileStatus();
    } catch (error) { console.error(error); }
  };

  const handleRemoveSkill = async (skillId: string) => {
    try {
      try {
        await profileApi.removeSkill(skillId);
      } catch (apiError) { }
      setProfile((prev) => prev ? { ...prev, skills: prev.skills.filter(s => s.id !== skillId) } : null);
      await refreshProfileStatus();
    } catch (error) { console.error(error); }
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
            <Button onClick={loadProfileData} className="mt-4">Try Again</Button>
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
            <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-brand-dark-lighter">
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-brand-dark dark:text-gray-100">Profile</h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <ThemeToggle />
            <Button onClick={() => navigate("/explore")} variant="outline" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />} className="hidden sm:flex">
              Back to Explore
            </Button>
            <Button onClick={() => profileApi.exportProfilePdf()} variant="outline" size="sm" className="hidden sm:flex">
              Export PDF
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="bg-brand-light-dark p-4 md:p-8 dark:bg-brand-dark min-h-screen">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-12">

              {/* Left Column */}
              <div className="lg:col-span-4 space-y-6">
                <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 dark:bg-brand-dark-lighter dark:border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-orange/20 to-brand-orange/5 dark:from-brand-orange/10 dark:to-transparent"></div>
                  <div className="relative z-10 flex flex-col items-center text-center">
                    <FileUpload currentImage={profile.profilePictureUrl} onImageChange={handleImageUpload} className="mx-auto w-28 h-28 border-4 border-white dark:border-brand-dark-lighter shadow-md" />
                    {isEditing && profile.profilePictureUrl && (
                      <button onClick={handleDeleteProfilePicture} className="text-xs text-red-500 hover:underline mt-2">Remove Picture</button>
                    )}
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{profile.firstname} {profile.lastname}</h2>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">@{profile.firstname.toLowerCase()}{profile.lastname.toLowerCase()}</p>

                    <div className="flex flex-col gap-2 w-full text-sm text-gray-600 dark:text-gray-300 items-center justify-center">
                      {profile.location && (
                        <span className="flex items-center"><Globe className="w-3 h-3 mr-1" /> {profile.location}</span>
                      )}
                      {profile.phone && (
                        <span className="flex items-center"><Phone className="w-3 h-3 mr-1" /> {profile.phone}</span>
                      )}
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                        <Calendar className="w-3 h-3 mr-1" />
                        Joined {new Date(profile.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                      </span>
                    </div>

                    <div className="mt-6 w-full">
                      <Button onClick={() => setIsEditing(!isEditing)} variant={isEditing ? "outline" : "primary"} className="w-full justify-center" leftIcon={isEditing ? <Save className="h-4 w-4" /> : <Edit3 className="h-4 w-4" />}>
                        {isEditing ? "Cancel Editing" : "Edit Profile"}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-brand-dark-lighter dark:border-gray-700">
                  <SocialLinksManager socialLinks={profile.socialLinks} onAddLink={handleAddSocialLink} onRemoveLink={handleRemoveSocialLink} isEditing={isEditing} />
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-brand-dark-lighter dark:border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Profile Strength</h3>
                    <span className="text-lg font-bold text-brand-orange">{profileStatus.completionPercentage}%</span>
                  </div>
                  <ProfileCompletionTracker isComplete={profileStatus.isComplete} completionPercentage={profileStatus.completionPercentage} missingFields={profileStatus.missingFields} />
                </div>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 dark:bg-brand-dark-lighter dark:border-gray-700">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                      <User className="mr-2 h-5 w-5 text-brand-orange" /> About Me
                    </h3>
                    {isEditing && (
                      <Button onClick={handleSaveProfile} isLoading={isSaving} size="sm" leftIcon={<Save className="h-4 w-4" />}>Save Changes</Button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="First Name" name="firstname" value={formData.firstname} onChange={handleInputChange} error={errors.firstname} required />
                        <Input label="Last Name" name="lastname" value={formData.lastname} onChange={handleInputChange} error={errors.lastname} required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input label="Location" name="location" value={formData.location} onChange={handleInputChange} placeholder="City, Country" />
                        <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+1 (555) 000-0000" />
                      </div>
                      <textarea name="bio" value={formData.bio} onChange={handleInputChange} className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-brand-orange dark:bg-gray-800 dark:text-gray-100 min-h-[120px]" placeholder="Tell us about yourself..." />
                      <Input label="Education" name="education" value={formData.education} onChange={handleInputChange} placeholder="e.g., University name, Degree" />
                    </div>
                  ) : (
                    <div className="prose dark:prose-invert max-w-none">
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">{profile.bio || "No bio provided yet."}</p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {profile.education && (
                          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <Book className="w-5 h-5 text-brand-orange mr-4" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Education</p>
                              <p className="font-medium text-gray-900 dark:text-white">{profile.education}</p>
                            </div>
                          </div>
                        )}
                        {profile.location && (
                          <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700">
                            <Globe className="w-5 h-5 text-brand-orange mr-4" />
                            <div>
                              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</p>
                              <p className="font-medium text-gray-900 dark:text-white">{profile.location}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100 dark:bg-brand-dark-lighter dark:border-gray-700">
                  <SkillsManager skills={profile.skills} onAddSkill={handleAddSkill} onRemoveSkill={handleRemoveSkill} isEditing={isEditing} />
                </div>

                <div className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100 dark:bg-brand-dark-lighter dark:border-gray-700">
                  <button onClick={() => setShowPasswordSection(!showPasswordSection)} className="flex w-full items-center justify-between group">
                    <div className="flex items-center">
                      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg group-hover:bg-brand-orange/10 transition-colors">
                        <Lock className="h-5 w-5 text-gray-500 group-hover:text-brand-orange dark:text-gray-400" />
                      </div>
                      <span className="ml-3 font-semibold text-gray-700 dark:text-gray-200 group-hover:text-brand-orange transition-colors">Update Password</span>
                    </div>
                    <ArrowLeft className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${showPasswordSection ? "-rotate-90" : "rotate-180"}`} />
                  </button>
                  {showPasswordSection && (
                    <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                      <div className="grid gap-4 max-w-md">
                        <Input label="Current Password" type="password" required />
                        <Input label="New Password" type="password" required />
                        <Input label="Confirm New Password" type="password" required />
                        <Button className="w-full">Update Password</Button>
                      </div>
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