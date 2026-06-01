import { api } from "./client";

export interface SurveyQuestion {
  id: number;
  text: string;
  en: string;
  scale: string;
}

export interface SurveyResult {
  score: number;
  label: "Normal" | "Medium" | "High";
  emotional_state: string;
  response_time: string;
  typing_pattern: string;
  break_frequency: string;
  recommendations: { title: string; description: string }[];
}

export const surveyApi = {
  getQuestions: () => api.get<{ questions: SurveyQuestion[] }>("/survey/questions"),
  submit: (q1: number, q2: number, q3: number, q4: number, q5: number) =>
    api.post<SurveyResult>("/survey", { q1, q2, q3, q4, q5 }),
};
