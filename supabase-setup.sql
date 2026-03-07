-- =============================================
-- MetGo CRM - Supabase Database Setup
-- Run this in the Supabase SQL Editor
-- =============================================

-- Organizations (single row for MetGo)
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Insert MetGo organization
INSERT INTO organizations (name) VALUES ('MetGo') ON CONFLICT DO NOTHING;

-- Profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id),
  full_name       TEXT NOT NULL,
  role            TEXT NOT NULL DEFAULT 'agent' CHECK (role IN ('admin', 'agent')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clients (Regional Councils)
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'negotiation', 'paused', 'closed')),
  region          TEXT,
  address         TEXT,
  website         TEXT,
  notes           TEXT,
  assigned_to     UUID REFERENCES profiles(id),
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clients_org ON clients(organization_id);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_deleted ON clients(deleted_at);

-- Contacts (People at councils)
CREATE TABLE IF NOT EXISTS contacts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  client_id       UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  first_name      TEXT NOT NULL,
  last_name       TEXT NOT NULL,
  role_title      TEXT,
  phone           TEXT,
  email           TEXT,
  whatsapp        TEXT,
  is_primary      BOOLEAN NOT NULL DEFAULT false,
  notes           TEXT,
  deleted_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_contacts_client ON contacts(client_id);
CREATE INDEX IF NOT EXISTS idx_contacts_org ON contacts(organization_id);

-- Communications (immutable log)
CREATE TABLE IF NOT EXISTS communications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id   UUID NOT NULL REFERENCES organizations(id),
  client_id         UUID NOT NULL REFERENCES clients(id),
  contact_id        UUID REFERENCES contacts(id),
  user_id           UUID NOT NULL REFERENCES profiles(id),
  type              TEXT NOT NULL CHECK (type IN ('sms', 'email', 'whatsapp', 'call', 'meeting', 'note')),
  direction         TEXT NOT NULL DEFAULT 'outbound' CHECK (direction IN ('outbound', 'inbound')),
  subject           TEXT,
  body              TEXT NOT NULL,
  status            TEXT,
  inforu_message_id TEXT,
  sent_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comms_client ON communications(client_id);
CREATE INDEX IF NOT EXISTS idx_comms_org ON communications(organization_id);
CREATE INDEX IF NOT EXISTS idx_comms_created ON communications(created_at DESC);

-- Templates (message templates)
CREATE TABLE IF NOT EXISTS templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  name            TEXT NOT NULL,
  type            TEXT NOT NULL CHECK (type IN ('sms', 'email', 'whatsapp')),
  subject         TEXT,
  body            TEXT NOT NULL,
  variables       TEXT[] NOT NULL DEFAULT '{}',
  created_by      UUID REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reminders (follow-up reminders)
CREATE TABLE IF NOT EXISTS reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id         UUID NOT NULL REFERENCES profiles(id),
  client_id       UUID REFERENCES clients(id) ON DELETE SET NULL,
  title           TEXT NOT NULL,
  notes           TEXT,
  due_at          TIMESTAMPTZ NOT NULL,
  is_done         BOOLEAN NOT NULL DEFAULT false,
  done_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reminders_user ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(due_at ASC);
CREATE INDEX IF NOT EXISTS idx_reminders_done ON reminders(is_done);

-- =============================================
-- Triggers for updated_at
-- =============================================

CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON templates FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER set_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION handle_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =============================================
-- Auto-create profile on user signup
-- =============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, organization_id, full_name)
  VALUES (
    NEW.id,
    (SELECT id FROM organizations LIMIT 1),
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =============================================
-- Row Level Security (RLS)
-- =============================================

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE communications ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "org_isolation" ON clients;
DROP POLICY IF EXISTS "org_isolation" ON contacts;
DROP POLICY IF EXISTS "org_isolation" ON communications;
DROP POLICY IF EXISTS "org_isolation" ON templates;
DROP POLICY IF EXISTS "org_isolation" ON reminders;
DROP POLICY IF EXISTS "own_profile" ON profiles;
DROP POLICY IF EXISTS "org_profiles" ON profiles;
DROP POLICY IF EXISTS "own_org" ON organizations;

-- Helper function to get user's org
CREATE OR REPLACE FUNCTION get_my_org_id()
RETURNS UUID AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Policies
CREATE POLICY "org_isolation" ON clients
  FOR ALL USING (organization_id = get_my_org_id());

CREATE POLICY "org_isolation" ON contacts
  FOR ALL USING (organization_id = get_my_org_id());

CREATE POLICY "org_isolation" ON communications
  FOR ALL USING (organization_id = get_my_org_id());

CREATE POLICY "org_isolation" ON templates
  FOR ALL USING (organization_id = get_my_org_id());

CREATE POLICY "org_isolation" ON reminders
  FOR ALL USING (organization_id = get_my_org_id());

CREATE POLICY "own_profile" ON profiles
  FOR ALL USING (id = auth.uid() OR organization_id = get_my_org_id());

CREATE POLICY "own_org" ON organizations
  FOR SELECT USING (id = get_my_org_id());
