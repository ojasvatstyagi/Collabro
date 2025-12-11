import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import VerifyRegistration from "./pages/VerifyRegistration";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Achievements from "./pages/Achievements";
import MyProjects from "./pages/MyProjects";
import Teams from "./pages/Teams";
import Requests from "./pages/Requests";
import History from "./pages/History";
import SettingsPage from "./pages/SettingsPage";
import ProjectWorkspace from "./pages/ProjectWorkspace";
import PostIdea from "./pages/PostIdea";
import { useTheme } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  const { theme } = useTheme();

  return (
    <AuthProvider>
      <div
        className={`min-h-screen w-full transition-colors duration-300 ${theme === "dark" ? "bg-brand-dark-light" : "bg-brand-light-dark"
          }`}
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/verify-registration" element={<VerifyRegistration />} />
          <Route path="/explore" element={<Home />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/projects" element={<MyProjects />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/project/:projectId" element={<ProjectWorkspace />} />
          <Route path="/post-idea" element={<PostIdea />} />
          <Route path="/requests" element={<Requests />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
