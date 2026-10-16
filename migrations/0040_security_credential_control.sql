-- A credential-control marker only. No existing user, password or role is altered.
CREATE TABLE IF NOT EXISTS access_security_credentials(user_id INTEGER PRIMARY KEY,local_password_only INTEGER NOT NULL DEFAULT 1);
