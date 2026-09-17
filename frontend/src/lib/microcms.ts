import { createClient } from 'microcms-js-sdk';

// Initialize the microCMS client
export const client = createClient({
  serviceDomain: process.env.NEXT_PUBLIC_MICROCMS_SERVICE_DOMAIN || 'your-service-domain',
  apiKey: process.env.NEXT_PUBLIC_MICROCMS_API_KEY || 'your-api-key',
});
