export interface Exercise {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  description: string;
  instructions: string[];
  tips: string[];
  videoUrl?: string;
  imageUrl?: string;
  isCustom?: boolean;
}