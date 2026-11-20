CREATE TABLE suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    person_id UUID NOT NULL,
    supplier_code VARCHAR(100),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, person_id)
        REFERENCES people(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, person_id),
    UNIQUE (company_id, environment_id, supplier_code),

    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_suppliers_person
    ON suppliers(company_id, environment_id, person_id);

ALTER TABLE inventory_movements
    ADD COLUMN supplier_id UUID;

ALTER TABLE inventory_movements
    ADD CONSTRAINT inventory_movements_supplier_fk
    FOREIGN KEY (company_id, environment_id, supplier_id)
    REFERENCES suppliers(company_id, environment_id, id);

ALTER TABLE inventory_movements
    ADD CONSTRAINT inventory_movements_supplier_source_check
    CHECK (supplier_id IS NULL OR (movement_type = 'entry' AND reference_type = 'supplier'));
