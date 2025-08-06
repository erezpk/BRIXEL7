import {
  BasePaymentProvider,
  PaymentProviderConfig,
  PaymentLinkRequest,
  PaymentLinkResponse,
  PaymentTokenRequest,
  PaymentTokenResponse,
  ChargeTokenRequest,
  ChargeTokenResponse,
  CallbackData
} from './base-provider';

export interface GreenInvoiceConfig extends PaymentProviderConfig {
  companyId: string;
  integrationId?: string;
}

export class GreenInvoiceProvider extends BasePaymentProvider {
  private readonly baseUrl: string;

  constructor(config: GreenInvoiceConfig) {
    super(config, 'greeninvoice');
    this.baseUrl = config.testMode ? 
      'https://sandbox.greeninvoice.co.il' : 
      'https://api.greeninvoice.co.il';
  }

  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      const config = this.config as GreenInvoiceConfig;
      
      const body = {
        companyId: config.companyId,
        amount: request.amount / 100, // Convert from agorot to shekels
        currency: request.currency || 'ILS',
        description: request.description,
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        notificationUrl: request.callbackUrl,
        customerId: request.clientId,
        metadata: request.metadata
      };

      const response = await fetch(`${this.baseUrl}/api/v1/payments/links`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Company-ID': config.companyId
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          paymentUrl: data.paymentUrl,
          paymentId: data.paymentId,
          metadata: data
        };
      } else {
        return {
          success: false,
          error: data.message || 'שגיאה ביצירת קישור תשלום בחשבונית ירוקה'
        };
      }
    } catch (error) {
      console.error('GreenInvoice payment link error:', error);
      return {
        success: false,
        error: 'שגיאה בחיבור לחשבונית ירוקה'
      };
    }
  }

  async createPaymentToken(request: PaymentTokenRequest): Promise<PaymentTokenResponse> {
    try {
      const config = this.config as GreenInvoiceConfig;
      
      const body = {
        companyId: config.companyId,
        currency: request.currency || 'ILS',
        description: request.description,
        customerId: request.customerId,
        saveCard: true,
        maxPayments: request.maxPayments || 36
      };

      const response = await fetch(`${this.baseUrl}/api/v1/payments/tokens`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Company-ID': config.companyId
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          token: data.token,
          tokenId: data.tokenId,
          metadata: data
        };
      } else {
        return {
          success: false,
          error: data.message || 'שגיאה ביצירת טוקן תשלום בחשבונית ירוקה'
        };
      }
    } catch (error) {
      console.error('GreenInvoice token error:', error);
      return {
        success: false,
        error: 'שגיאה בחיבור לחשבונית ירוקה'
      };
    }
  }

  async chargeWithToken(request: ChargeTokenRequest): Promise<ChargeTokenResponse> {
    try {
      const config = this.config as GreenInvoiceConfig;
      
      const body = {
        companyId: config.companyId,
        token: request.token,
        amount: request.amount / 100, // Convert from agorot to shekels
        currency: request.currency || 'ILS',
        description: request.description || 'חיוב טוכן בחשבונית ירוקה'
      };

      const response = await fetch(`${this.baseUrl}/api/v1/payments/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Company-ID': config.companyId
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        return {
          success: true,
          transactionId: data.transactionId,
          status: data.status,
          metadata: data
        };
      } else {
        return {
          success: false,
          error: data.message || 'שגיאה בחיוב הטוקן בחשבונית ירוקה'
        };
      }
    } catch (error) {
      console.error('GreenInvoice charge error:', error);
      return {
        success: false,
        error: 'שגיאה בחיבור לחשבונית ירוקה'
      };
    }
  }

  verifyCallback(callbackData: CallbackData): boolean {
    // Implement GreenInvoice signature verification
    // This should verify the callback signature using their webhook secret
    return true; // Simplified for now
  }

  parseCallback(callbackData: any): CallbackData {
    return {
      transactionId: callbackData.transactionId || callbackData.id,
      status: callbackData.status,
      amount: (callbackData.amount || callbackData.sum) * 100, // Convert to agorot
      currency: callbackData.currency || 'ILS',
      customerId: callbackData.customerId,
      metadata: callbackData,
      signature: callbackData.signature
    };
  }
}