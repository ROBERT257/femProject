-- +goose Up
-- +goose StatementBegin
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_role_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_role_check CHECK (role IN ('admin', 'therapist', 'patient'));

UPDATE accounts
SET role = 'admin', created_by = 'system', updated_at = CURRENT_TIMESTAMP
WHERE login_id = 'THR-ADMIN001';
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
ALTER TABLE accounts DROP CONSTRAINT IF EXISTS accounts_role_check;
ALTER TABLE accounts ADD CONSTRAINT accounts_role_check CHECK (role IN ('therapist', 'patient'));

UPDATE accounts
SET role = 'therapist', created_by = 'system', updated_at = CURRENT_TIMESTAMP
WHERE login_id = 'THR-ADMIN001';
-- +goose StatementEnd