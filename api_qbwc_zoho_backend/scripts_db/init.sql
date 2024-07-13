DO $$ 
BEGIN
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'api_qbwc_zoho_dev_db') THEN
      CREATE DATABASE api_qbwc_zoho_dev_db;
   END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'api_qbwc_zoho_qa_db') THEN
      CREATE DATABASE api_qbwc_zoho_qa_db;
   END IF;
   IF NOT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'api_qbwc_zoho_prod_db') THEN
      CREATE DATABASE api_qbwc_zoho_prod_db;
   END IF;

END
$$;
