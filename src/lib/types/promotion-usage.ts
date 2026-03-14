export interface PromotionUsage {
  usage_id: string;
  promotion_id: string;
  user_id: string;
  order_id: string;
  discount_received: number;
  used_at: string;
}

export interface PromotionUsageResult {
  success: boolean;
  message: string;
  usages?: PromotionUsage[];
}
