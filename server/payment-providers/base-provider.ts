// Base interface for all payment providers

export interface PaymentProviderConfig {
  apiKey: string;
  secretKey?: string;
  testMode?: boolean;
  currency?: string;
  [key: string]: any;
}

export interface PaymentLinkRequest {
  amount: number;
  currency: string;
  description: string;
  clientId?: string;
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
  customerId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentLinkResponse {
  success: boolean;
  paymentUrl?: string;
  paymentId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface PaymentTokenRequest {
  amount?: number;
  currency: string;
  description: string;
  maxPayments?: number;
  customerId?: string;
}

export interface PaymentTokenResponse {
  success: boolean;
  token?: string;
  tokenId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface ChargeTokenRequest {
  token: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface ChargeTokenResponse {
  success: boolean;
  transactionId?: string;
  status?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface CallbackData {
  transactionId: string;
  status: string;
  amount: number;
  currency: string;
  customerId?: string;
  metadata?: Record<string, any>;
  signature?: string;
  [key: string]: any;
}

export abstract class BasePaymentProvider {
  protected config: PaymentProviderConfig;
  protected name: string;

  constructor(config: PaymentProviderConfig, name: string) {
    this.config = config;
    this.name = name;
  }

  abstract createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse>;
  abstract createPaymentToken(request: PaymentTokenRequest): Promise<PaymentTokenResponse>;
  abstract chargeWithToken(request: ChargeTokenRequest): Promise<ChargeTokenResponse>;
  abstract verifyCallback(callbackData: CallbackData): boolean;
  abstract parseCallback(callbackData: any): CallbackData;

  getName(): string {
    return this.name;
  }

  getConfig(): PaymentProviderConfig {
    return { ...this.config, secretKey: undefined }; // Don't expose secret key
  }
}

export interface PaymentProviderFactory {
  createProvider(provider: string, config: PaymentProviderConfig): BasePaymentProvider;
  getSupportedProviders(): string[];
}