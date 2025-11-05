// supabase/functions/wompi-webhook/index.ts

// @ts-nocheck - this file runs in Deno on the Edge (remote imports and Deno globals)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Declare minimal Deno shape for the editor/typechecker so references to Deno.env don't error.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

// Define CORS headers. In production, set APP_ALLOWED_ORIGIN to a specific origin.
const defaultAllowedOrigin = '*';
const APP_ALLOWED_ORIGIN = Deno.env.get('APP_ALLOWED_ORIGIN') || defaultAllowedOrigin;
const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, referer, x-supabase-edge-version',
};

// Helper for SHA-256 Hashing
async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  // This is a standard way to handle CORS preflight requests.
  // It's crucial that this response is sent before any other logic.
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 1. Get secrets from environment variables and validate them
    const wompiEventsSecret = Deno.env.get('WOMPI_PROD_EVENTS_SECRET');
    const supabaseUrl = Deno.env.get('CREBIT_SUPABASE_URL');
    const serviceRoleKey = Deno.env.get('CREBIT_SUPABASE_SERVICE_ROLE_KEY');
    
    if (!wompiEventsSecret || !supabaseUrl || !serviceRoleKey) {
        throw new Error('Missing environment variables. Ensure WOMPI_PROD_EVENTS_SECRET, CREBIT_SUPABASE_URL, and CREBIT_SUPABASE_SERVICE_ROLE_KEY are set.');
    }

    // 2. Parse the incoming request body from Wompi
  const body = await req.json();
  const { data, signature, timestamp, event } = body as any;
  const { transaction } = data || {};

    // 3. SECURITY: Verify the event signature to ensure it's from Wompi
    // For an 'APPROVED' transaction, the signature is a concatenation of specific fields.
    const concatenation = [
      transaction.id,
      transaction.status,
      transaction.amount_in_cents,
      timestamp,
      wompiEventsSecret
    ].join('');

    const calculatedSignature = await sha256(concatenation);
    
    if (!signature || calculatedSignature !== signature.checksum) {
      console.warn('Invalid signature received from Wompi webhook.');
      return new Response('Invalid signature', { 
        status: 401,
        headers: corsHeaders,
      });
    }

    // 4. BUSINESS LOGIC: Process only successful transactions
    if (event === 'transaction.updated' && transaction.status === 'APPROVED') {
      const reference = transaction.reference;
      const amountInCents = transaction.amount_in_cents;

      // The reference is in the format 'crebit-EMPRESA_UUID-TIMESTAMP'
      const empresaId = reference.split('-')[1];
      const amountInPesos = amountInCents / 100;

      if (!empresaId || isNaN(amountInPesos) || amountInPesos <= 0) {
        throw new Error(`Invalid data parsed from transaction reference: ${reference}`);
      }

      // 5. DATABASE UPDATE: Securely update the balance via an RPC call
      const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

      const { error: rpcError } = await supabaseAdmin.rpc('recargar_saldo', {
        p_empresa_id: empresaId,
        p_monto: amountInPesos,
      });

      if (rpcError) {
        throw new Error(`Failed to update balance for ${empresaId}: ${rpcError.message}`);
      }

      console.log(`Successfully processed recharge for empresa ${empresaId} of ${amountInPesos}`);
    }

    // 6. Acknowledge receipt to Wompi
    return new Response(JSON.stringify({ received: true }), {
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error in Wompi webhook handler:', msg);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
});