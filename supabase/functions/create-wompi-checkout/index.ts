// @ts-nocheck - this file runs in Deno on the Edge (remote imports and Deno globals)
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// The runtime for Edge Functions is Deno; declare minimal shape so TypeScript
// in the editor doesn't complain about the global `Deno` identifier.
declare const Deno: {
  env: {
    get(name: string): string | undefined;
  };
};

// Use APP_ALLOWED_ORIGIN env var in production to lock the origin
const defaultAllowedOrigin = '*';
const APP_ALLOWED_ORIGIN = Deno.env.get('APP_ALLOWED_ORIGIN') || defaultAllowedOrigin;
const corsHeaders = {
  'Access-Control-Allow-Origin': APP_ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, referer, x-supabase-edge-version',
};

async function sha256(message: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders, status: 200 });
  }

  try {
    // 1. Obtener los secretos
    const supabaseUrl = Deno.env.get('CREBIT_SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('CREBIT_SUPABASE_ANON_KEY');
    const wompiIntegritySecret = Deno.env.get('WOMPI_PROD_INTEGRITY_SECRET');

    if (!supabaseUrl || !supabaseAnonKey || !wompiIntegritySecret) {
        console.error("Faltan variables de entorno críticas.");
        return new Response(JSON.stringify({ error: 'Error de configuración del servidor.' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    // 2. Autenticar al usuario (¡MÁS ROBUSTO!)
    // Quitamos el '!' y verificamos manualmente.
    const authHeader = req.headers.get('Authorization'); 
    
    // MEJORA 1: Verificar si el header existe antes de usarlo
    if (!authHeader) {
      console.error("Llamada sin encabezado de autorización.");
      return new Response(JSON.stringify({ error: 'Falta el encabezado de autorización.' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
        console.error("Error de autenticación:", userError?.message);
        return new Response(JSON.stringify({ error: 'Autenticación fallida. Por favor, inicia sesión de nuevo.' }), { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 3. Obtener el monto (¡MÁS ROBUSTO!)
    let amountInCents: number | undefined;
    try {
      // MEJORA 2: Aislar el req.json() en su propio try...catch
      const body = await req.json();
      amountInCents = body.amountInCents;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Error al parsear el body JSON:", msg);
      return new Response(JSON.stringify({ error: 'Cuerpo (body) de la solicitud inválido o vacío.' }), {
        status: 400, // Bad Request
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    if (!amountInCents || typeof amountInCents !== 'number' || amountInCents <= 0) {
        return new Response(JSON.stringify({ error: 'Se debe proveer un "amountInCents" válido.' }), { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        });
    }

    // 4. Generar la referencia y la firma
    const reference = `crebit-${user.id}-${Date.now()}`;
    const currency = 'COP';
    const concatenation = `${reference}${amountInCents}${currency}${wompiIntegritySecret}`;
    const signature = await sha256(concatenation);

    // 7. Éxito
    return new Response(
      JSON.stringify({ reference, signature }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: unknown) {
    // El catch global
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Error inesperado en la función:', msg);
    return new Response(
      JSON.stringify({ error: 'Ocurrió un error interno en el servidor.' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});