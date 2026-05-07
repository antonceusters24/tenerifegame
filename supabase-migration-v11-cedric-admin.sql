-- Migration v11: Add Cédric as admin user

INSERT INTO users (name, pin, role)
VALUES ('Cédric', '0000', 'admin')
ON CONFLICT (name) DO NOTHING;
