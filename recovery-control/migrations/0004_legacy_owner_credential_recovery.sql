-- One-time Account 4 administrator credential recovery, explicitly requested by the owner.
-- This clears ONLY the legacy PBKDF2 dashboard-password override that crashes the free Worker login verifier.
-- The separately provisioned high-entropy CONTROL_PASSWORD_HASH secret remains the administrator login fallback.
-- No website, CMS, accounts 1-3, users, or other security records are changed.
DELETE FROM account4_security_state
WHERE key = 'hkem-control-password-v2'
  AND substr(value, 1, 6) = 'pbkdf2';
