ALTER TABLE listings ADD COLUMN payment_direction TEXT NOT NULL DEFAULT 'developer_pays_company'
  CHECK(payment_direction IN ('company_pays_developer', 'developer_pays_company'));
