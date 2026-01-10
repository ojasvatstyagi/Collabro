export interface ProjectIdeaState {
  title: string;
  description: string;
  category: string;
  techStack: string[];
  teamSize: {
    min: number;
    max: number;
  };
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  budget: string;
  isRemote: boolean;
  isOpenSource: boolean;
  contactMethod: 'platform' | 'email' | 'discord';
  additionalInfo: string;
}
