// Auth
export interface LoginRequest { email: string; password: string }
export interface SignUpRequest { name: string; email: string; phone: string; password: string }
export interface ForgotPasswordRequest { email: string }
export interface VerifyCodeRequest { email: string; code: string }
export interface ResetPasswordRequest { email: string; code: string; password: string }
export interface AuthResponse {
  token: string;
  user: User;
}

// User
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  phone?: string;
}

export interface UpdateNotificationsRequest {
  notifications: boolean;
}

// Assessment
export interface AssessmentSubmitRequest {
  answers: Record<number, number>;
  baseline_text: string;
}

export interface AssessmentResult {
  score: number;
  label: 'Normal' | 'Medium' | 'High';
  emotional_state: string;
  response_time: string;
  typing_pattern: string;
  break_frequency: string;
  recommendations: { title: string; description: string }[];
}

// Dashboard
export interface SessionDataPoint {
  name: string;
  value: number;
  color: string;
}

export interface TypingDataPoint {
  name: string;
  speed: number;
}

export interface DashboardStats {
  emotional_state: string;
  stress_score: number;
  stress_label: 'Normal' | 'Medium' | 'High';
  session_data: SessionDataPoint[];
  typing_data: TypingDataPoint[];
}

// Articles
export interface ArticleAuthor {
  name: string;
  avatar: string;
  date: string;
}

export interface Article {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  tag: string;
  read_time: string;
  author: ArticleAuthor;
  content: string;
}

// Chat
export interface ChatRequest { message: string }
export interface ChatResponse { reply: string }
