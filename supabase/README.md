# CREBIT Supabase Setup

This document contains important setup steps for the CREBIT application's Supabase backend.

## 1. Initial Admin User Setup

For security and reliability, the first administrator user must be created manually. This script is **idempotent** (safe to run multiple times). It will create the admin user if they don't exist, and critically, **it will reset the password and confirm the email** if they do. This is the definitive way to fix any "Invalid login credentials" or "Email not confirmed" errors.

### Instructions:

1.  Navigate to the **SQL Editor** in your Supabase project.
2.  Run the following script.

### Admin Creation / Fix Script
```sql
-- Creates or verifies the admin user and profile safely.
-- It is idempotent: if the user exists, it resets their password and confirms their email.
DO $$
DECLARE
    admin_email TEXT := 'julian.m.crebit@gmail.com';
    admin_password TEXT := '123456'; -- IMPORTANT! This will be the password.
    admin_nombre TEXT := 'Julián M.';
    admin_rol TEXT := 'admin';
    user_id UUID;
BEGIN
    SELECT id INTO user_id FROM auth.users WHERE email = admin_email;

    IF user_id IS NOT NULL THEN
        RAISE NOTICE 'Admin user % already exists. Resetting password and confirming email.', admin_email;
        -- If the user exists, forcefully update the password and confirm the email to ensure access.
        UPDATE auth.users 
        SET 
            encrypted_password = crypt(admin_password, gen_salt('bf')),
            email_confirmed_at = now()
        WHERE id = user_id;
    ELSE
        RAISE NOTICE 'Admin user % does not exist. Creating now.', admin_email;
        -- Create the user if they do not exist.
        INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
        VALUES ('00000000-0000-0000-0000-000000000000', uuid_generate_v4(), 'authenticated', 'authenticated', admin_email, crypt(admin_password, gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', jsonb_build_object('nombre', admin_nombre, 'rol', admin_rol), now(), now())
        RETURNING id INTO user_id;
    END IF;

    -- Ensure the admin's profile exists in the 'profiles' table.
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = user_id) THEN
        RAISE NOTICE 'Profile for user ID % does not exist. Creating now.', user_id;
        INSERT INTO public.profiles (id, nombre, email, rol) VALUES (user_id, admin_nombre, admin_email, admin_rol::user_role);
    ELSE
        RAISE NOTICE 'Profile for user ID % already exists.', user_id;
    END IF;
END $$;
```
After running, log in with:
-   **Email:** `julian.m.crebit@gmail.com`
-   **Password:** `123456`

---

## 2. Wompi Payment Gateway Setup

This involves creating two database functions and deploying two Edge Functions (`create-wompi-checkout` and `wompi-webhook`).

### A. Create Database Functions

Run the following two scripts in the **SQL Editor**.

#### Function 1: `recargar_saldo`
This function is called by the `wompi-webhook` to securely add funds to a company's balance after a successful payment.

```sql
-- Creates an RPC function to securely add to an empresa's saldo.
CREATE OR REPLACE FUNCTION recargar_saldo(p_empresa_id UUID, p_monto NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.empresas
  SET saldo = saldo + p_monto
  WHERE id = p_empresa_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### Function 2: `admin_adjust_saldo`
This allows the platform administrator to manually add or subtract from a company's balance from the admin dashboard.

```sql
-- Creates an RPC function for admins to adjust saldo.
-- RLS policies should ensure only authenticated admins can call this.
CREATE OR REPLACE FUNCTION admin_adjust_saldo(p_empresa_id UUID, p_monto NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE public.empresas
  SET saldo = saldo + p_monto
  WHERE id = p_empresa_id;
END;
$$ LANGUAGE plpgsql;
```

### B. Set Environment Variables (Secrets)

Both Edge Functions require secrets to operate securely.

1.  Navigate to **Edge Functions** > **Secrets** in your Supabase project.
2.  Add the following 5 secrets:
    *   `CREBIT_SUPABASE_URL`: Your project's URL (from **Project Settings > API**).
    *   `CREBIT_SUPABASE_ANON_KEY`: Your project's public `anon` key (from **Project Settings > API**).
    *   `CREBIT_SUPABASE_SERVICE_ROLE_KEY`: Your project's `service_role` key (from **Project Settings > API**). **Keep this secret!**
    *   `WOMPI_PROD_INTEGRITY_SECRET`: Your **Secreto de integridad** from the Wompi dashboard (e.g., `prod_integrity_...`).
    *   `WOMPI_PROD_EVENTS_SECRET`: Your **Secreto de eventos** from the Wompi dashboard (e.g., `prod_events_...`).

### C. Deploy Edge Functions

Deploy the two functions from your local machine using the Supabase CLI:

```bash
supabase functions deploy create-wompi-checkout
supabase functions deploy wompi-webhook
```

### D. Configure Wompi Dashboard

Finally, tell Wompi where to send payment notifications.

1.  After deploying `wompi-webhook`, you will get a URL for it.
2.  In your Wompi dashboard (in Production mode), go to **Desarrollo > Programadores**.
3.  In the "URL de Eventos" field, paste the `wompi-webhook` function URL.
4.  Click **"Guardar"**.

Your payment gateway is now fully configured for production.