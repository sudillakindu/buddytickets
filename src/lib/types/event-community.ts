export interface EventCommunityMember {
  user_id: string;
  event_id: string;
  assigned_at: string;
}

export interface EventCommunityResult {
  success: boolean;
  message: string;
  members?: EventCommunityMember[];
}
