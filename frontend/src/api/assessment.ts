import { api } from './client';
import type { AssessmentSubmitRequest, AssessmentResult } from '@/types';

export const assessmentApi = {
  submit: (data: AssessmentSubmitRequest) =>
    api.post<AssessmentResult>('/assessment/submit', data),
};
