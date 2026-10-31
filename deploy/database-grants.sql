-- Run as the database administrator after creating the two login roles.
-- Set passwords interactively with psql \password; connection URLs belong only in Secret Manager.
GRANT CONNECT ON DATABASE :"DBNAME" TO ms_agentic_migrate, ms_agentic_runtime;
GRANT CREATE ON DATABASE :"DBNAME" TO ms_agentic_migrate;
REVOKE CREATE ON SCHEMA public FROM PUBLIC;
GRANT USAGE, CREATE ON SCHEMA public TO ms_agentic_migrate;
GRANT USAGE ON SCHEMA public TO ms_agentic_runtime;

-- The migrator owns both framework and application objects; runtime only uses their data.
ALTER DEFAULT PRIVILEGES FOR ROLE ms_agentic_migrate IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ms_agentic_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE ms_agentic_migrate IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO ms_agentic_runtime;

-- Create the Mastra schema under the same owner before migration initialization.
CREATE SCHEMA IF NOT EXISTS mastra AUTHORIZATION ms_agentic_migrate;
GRANT USAGE ON SCHEMA mastra TO ms_agentic_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE ms_agentic_migrate IN SCHEMA mastra
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ms_agentic_runtime;
ALTER DEFAULT PRIVILEGES FOR ROLE ms_agentic_migrate IN SCHEMA mastra
  GRANT USAGE, SELECT ON SEQUENCES TO ms_agentic_runtime;

-- Re-running grants also repairs access on objects already created by this owner.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public, mastra TO ms_agentic_runtime;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public, mastra TO ms_agentic_runtime;
