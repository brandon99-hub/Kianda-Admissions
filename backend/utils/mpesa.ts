
import dotenv from 'dotenv';

dotenv.config();

const MPESA_ENVIRONMENT = process.env.MPESA_ENVIRONMENT || 'sandbox';
const CONSUMER_KEY = process.env.CONSUMER_KEY || '';
const CONSUMER_SECRET = process.env.CONSUMER_SECRET || '';
const SHORTCODE = process.env.MPESA_SHORTCODE || '174379';
const PASSKEY = process.env.MPESA_PASSKEY || '';
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || '';

const BASE_URL = MPESA_ENVIRONMENT === 'sandbox' 
  ? 'https://sandbox.safaricom.co.ke' 
  : 'https://api.safaricom.co.ke';

/**
 * Gets an OAuth token from Daraja API
 */
export async function getMpesaToken(): Promise<string> {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  
  try {
    const response = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get M-PESA token: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('M-PESA Token Error:', error);
    throw error;
  }
}

/**
 * Initiates an STK Push to the given phone number
 */
export async function initiateSTKPush(
  phoneNumber: string, 
  amount: number, 
  accountReference: string,
  transactionDesc: string = 'Payment'
): Promise<string> {
  const token = await getMpesaToken();
  
  // Format phone number to 254... if it starts with 0
  let formattedPhone = phoneNumber.replace(/\s+/g, '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('+')) {
    formattedPhone = formattedPhone.substring(1);
  }

  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: SHORTCODE,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: formattedPhone,
    PartyB: SHORTCODE,
    PhoneNumber: formattedPhone,
    CallBackURL: CALLBACK_URL,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc
  };

  try {
    const response = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.errorCode || data.errorMessage) {
      throw new Error(`STK Push Failed: ${data.errorMessage || JSON.stringify(data)}`);
    }

    // Safaricom returns CheckoutRequestID
    return data.CheckoutRequestID;
  } catch (error) {
    console.error('STK Push Error:', error);
    throw error;
  }
}
