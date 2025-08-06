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

export interface MeshulamConfig extends PaymentProviderConfig {
  userId: string;
  pageCode?: string;
}

export class MeshulamProvider extends BasePaymentProvider {
  private readonly baseUrl: string;

  constructor(config: MeshulamConfig) {
    super(config, 'meshulam');
    this.baseUrl = config.testMode ? 
      'https://sandbox.meshulam.co.il' : 
      'https://meshulam.co.il';
  }

  async createPaymentLink(request: PaymentLinkRequest): Promise<PaymentLinkResponse> {
    try {
      const config = this.config as MeshulamConfig;
      
      const body = {
        userId: config.userId,
        sum: request.amount / 100, // Convert from agorot to shekels
        currency: request.currency || 'ILS',
        description: request.description,
        pageCode: config.pageCode || 'default',
        successUrl: request.successUrl,
        cancelUrl: request.cancelUrl,
        callbackUrl: request.callbackUrl,
        customFields: request.metadata ? JSON.stringify(request.metadata) : undefined
      };

      const response = await fetch(`${this.baseUrl}/api/light/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          paymentUrl: data.data.url,
          paymentId: data.data.id,
          metadata: data.data
        };
      } else {
        return {
          success: false,
          error: data.message || 'שגיאה ביצירת קישור תשלום'
        };
      }
    } catch (error) {
      console.error('Meshulam payment link error:', error);
      return {
        success: false,
        error: 'שגיאה בחיבור לשירות התשלומים'
      };
    }
  }

  async createPaymentToken(request: PaymentTokenRequest): Promise<PaymentTokenResponse> {
    try {
      const config = this.config as MeshulamConfig;
      
      const body = {
        userId: config.userId,
        sum: request.amount ? request.amount / 100 : 0,
        currency: request.currency || 'ILS',
        description: request.description,
        pageCode: config.pageCode || 'default',
        createToken: true,
        maxPayments: request.maxPayments || 36
      };

      const response = await fetch(`${this.baseUrl}/api/light/server`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          token: data.data.token,
          tokenId: data.data.tokenId,
          metadata: data.data
        };
      } else {
        return {
          success: false,
          error: data.message || 'שגיאה ביצירת טוקן תשלום'
        };
      }
    } catch (error) {
      console.error('Meshulam token error:', error);
      return {
        success: false,
        error: 'שגיאה בחיבור לשירות התשלומים'
      };
    }
  }

  async chargeWithToken(request: ChargeTokenRequest): Promise<ChargeTokenResponse> {
    try {
      const config = this.config as MeshulamConfig;
      
      const body = {
        userId: config.userId,
        token: request.token,
        sum: request.amount / 100, // Convert from agorot to shekels
        currency: request.currency || 'ILS',
        description: request.description || 'חיוב טוקן'
      };

      const response = await fetch(`${this.baseUrl}/api/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.status === 'success') {
        return {
          success: true,
          transactionId: data.data.transactionId,
          status: data.data.status,
          metadata: data.data
        };
      } else {
        return {
          success: false,
          error: data.message || 'שגיאה בחיוב הטוקן'
        };
      }
    } catch (error) {
      console.error('Meshulam charge error:', error);
      return {
        success: false,
        error: 'שגיאה בחיבור לשירות התשלומים'
      };
    }
  }

  verifyCallback(callbackData: CallbackData): boolean {
    // Implement Meshulam signature verification
    // This should verify the callback signature using their secret key
    return true; // Simplified for now
  }

  parseCallback(callbackData: any): CallbackData {
    return {
      transactionId: callbackData.transactionId || callbackData.id,
      status: callbackData.status,
      amount: (callbackData.sum || callbackData.amount) * 100, // Convert to agorot
      currency: callbackData.currency || 'ILS',
      customerId: callbackData.customerId,
      metadata: callbackData,
      signature: callbackData.signature
    };
  }
}