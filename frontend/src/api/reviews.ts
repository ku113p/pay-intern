import api from './client';

export interface CriterionResult {
  criterion: string;
  result: 'pass' | 'partial' | 'fail';
}

export interface OutcomeReview {
  id: string;
  application_id: string;
  reviewer_id: string;
  criteria_results: CriterionResult[];
  overall_recommendation: string;
  comment: string;
  visible_in_profile: boolean;
  developer_response: string | null;
  created_at: string;
}

export const reviewsApi = {
  create: (data: {
    application_id: string;
    criteria_results: CriterionResult[];
    overall_recommendation: string;
    comment?: string;
  }) => api.post<OutcomeReview>('/outcome-reviews', data),

  get: (id: string) => api.get<OutcomeReview>(`/outcome-reviews/${id}`),

  consent: (id: string, visibleInProfile: boolean, developerResponse?: string) =>
    api.put<OutcomeReview>(`/outcome-reviews/${id}/consent`, {
      visible_in_profile: visibleInProfile,
      developer_response: developerResponse,
    }),
};
