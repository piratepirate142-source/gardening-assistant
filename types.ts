
export interface PlantCare {
  watering: string;
  sunlight: string;
  temperature: string;
  humidity: string;
  soil: string;
  fertilizer: string;
}

export interface PlantInfo {
  name: string;
  scientificName: string;
  description: string;
  careGuide: PlantCare;
  toxicity: string;
  commonIssues: string[];
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
