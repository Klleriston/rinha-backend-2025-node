export interface PaymentSummaryDetail {
  totalRequests: number;
  totalAmount: number;
}

export interface PaymentSummaryResponse {
  default: PaymentSummaryDetail;
  fallback: PaymentSummaryDetail;
}

export interface PaymentSummaryQueryParams {
  from?: string;
  to?: string;
}

export interface PaymentRequestBody {
  correlationId: string;
  amount: number;
}

