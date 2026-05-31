-- Track how many drip emails have been sent to each lead
-- 0 = só recebeu o email inicial com o PDF
-- 1 = recebeu o email 2 (dia 3)
-- 2 = recebeu o email 3 (dia 7)
-- 3 = recebeu o email 4 (dia 14) — sequência completa
ALTER TABLE leads ADD COLUMN IF NOT EXISTS emails_sent integer DEFAULT 0;
