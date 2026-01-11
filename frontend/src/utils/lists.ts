import { ProfileData, ProfileStatus } from '../services/api/profile';

export const commonTechnologies = [
  'all',
  'React',
  'Spring Boot',
  'Java',
  'Python',
  'Node.js',
  'TypeScript',
  'Docker',
  'AWS',
];

export const categories = [
  'all',
  'Technology',
  'Design',
  'Marketing',
  'Business',
  'Finance',
  'Education',
  'Health',
  'Other',
];

// Dummy data for UI testing
export const dummyProfile: ProfileData = {
  id: '1',
  email: 'johndoe@example.com',
  firstname: 'John',
  lastname: 'Doe',
  username: 'johndoe',
  bio: 'Full-stack developer with 5+ years of experience in React, Node.js, and cloud technologies. Passionate about building scalable web applications and mentoring junior developers.',
  education: 'B.S. Computer Science, Stanford University',
  location: 'San Francisco, CA',
  phone: '+1 (555) 123-4567',
  profilePictureUrl:
    'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400',
  skills: [
    {
      id: '1',
      name: 'React',
      proficiency: 'EXPERT',
      createdAt: new Date().toISOString(),
    },
    {
      id: '2',
      name: 'TypeScript',
      proficiency: 'INTERMEDIATE',
      createdAt: new Date().toISOString(),
    },
    {
      id: '3',
      name: 'Node.js',
      proficiency: 'EXPERT',
      createdAt: new Date().toISOString(),
    },
  ],
  socialLinks: [
    { platform: 'GITHUB', url: 'https://github.com/johndoe' },
    { platform: 'LINKEDIN', url: 'https://linkedin.com/in/johndoe' },
  ],
  isProfileComplete: false,
  completionPercentage: 85,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const dummyProfileStatus: ProfileStatus = {
  isComplete: false,
  completionPercentage: 85,
  missingFields: ['location', 'phone'],
};

export const levels = [
  'all',
  'BRAND_NEW',
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
];

export const popularTechStack = [
  'React',
  'Vue.js',
  'Angular',
  'Node.js',
  'Python',
  'Java',
  'TypeScript',
  'JavaScript',
  'PHP',
  'Ruby',
  'Go',
  'Rust',
  'Swift',
  'Kotlin',
  'Flutter',
  'React Native',
  'MongoDB',
  'PostgreSQL',
  'MySQL',
  'Redis',
  'Docker',
  'AWS',
  'Firebase',
  'GraphQL',
  'REST API',
];
