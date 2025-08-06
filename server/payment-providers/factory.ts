import {
  BasePaymentProvider,
  PaymentProviderConfig
} from './base-provider';

import { MeshulamProvider, MeshulamConfig } from './meshulam-provider';
import { GreenInvoiceProvider, GreenInvoiceConfig } from './greeninvoice-provider';

export class PaymentProviderFactory {
  private static instance: PaymentProviderFactory;

  public static getInstance(): PaymentProviderFactory {
    if (!PaymentProviderFactory.instance) {
      PaymentProviderFactory.instance = new PaymentProviderFactory();
    }
    return PaymentProviderFactory.instance;
  }

  createProvider(provider: string, config: PaymentProviderConfig): BasePaymentProvider {
    switch (provider.toLowerCase()) {
      case 'meshulam':
        return new MeshulamProvider(config as MeshulamConfig);
      
      case 'greeninvoice':
      case 'green_invoice':
        return new GreenInvoiceProvider(config as GreenInvoiceConfig);
      
      case 'stripe':
        // TODO: Implement Stripe provider
        throw new Error('ספק התשלומים Stripe טרם מוכן');
      
      case 'paypal':
        // TODO: Implement PayPal provider
        throw new Error('ספק התשלומים PayPal טרם מוכן');
      
      case 'bluesnap':
        // TODO: Implement BlueSnap provider
        throw new Error('ספק התשלומים BlueSnap טרם מוכן');
      
      case 'payoneer':
        // TODO: Implement Payoneer provider
        throw new Error('ספק התשלומים Payoneer טרם מוכן');
      
      default:
        throw new Error(`ספק תשלומים לא נתמך: ${provider}`);
    }
  }

  getSupportedProviders(): string[] {
    return [
      'meshulam',
      'greeninvoice',
      'stripe',      // TODO: Not implemented yet
      'paypal',      // TODO: Not implemented yet
      'bluesnap',    // TODO: Not implemented yet
      'payoneer'     // TODO: Not implemented yet
    ];
  }

  getProviderDisplayNames(): Record<string, string> {
    return {
      'meshulam': 'משולם',
      'greeninvoice': 'חשבונית ירוקה',
      'stripe': 'Stripe',
      'paypal': 'PayPal',
      'bluesnap': 'BlueSnap',
      'payoneer': 'Payoneer'
    };
  }

  getProviderFeatures(): Record<string, { 
    paymentLinks: boolean; 
    tokenization: boolean; 
    recurring: boolean; 
    currencies: string[];
    fees: string;
    description: string;
  }> {
    return {
      'meshulam': {
        paymentLinks: true,
        tokenization: true,
        recurring: true,
        currencies: ['ILS', 'USD', 'EUR'],
        fees: '2.9% + ₪1.5',
        description: 'ספק תשלומים ישראלי מוביל עם תמיכה מלאה בכרטיסי אשראי ישראליים'
      },
      'greeninvoice': {
        paymentLinks: true,
        tokenization: true,
        recurring: true,
        currencies: ['ILS', 'USD', 'EUR'],
        fees: '2.5% + ₪1.2',
        description: 'פלטפורמת חשבוניות וחיוב ישראלית עם התממשקויות מתקדמות'
      },
      'stripe': {
        paymentLinks: true,
        tokenization: true,
        recurring: true,
        currencies: ['ILS', 'USD', 'EUR', 'GBP'],
        fees: '2.9% + $0.30',
        description: 'פלטפורמת תשלומים גלובלית מתקדמת'
      },
      'paypal': {
        paymentLinks: true,
        tokenization: false,
        recurring: true,
        currencies: ['ILS', 'USD', 'EUR'],
        fees: '3.4% + מטבע קבוע',
        description: 'פתרון תשלומים גלובלי מוכר'
      },
      'bluesnap': {
        paymentLinks: true,
        tokenization: true,
        recurring: true,
        currencies: ['ILS', 'USD', 'EUR', 'GBP'],
        fees: '2.9% + מטבע קבוע',
        description: 'פלטפורמת תשלומים גלובלית עם תמיכה מקומית'
      },
      'payoneer': {
        paymentLinks: true,
        tokenization: true,
        recurring: false,
        currencies: ['USD', 'EUR', 'GBP'],
        fees: '3% + מטבע קבוע',
        description: 'פתרון תשלומים לעסקים גלובליים'
      }
    };
  }
}

// Convenience function to create provider
export function createPaymentProvider(provider: string, config: PaymentProviderConfig): BasePaymentProvider {
  const factory = PaymentProviderFactory.getInstance();
  return factory.createProvider(provider, config);
}

// Export types and classes
export * from './base-provider';
export * from './meshulam-provider';
export * from './greeninvoice-provider';