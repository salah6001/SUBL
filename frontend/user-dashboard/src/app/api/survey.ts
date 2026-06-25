import { api } from "./client";

export interface SurveyQuestion {
  id: string;    // Guid from backend
  text: string;
  category: string;
  order: number;
}

export interface SurveyResult {
  id: string;
  submittedAt: string;
  totalScore: number;
  maxScore: number;
  level: string;   // "Low" | "Moderate" | "High"
}

export const surveyApi = {
  getQuestions: () =>
    api.get<SurveyQuestion[]>("/survey/questions"),

  submit: (answers: { questionId: string; value: number }[]) =>
    api.post<SurveyResult>("/survey/responses", { answers }),

  /** Past survey results, most recent first. */
  history: () => api.get<SurveyResult[]>("/survey/responses"),
};
