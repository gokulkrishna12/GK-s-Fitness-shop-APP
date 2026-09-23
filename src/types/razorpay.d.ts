declare module 'react-native-razorpay' {
  export default class RazorpayCheckout {
    static open(options: {
      key: string;
      amount: number | string;
      currency: string;
      name: string;
      description?: string;
      image?: string;
      order_id: string;
      prefill?: {
        email?: string;
        contact?: string;
        name?: string;
      };
      theme?: {
        color?: string;
      };
      retry?: {
        enabled?: boolean;
      };
    }): Promise<{
      razorpay_payment_id: string;
      razorpay_order_id: string;
      razorpay_signature: string;
    }>;
  }
}