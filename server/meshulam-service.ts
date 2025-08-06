import crypto from 'crypto';

export interface MeshulamConfig {
  userId: string;
  apiKey: string;
  pageCode: string;
  testMode?: boolean;
}

export interface MeshulamPaymentRequest {
  sum: number;
  currency?: string;
  clientId?: string;
  description?: string;
  customFields?: Record<string, any>;
  successUrl?: string;
  cancelUrl?: string;
  callbackUrl?: string;
}

export interface MeshulamTokenRequest {
  sum: number;
  currency?: string;
  maxPayments?: number;
  description?: string;
  customFields?: Record<string, any>;
}

export interface MeshulamTransactionResult {
  transactionId: string;
  status: 'approved' | 'declined' | 'pending';
  paymentUrl?: string;
  token?: string;
  authNumber?: string;
  fourDigits?: string;
  cardBrand?: string;
  errorMessage?: string;
}

export class MeshulamService {
  private baseUrl: string;
  private config: MeshulamConfig;

  constructor(config: MeshulamConfig) {
    this.config = config;
    this.baseUrl = config.testMode 
      ? 'https://sandbox.meshulam.co.il/api' 
      : 'https://secure.meshulam.co.il/api';
  }

  /**
   * יצירת קישור תשלום חד פעמי
   */
  async createPaymentLink(request: MeshulamPaymentRequest): Promise<MeshulamTransactionResult> {
    const params = {
      userId: this.config.userId,
      sum: request.sum,
      currency: request.currency || 'ILS',
      pageCode: this.config.pageCode,
      description: request.description || '',
      customFields: JSON.stringify(request.customFields || {}),
      successUrl: request.successUrl,
      cancelUrl: request.cancelUrl,
      callbackUrl: request.callbackUrl,
      cField1: request.clientId || '',
    };

    // יצירת hash לאבטחה
    const hash = this.generateHash(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/Light/Payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          hash,
        }),
      });

      const result = await response.json();
      
      if (result.status === '1') {
        return {
          transactionId: result.transactionId,
          status: 'pending',
          paymentUrl: result.url,
        };
      } else {
        throw new Error(result.errorMessage || 'שגיאה ביצירת קישור תשלום');
      }
    } catch (error) {
      console.error('Meshulam payment creation error:', error);
      throw error;
    }
  }

  /**
   * יצירת טוקן לשמירת כרטיס אשראי (לרייטנר)
   */
  async createPaymentToken(request: MeshulamTokenRequest): Promise<MeshulamTransactionResult> {
    const params = {
      userId: this.config.userId,
      sum: request.sum,
      currency: request.currency || 'ILS',
      pageCode: this.config.pageCode,
      description: request.description || 'שמירת כרטיס אשראי',
      maxPayments: request.maxPayments || 36,
      customFields: JSON.stringify(request.customFields || {}),
      createToken: '1',
    };

    const hash = this.generateHash(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/Light/Payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          hash,
        }),
      });

      const result = await response.json();
      
      if (result.status === '1') {
        return {
          transactionId: result.transactionId,
          status: 'pending',
          paymentUrl: result.url,
          token: result.token,
        };
      } else {
        throw new Error(result.errorMessage || 'שגיאה ביצירת טוקן');
      }
    } catch (error) {
      console.error('Meshulam token creation error:', error);
      throw error;
    }
  }

  /**
   * חיוב באמצעות טוקן שמור (לרייטנר)
   */
  async chargeWithToken(token: string, amount: number, description?: string): Promise<MeshulamTransactionResult> {
    const params = {
      userId: this.config.userId,
      token,
      sum: amount,
      currency: 'ILS',
      description: description || 'חיוב רייטנר',
    };

    const hash = this.generateHash(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/Light/ChargeToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          hash,
        }),
      });

      const result = await response.json();
      
      return {
        transactionId: result.transactionId,
        status: result.status === '1' ? 'approved' : 'declined',
        authNumber: result.authNumber,
        fourDigits: result.fourDigits,
        cardBrand: result.cardBrand,
        errorMessage: result.errorMessage,
      };
    } catch (error) {
      console.error('Meshulam token charge error:', error);
      throw error;
    }
  }

  /**
   * בדיקת סטטוס עסקה
   */
  async getTransactionStatus(transactionId: string): Promise<MeshulamTransactionResult> {
    const params = {
      userId: this.config.userId,
      transactionId,
    };

    const hash = this.generateHash(params);
    
    try {
      const response = await fetch(`${this.baseUrl}/Light/TransactionStatus`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...params,
          hash,
        }),
      });

      const result = await response.json();
      
      return {
        transactionId: result.transactionId,
        status: result.status === '1' ? 'approved' : 
                result.status === '0' ? 'declined' : 'pending',
        authNumber: result.authNumber,
        fourDigits: result.fourDigits,
        cardBrand: result.cardBrand,
        errorMessage: result.errorMessage,
      };
    } catch (error) {
      console.error('Meshulam status check error:', error);
      throw error;
    }
  }

  /**
   * אימות callback מגורמי משולם
   */
  verifyCallback(data: Record<string, any>): boolean {
    const { hash, ...params } = data;
    const expectedHash = this.generateHash(params);
    return hash === expectedHash;
  }

  /**
   * יצירת hash לאבטחה
   */
  private generateHash(params: Record<string, any>): string {
    // סדר הפרמטרים חשוב למשולם
    const sortedKeys = Object.keys(params).sort();
    const hashString = sortedKeys
      .map(key => `${key}=${params[key]}`)
      .join('&') + `&key=${this.config.apiKey}`;
    
    return crypto.createHash('md5').update(hashString).digest('hex');
  }

  /**
   * פיענוח נתוני callback
   */
  parseCallback(callbackData: any): {
    transactionId: string;
    status: 'approved' | 'declined';
    amount: number;
    authNumber?: string;
    fourDigits?: string;
    cardBrand?: string;
    customFields?: Record<string, any>;
  } {
    return {
      transactionId: callbackData.transactionId,
      status: callbackData.status === '1' ? 'approved' : 'declined',
      amount: parseFloat(callbackData.sum),
      authNumber: callbackData.authNumber,
      fourDigits: callbackData.fourDigits,
      cardBrand: callbackData.cardBrand,
      customFields: callbackData.customFields ? JSON.parse(callbackData.customFields) : {},
    };
  }
}

// פונקציה עזר ליצירת URL תשלום
export function createMeshulamPaymentUrl(config: MeshulamConfig, params: MeshulamPaymentRequest): string {
  const service = new MeshulamService(config);
  // זוהי פונקציה סינכרונית ליצירת URL ישיר
  const baseUrl = config.testMode 
    ? 'https://sandbox.meshulam.co.il' 
    : 'https://secure.meshulam.co.il';
  
  const urlParams = new URLSearchParams({
    userId: config.userId,
    sum: params.sum.toString(),
    currency: params.currency || 'ILS',
    pageCode: config.pageCode,
    description: params.description || '',
    cField1: params.clientId || '',
  });

  return `${baseUrl}/pay/?${urlParams.toString()}`;
}