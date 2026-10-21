# Architecture rules
- Authenticate staff through the master-login Edge Function with server-held credentials and derive privileges from public.user_roles after validating the Auth session; never trust local role flags or expose passwords in browser code.
- Keep login throttling server-side in login_attempts with an atomic attempt counter to prevent client-side bypass.