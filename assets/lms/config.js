/* ANDESDB · Piloto LMS
 * Este archivo es PÚBLICO. Nunca incluir secretos.
 * Solo se admite una clave Supabase publishable (sb_publishable_...).
 */
window.ANDESDB_LMS_CONFIG = Object.freeze({
  enabled: false,
  supabaseUrl: '',
  supabasePublishableKey: '',
  courseSlug: 'andesdb',
  cohortSlug: 'piloto-2026',
  s7ActivitySlug: 's7-restaurante-abc',
  s7ActivityVersion: 1,
  authMode: 'email-otp',
  sessionStorageKey: 'andesdb:lms:session:v1'
});
