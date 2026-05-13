export interface QuestionnaireData {
  budget: number;
  weights: {
    affordability: number;
    walkability: number;
    transit: number;
    nightlife: number;
    safety: number;
    fitness: number;
    petFriendliness: number;
  };
  workplaceNeighborhood: string | null;
  usedDefaultWeights: boolean;
}

const STORAGE_KEY = "nf_questionnaire";

export function saveQuestionnaire(data: QuestionnaireData): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

export function loadQuestionnaire(): QuestionnaireData | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as QuestionnaireData;
  } catch {
    return null;
  }
}

export function clearQuestionnaire(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {}
}

export const DEFAULT_WEIGHTS = {
  affordability: 20,
  walkability: 20,
  transit: 15,
  nightlife: 10,
  safety: 15,
  fitness: 10,
  petFriendliness: 10,
};
