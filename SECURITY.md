# Seguridad y buenas prácticas para Crebit / MarketLeads

Este documento resume medidas prácticas para mantener la aplicación segura en desarrollo y producción.

1) Mantén las claves SECRETAS fuera del repositorio
   - Nunca comites la `service_role` key de Supabase ni otras claves de administración.
   - Usa variables de entorno en el hosting / funciones (ej. `CREBIT_SUPABASE_SERVICE_ROLE_KEY`).
   - Asegúrate de que `VITE_` variables (usadas en el cliente) no contengan claves con privilegios de administrador.

2) Row Level Security (RLS)
   - Activa RLS en tablas sensibles (p.ej. `empresas`, `compras`, `lead_reports`) y crea policies mínimas por rol.
   - Expone solo los campos necesarios al cliente; las mutaciones sensibles deben realizarse vía RPC/Functions.

3) RPCs y SQL
   - Implementa lógica sensible (p.ej. recargas de saldo) en funciones RPC del lado del servidor.
   - Evita concatenación dinámica de SQL. Usa parámetros/arguments de las funciones o sentencias preparadas.

4) Validación y sanitización
   - Valida y sanea entradas tanto en cliente como servidor (tipos, longitudes y formatos).
   - Usa validadores centralizados (`src/utils/validators.ts`) y pruebas unitarias.

5) CORS y orígenes
   - En funciones Edge y webhooks, configura `APP_ALLOWED_ORIGIN` a la URL de tu frontend en producción.
   - Evita usar `'*'` en producción.

6) Cabeceras y CSP
   - Configure cabeceras: Content-Security-Policy, Strict-Transport-Security, X-Frame-Options y X-Content-Type-Options.

7) Keys y despliegue
   - Mantén un `.env.example` con las variables esperadas (sin valores reales).
   - Revisa los roles y permisos en el dashboard de Supabase antes del despliegue.

Checklist rápido antes de producción:
 - [ ] RLS activado y probado
 - [ ] `service_role` sólo en funciones serverless / entornos protegidos
 - [ ] APP_ALLOWED_ORIGIN configurado
 - [ ] Pruebas de validadores añadidas
 - [ ] CSP y cabeceras de seguridad activadas en hosting
