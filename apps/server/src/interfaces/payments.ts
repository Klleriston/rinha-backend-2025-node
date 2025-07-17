import type { Semaphore } from "async-mutex";

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

export interface Processor {
  name: string;
  url?: string;
  healthUrl?: string;
  activeConnections: number;
  healthy?: boolean;
}
export interface ProcessorConfig {
    name: string;
    url: string;
    healthUrl: string;
    activeConnections: number;
    pendingPromises: number;
    healthy: boolean;
    semaphore: Semaphore;
}

export interface ProcessorConfig {
    name: string;
    url: string;
    healthUrl: string;
    activeConnections: number;
    pendingPromises: number;
    healthy: boolean;
    semaphore: Semaphore;
}