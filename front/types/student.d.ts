export interface Student {
  id: number;
  name: string;
  email: string;
  phone: string;
  cf_handle: string;
  current_rating: number;
  max_rating: number;
  last_updated: string;
  email_opt_out: boolean;
}

export interface ContestHistory {
  contest_id: number;
  contest_name: string;
  rank: number;
  rating_change: number;
  solved_count: number;
  date: string;
  new_rating: number;
}

export interface ProblemStats {
  hardest_solved: number;
  hardest_solved_rating: number;
  total_solved: number;
  average_rating: number;
  problems_per_day: number;
  solved_by_rating: { [rating: number]: number };
  submissions: { date: string; count: number }[];
} 