// Fix: Replaced the triple-slash directive with a direct import to ensure TypeScript finds the type definitions.
import 'vite/client';

// Centralize global type definitions in this file to prevent redeclaration errors.
declare global {
  // Fix: Moved ImportMetaEnv and ImportMeta inside `declare global` to correctly augment
  // the global scope from within a module. This resolves errors related to `import.meta.env`
  // not being found and allows the `vite/client` types to be processed correctly.

  // Add explicit type definitions for environment variables accessed via `import.meta.env`.
  // This resolves TypeScript errors about 'env' not existing on 'ImportMeta'.
  interface ImportMetaEnv {
      readonly VITE_SUPABASE_URL: string;
      readonly VITE_SUPABASE_ANON_KEY: string;
      readonly VITE_WOMPI_PUBLIC_KEY: string;
  }

  interface ImportMeta {
      readonly env: ImportMetaEnv;
  }
  
  // Define Wompi's WidgetCheckout on the global window object.
  interface Window {
    WidgetCheckout: new (config: {
      currency: string;
      amountInCents: number;
      reference: string;
      publicKey: string;
      redirectUrl?: string;
      'signature:integrity'?: string;
      customerData?: {
        email: string;
        fullName: string;
        phoneNumber?: string;
        legalId?: string;
        legalIdType?: string;
      };
    }) => {
      open: (callback: (result: any) => void) => void;
      close: () => void;
    };
  }

  // Provide type support for Supabase Edge Functions in a non-Deno environment.
  namespace Deno {
    interface Env {
      get(key: string): string | undefined;
    }
    const env: Env;
  }
}

// This export statement is added to make this file a module.
// It doesn't affect the global declarations but satisfies TypeScript's module system.
export {};