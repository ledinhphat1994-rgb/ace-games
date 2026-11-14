export type GameCategory = 'all' | 'puzzle' | 'arcade' | 'strategy' | 'classic';

export interface GameInfo {
  id: string;
  title: string;
  category: GameCategory;
  categoryLabel: string;
  description: string;
  instructions: string[];
  controls: {
    desktop: string;
    mobile: string;
  };
  thumbnailIcon: string;
  accentColor: string;
  rating: number;
  plays: number;
  tags: string[];
  isHot?: boolean;
  isNew?: boolean;
}
