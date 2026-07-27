-- Seed: demo organization + initial admin user.
-- Run this ONCE, after the schema exists (i.e. after `migration:run`).
-- Idempotent: ON CONFLICT DO NOTHING means re-running is safe and won't duplicate.
--
-- Default login created below:
--   email:    admin@metgo.com
--   password: admin123        <-- CHANGE THIS IN PRODUCTION
--
-- To use your own password, generate a bcrypt hash and replace the password_hash value:
--   npx ts-node -e "import bcrypt from 'bcryptjs'; bcrypt.hash('yourpassword', 12).then(console.log)"

INSERT INTO organizations (id, name)
VALUES ('00000000-0000-0000-0000-000000000001', 'MetGo Demo')
ON CONFLICT DO NOTHING;

INSERT INTO profiles (id, organization_id, full_name, email, password_hash, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Admin User',
  'admin@metgo.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4K.XQ5fE9xvwXEAa', -- bcrypt("admin123")
  'admin'
)
ON CONFLICT DO NOTHING;
