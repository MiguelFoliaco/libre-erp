-- Custom SQL migration file, put your code below! --


CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    legal_name VARCHAR(255) NOT NULL,
    trade_name VARCHAR(255),

    registration_number VARCHAR(100),
    registration_type VARCHAR(100),

    country_code CHAR(2),

    email VARCHAR(255),
    phone VARCHAR(50),
    website VARCHAR(500),

    address_str VARCHAR(255),

    -- Defines the display order of address properties
    address_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[],

    -- Structured address data
    address JSONB NOT NULL DEFAULT '{}'::jsonb,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT companies_country_code_check
        CHECK (
            country_code IS NULL
            OR country_code ~ '^[A-Z]{2}$'
        ),

    CONSTRAINT companies_address_object_check
        CHECK (jsonb_typeof(address) = 'object'),

    CONSTRAINT companies_metadata_object_check
        CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_companies_legal_name
    ON companies(legal_name);

CREATE INDEX idx_companies_country_code
    ON companies(country_code);

CREATE INDEX idx_companies_is_active
    ON companies(is_active);


-- Enviroments

create type environment_type as enum ('development', 'production', 'test');

CREATE TABLE environments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    slug VARCHAR(100) NOT NULL,

    type environment_type NOT NULL DEFAULT 'production',

    description TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT environments_company_fk
        FOREIGN KEY (company_id)
        REFERENCES companies(id)
        ON DELETE CASCADE,

    CONSTRAINT environments_type_check
        CHECK (
            type IN ('development', 'production', 'test')
        ),

    CONSTRAINT environments_slug_check
        CHECK (slug ~ '^[a-z0-9][a-z0-9_-]*$'),

    CONSTRAINT environments_metadata_object_check
        CHECK (jsonb_typeof(metadata) = 'object'),

    CONSTRAINT environments_company_slug_unique
        UNIQUE (company_id, slug),

    CONSTRAINT environments_company_id_unique
        UNIQUE (company_id, id)
);

CREATE INDEX idx_environments_company_id
    ON environments(company_id);

CREATE INDEX idx_environments_type
    ON environments(type);

CREATE INDEX idx_environments_is_active
    ON environments(is_active);


-- Catalogos


CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    logo_url text,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, name),

    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    logo_url text,

    parent_id UUID,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, parent_id)
        REFERENCES categories(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, name),

    CHECK (parent_id IS NULL OR parent_id <> id),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    description TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, name),

    CHECK (jsonb_typeof(metadata) = 'object')
);

create type product_type as enum ('physical', 'virtual', 'service');

CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    brand_id UUID,
    category_id UUID,
    department_id UUID,

    sku VARCHAR(100),
    barcode VARCHAR(100),

    name VARCHAR(255) NOT NULL,
    description TEXT,

    product_type product_type NOT NULL DEFAULT 'physical',

    cost_price NUMERIC(20, 6) NOT NULL DEFAULT 0,
    sale_price NUMERIC(20, 6) NOT NULL DEFAULT 0,

    currency_code CHAR(3) NOT NULL,

    unit VARCHAR(30) NOT NULL DEFAULT 'unit',

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, brand_id)
        REFERENCES brands(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, category_id)
        REFERENCES categories(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, department_id)
        REFERENCES departments(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),

    CHECK (product_type IN ('physical', 'virtual', 'service')),
    CHECK (cost_price >= 0),
    CHECK (sale_price >= 0),
    CHECK (currency_code ~ '^[A-Z]{3}$'),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX idx_products_sku
    ON products(company_id, environment_id, sku)
    WHERE sku IS NOT NULL;

CREATE UNIQUE INDEX idx_products_barcode
    ON products(company_id, environment_id, barcode)
    WHERE barcode IS NOT NULL;

CREATE INDEX idx_products_category
    ON products(company_id, environment_id, category_id);

CREATE INDEX idx_products_brand
    ON products(company_id, environment_id, brand_id);


-- BODEGAS


CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, name),

    CHECK (jsonb_typeof(address) = 'object'),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    branch_id UUID,
    name VARCHAR(150) NOT NULL,
    code VARCHAR(50),

    warehouse_type VARCHAR(30) NOT NULL DEFAULT 'standard',

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, branch_id)
        REFERENCES branches(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    CHECK (
        warehouse_type IN (
            'standard',
            'returns',
            'damaged',
            'transit'
        )
    ),

    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,

    quantity NUMERIC(20, 6) NOT NULL DEFAULT 0, -- this +
    reserved_quantity NUMERIC(20, 6) NOT NULL DEFAULT 0, -- this -

    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, product_id)
        REFERENCES products(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, warehouse_id)
        REFERENCES warehouses(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, product_id, warehouse_id),

    CHECK (quantity >= 0),
    CHECK (reserved_quantity >= 0),
    CHECK (reserved_quantity <= quantity)
);


create type movement_type as enum (
    'entry',
    'exit',
    'adjustment_in',
    'adjustment_out',
    'transfer_in',
    'transfer_out',
    'reversal'
);

CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    product_id UUID NOT NULL,
    warehouse_id UUID NOT NULL,

    movement_type movement_type NOT NULL, 
    quantity NUMERIC(20, 6) NOT NULL,

    reference_type VARCHAR(50),
    reference_id UUID,

    transfer_id UUID,

    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, product_id)
        REFERENCES products(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, warehouse_id)
        REFERENCES warehouses(company_id, environment_id, id),

    CHECK (
        movement_type IN (
            'entry',
            'exit',
            'adjustment_in',
            'adjustment_out',
            'transfer_in',
            'transfer_out',
            'reversal'
        )
    ),

    CHECK (quantity > 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_inventory_movements_product
    ON inventory_movements(company_id, environment_id, product_id);

CREATE INDEX idx_inventory_movements_warehouse
    ON inventory_movements(company_id, environment_id, warehouse_id);

CREATE INDEX idx_inventory_movements_created_at
    ON inventory_movements(company_id, environment_id, created_at);



CREATE TABLE transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    transfer_number VARCHAR(100) NOT NULL,

    source_warehouse_id UUID NOT NULL,
    destination_warehouse_id UUID NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,
    approved_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    received_at TIMESTAMPTZ,

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, source_warehouse_id)
        REFERENCES warehouses(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, destination_warehouse_id)
        REFERENCES warehouses(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, transfer_number),

    CHECK (source_warehouse_id <> destination_warehouse_id),

    CHECK (
        status IN (
            'draft',
            'approved',
            'in_transit',
            'completed',
            'cancelled'
        )
    ),

    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE transfer_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    transfer_id UUID NOT NULL,
    product_id UUID NOT NULL,

    quantity NUMERIC(20, 6) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, transfer_id)
        REFERENCES transfers(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, product_id)
        REFERENCES products(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, transfer_id, product_id),

    CHECK (quantity > 0)
);


--- Personas

CREATE TABLE document_types_people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(150)
);

CREATE UNIQUE INDEX document_types_people_name_unique
ON document_types_people (LOWER(name));


CREATE TABLE people (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    first_name VARCHAR(150) NOT NULL,
    middle_name VARCHAR(150),
    last_name VARCHAR(150),
    second_last_name VARCHAR(150),

    document_types_people_id UUID NOT NULL REFERENCES document_types_people(id),
    document_number VARCHAR(100),

    email VARCHAR(255),
    phone VARCHAR(50),

    birth_date DATE,

    address_str VARCHAR(255),
    address_fields TEXT[] NOT NULL DEFAULT '{}'::TEXT[],

    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),

    CHECK (jsonb_typeof(address) = 'object'),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE UNIQUE INDEX idx_people_document
    ON people(
        company_id,
        environment_id,
        document_types_people_id,
        document_number
    )
    WHERE document_number IS NOT NULL;

CREATE INDEX idx_people_name
    ON people(company_id, environment_id, last_name, first_name);


create table customer_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL unique,
    description VARCHAR(150)
);
create unique index customer_types_name_unique
on customer_types (LOWER(name));

CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    person_id UUID NOT NULL,

    customer_code VARCHAR(100),
    customer_type_id uuid NOT NULL REFERENCES customer_types(id),

    credit_limit NUMERIC(20, 6) NOT NULL DEFAULT 0,
    payment_terms_days INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, person_id)
        REFERENCES people(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, person_id),
    UNIQUE (company_id, environment_id, customer_code),
    CHECK (credit_limit >= 0),
    CHECK (payment_terms_days >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    person_id UUID NOT NULL,

    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,

    password_hash TEXT,

    auth_provider VARCHAR(50) NOT NULL DEFAULT 'local',
    external_auth_id VARCHAR(255),

    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, person_id)
        REFERENCES people(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, username),
    UNIQUE (company_id, environment_id, email),

    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    actions TEXT[] NOT NULL DEFAULT '{}'::TEXT[],

    description TEXT,
    is_system BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, name)
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    user_id UUID NOT NULL,
    role_id UUID NOT NULL,

    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, user_id)
        REFERENCES users(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, role_id)
        REFERENCES roles(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, user_id, role_id)
);

CREATE INDEX idx_user_roles_user
    ON user_roles(company_id, environment_id, user_id);

CREATE INDEX idx_user_roles_role
    ON user_roles(company_id, environment_id, role_id);


--- Document


CREATE TABLE document_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(100) NOT NULL,

    description TEXT,

    category VARCHAR(50),

    numbering_prefix VARCHAR(30),
    next_number BIGINT NOT NULL DEFAULT 1,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    CHECK (next_number > 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE document_type_fields (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    document_type_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    label VARCHAR(150) NOT NULL,

    data_type VARCHAR(30) NOT NULL,

    is_required BOOLEAN NOT NULL DEFAULT FALSE,
    is_currency BOOLEAN NOT NULL DEFAULT FALSE,

    position INTEGER NOT NULL DEFAULT 0,

    options JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, document_type_id)
        REFERENCES document_types(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, document_type_id, name),

    CHECK (
        data_type IN (
            'text',
            'number',
            'decimal',
            'date',
            'datetime',
            'boolean',
            'currency',
            'select',
            'textarea',
            'json'
        )
    ),

    CHECK (position >= 0),
    CHECK (NOT is_currency OR data_type IN ('number', 'decimal', 'currency')),
    CHECK (jsonb_typeof(options) = 'object')
);

CREATE TABLE document_type_headers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    document_type_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,
    field_name VARCHAR(100),

    position INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, document_type_id)
        REFERENCES document_types(company_id, environment_id, id),

    CHECK (position >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE document_type_footers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    document_type_id UUID NOT NULL,

    title VARCHAR(150) NOT NULL,
    field_name VARCHAR(100),

    position INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, document_type_id)
        REFERENCES document_types(company_id, environment_id, id),

    CHECK (position >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    document_type_id UUID NOT NULL,

    document_number VARCHAR(100) NOT NULL,

    person_id UUID,
    customer_id UUID,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,

    currency_code CHAR(3) NOT NULL,

    subtotal NUMERIC(20, 6) NOT NULL DEFAULT 0,
    tax_total NUMERIC(20, 6) NOT NULL DEFAULT 0,
    discount_total NUMERIC(20, 6) NOT NULL DEFAULT 0,
    total NUMERIC(20, 6) NOT NULL DEFAULT 0,

    data JSONB NOT NULL DEFAULT '{}'::jsonb,

    notes TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, document_type_id)
        REFERENCES document_types(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, person_id)
        REFERENCES people(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, customer_id)
        REFERENCES customers(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, document_type_id, document_number),

    CHECK (
        status IN (
            'draft',
            'pending',
            'approved',
            'issued',
            'paid',
            'cancelled',
            'rejected'
        )
    ),

    CHECK (currency_code ~ '^[A-Z]{3}$'),
    CHECK (jsonb_typeof(data) = 'object'),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_documents_type
    ON documents(company_id, environment_id, document_type_id);

CREATE INDEX idx_documents_customer
    ON documents(company_id, environment_id, customer_id);

CREATE INDEX idx_documents_issue_date
    ON documents(company_id, environment_id, issue_date);

CREATE INDEX idx_documents_status
    ON documents(company_id, environment_id, status);




CREATE TABLE document_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    document_id UUID NOT NULL,
    product_id UUID,

    description TEXT NOT NULL,

    quantity NUMERIC(20, 6) NOT NULL,
    unit_price NUMERIC(20, 6) NOT NULL,

    discount_amount NUMERIC(20, 6) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(20, 6) NOT NULL DEFAULT 0,
    total NUMERIC(20, 6) NOT NULL,

    position INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, document_id)
        REFERENCES documents(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, product_id)
        REFERENCES products(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),

    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (discount_amount >= 0),
    CHECK (tax_amount >= 0),
    CHECK (position >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_document_items_document
    ON document_items(company_id, environment_id, document_id);


--- TAX


CREATE TABLE taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,

    description TEXT,

    tax_type VARCHAR(30) NOT NULL DEFAULT 'percentage',
    rate NUMERIC(12, 6) NOT NULL,

    country_code CHAR(2),
    region_code VARCHAR(100),

    is_inclusive BOOLEAN NOT NULL DEFAULT FALSE,
    is_compound BOOLEAN NOT NULL DEFAULT FALSE,

    valid_from DATE,
    valid_until DATE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    CHECK (tax_type IN ('percentage', 'fixed')),
    CHECK (rate >= 0),
    CHECK (country_code IS NULL OR country_code ~ '^[A-Z]{2}$'),
    CHECK (valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE product_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    product_id UUID NOT NULL,
    tax_id UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, product_id)
        REFERENCES products(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, tax_id)
        REFERENCES taxes(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, product_id, tax_id)
);


--- AUDITORIA


CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    actor_user_id UUID,

    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,

    action VARCHAR(50) NOT NULL,

    old_values JSONB,
    new_values JSONB,

    changes JSONB NOT NULL DEFAULT '{}'::jsonb,

    ip_address INET,
    user_agent TEXT,

    request_id VARCHAR(150),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, actor_user_id)
        REFERENCES users(company_id, environment_id, id),

    CHECK (
        action IN (
            'create',
            'update',
            'delete',
            'activate',
            'deactivate',
            'approve',
            'cancel',
            'login',
            'logout',
            'permission_change'
        )
    ),

    CHECK (jsonb_typeof(changes) = 'object'),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_audit_logs_entity
    ON audit_logs(company_id, environment_id, entity_type, entity_id);

CREATE INDEX idx_audit_logs_actor
    ON audit_logs(company_id, environment_id, actor_user_id);

CREATE INDEX idx_audit_logs_created_at
    ON audit_logs(company_id, environment_id, created_at DESC);

CREATE INDEX idx_audit_logs_action
    ON audit_logs(company_id, environment_id, action);



CREATE TABLE accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    parent_id UUID,

    code VARCHAR(50) NOT NULL,
    name VARCHAR(150) NOT NULL,

    account_type VARCHAR(30) NOT NULL,
    normal_balance VARCHAR(10) NOT NULL,

    is_postable BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, parent_id)
        REFERENCES accounts(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    CHECK (parent_id IS NULL OR parent_id <> id),

    CHECK (
        account_type IN (
            'asset',
            'liability',
            'equity',
            'income',
            'expense',
            'cost'
        )
    ),

    CHECK (normal_balance IN ('debit', 'credit')),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE fiscal_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,

    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'open',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, name),

    CHECK (end_date >= start_date),
    CHECK (status IN ('open', 'closed', 'locked'))
);

CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    fiscal_period_id UUID NOT NULL,

    entry_number VARCHAR(100) NOT NULL,

    description TEXT NOT NULL,

    entry_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    document_id UUID,

    created_by UUID,
    posted_by UUID,
    posted_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, fiscal_period_id)
        REFERENCES fiscal_periods(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, document_id)
        REFERENCES documents(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, entry_number),

    CHECK (status IN ('draft', 'posted', 'reversed')),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    journal_entry_id UUID NOT NULL,
    account_id UUID NOT NULL,

    description TEXT,

    debit NUMERIC(20, 6) NOT NULL DEFAULT 0,
    credit NUMERIC(20, 6) NOT NULL DEFAULT 0,

    currency_code CHAR(3) NOT NULL,
    exchange_rate NUMERIC(20, 10) NOT NULL DEFAULT 1,

    party_id UUID,

    position INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, journal_entry_id)
        REFERENCES journal_entries(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, account_id)
        REFERENCES accounts(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, party_id)
        REFERENCES people(company_id, environment_id, id),

    CHECK (debit >= 0),
    CHECK (credit >= 0),
    CHECK (
        (debit > 0 AND credit = 0)
        OR
        (credit > 0 AND debit = 0)
    ),

    CHECK (currency_code ~ '^[A-Z]{3}$'),
    CHECK (exchange_rate > 0),
    CHECK (position >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_journal_entries_date
    ON journal_entries(company_id, environment_id, entry_date);

CREATE INDEX idx_journal_entries_status
    ON journal_entries(company_id, environment_id, status);

CREATE INDEX idx_journal_lines_account
    ON journal_entry_lines(company_id, environment_id, account_id);

CREATE INDEX idx_journal_lines_entry
    ON journal_entry_lines(company_id, environment_id, journal_entry_id);



CREATE TABLE document_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    document_id UUID NOT NULL,
    document_item_id UUID,
    tax_id UUID,

    tax_name VARCHAR(150) NOT NULL,
    tax_code VARCHAR(50),

    tax_rate NUMERIC(12, 6) NOT NULL,
    taxable_base NUMERIC(20, 6) NOT NULL,
    tax_amount NUMERIC(20, 6) NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, document_id)
        REFERENCES documents(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, document_item_id)
        REFERENCES document_items(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, tax_id)
        REFERENCES taxes(company_id, environment_id, id),

    CHECK (tax_rate >= 0),
    CHECK (taxable_base >= 0),
    CHECK (tax_amount >= 0)
);

CREATE INDEX idx_document_taxes_document
    ON document_taxes(company_id, environment_id, document_id);



ALTER TABLE inventory_movements
ADD CONSTRAINT inventory_movements_transfer_fk
FOREIGN KEY (company_id, environment_id, transfer_id)
REFERENCES transfers(company_id, environment_id, id);


--- POS System


CREATE TABLE cash_registers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    branch_id UUID,
    warehouse_id UUID NOT NULL,

    name VARCHAR(150) NOT NULL,
    code VARCHAR(50) NOT NULL,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, branch_id)
        REFERENCES branches(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, warehouse_id)
        REFERENCES warehouses(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    CHECK (jsonb_typeof(metadata) = 'object')
);



CREATE TABLE cash_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    cash_register_id UUID NOT NULL,

    opened_by UUID NOT NULL,
    closed_by UUID,

    status VARCHAR(20) NOT NULL DEFAULT 'open',

    currency_code CHAR(3) NOT NULL,

    opening_amount NUMERIC(20, 6) NOT NULL DEFAULT 0,
    expected_amount NUMERIC(20, 6),
    closing_amount NUMERIC(20, 6),
    difference_amount NUMERIC(20, 6),

    opening_notes TEXT,
    closing_notes TEXT,

    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, cash_register_id)
        REFERENCES cash_registers(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, opened_by)
        REFERENCES users(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, closed_by)
        REFERENCES users(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),

    CHECK (status IN ('open', 'closed')),
    CHECK (opening_amount >= 0),
    CHECK (currency_code ~ '^[A-Z]{3}$'),
    CHECK (jsonb_typeof(metadata) = 'object'),

    CHECK (
        (status = 'open' AND closed_at IS NULL)
        OR
        (status = 'closed' AND closed_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX idx_cash_sessions_one_open_per_register
    ON cash_sessions(company_id, environment_id, cash_register_id)
    WHERE status = 'open';

CREATE INDEX idx_cash_sessions_opened_by
    ON cash_sessions(company_id, environment_id, opened_by);

CREATE INDEX idx_cash_sessions_opened_at
    ON cash_sessions(company_id, environment_id, opened_at);



CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) NOT NULL,

    payment_type VARCHAR(30) NOT NULL,

    requires_reference BOOLEAN NOT NULL DEFAULT FALSE,

    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    CHECK (
        payment_type IN (
            'cash',
            'card',
            'bank_transfer',
            'digital_wallet',
            'credit',
            'other'
        )
    ),

    CHECK (jsonb_typeof(metadata) = 'object')
);



CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    cash_register_id UUID,
    cash_session_id UUID,

    warehouse_id UUID NOT NULL,

    customer_id UUID,
    seller_id UUID NOT NULL,

    document_id UUID,

    sale_number VARCHAR(100) NOT NULL,

    status VARCHAR(30) NOT NULL DEFAULT 'draft',

    sale_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    currency_code CHAR(3) NOT NULL,

    subtotal NUMERIC(20, 6) NOT NULL DEFAULT 0,
    discount_total NUMERIC(20, 6) NOT NULL DEFAULT 0,
    tax_total NUMERIC(20, 6) NOT NULL DEFAULT 0,
    total NUMERIC(20, 6) NOT NULL DEFAULT 0,

    paid_total NUMERIC(20, 6) NOT NULL DEFAULT 0,
    change_total NUMERIC(20, 6) NOT NULL DEFAULT 0,

    notes TEXT,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id),

    FOREIGN KEY (company_id, environment_id, cash_register_id)
        REFERENCES cash_registers(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, cash_session_id)
        REFERENCES cash_sessions(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, warehouse_id)
        REFERENCES warehouses(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, customer_id)
        REFERENCES customers(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, seller_id)
        REFERENCES users(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, document_id)
        REFERENCES documents(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, sale_number),

    CHECK (
        status IN (
            'draft',
            'completed',
            'cancelled',
            'partially_refunded',
            'refunded'
        )
    ),

    CHECK (currency_code ~ '^[A-Z]{3}$'),
    CHECK (subtotal >= 0),
    CHECK (discount_total >= 0),
    CHECK (tax_total >= 0),
    CHECK (total >= 0),
    CHECK (paid_total >= 0),
    CHECK (change_total >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_sales_customer
    ON sales(company_id, environment_id, customer_id);

CREATE INDEX idx_sales_seller
    ON sales(company_id, environment_id, seller_id);

CREATE INDEX idx_sales_date
    ON sales(company_id, environment_id, sale_date DESC);

CREATE INDEX idx_sales_status
    ON sales(company_id, environment_id, status);

CREATE INDEX idx_sales_session
    ON sales(company_id, environment_id, cash_session_id);



CREATE TABLE sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    sale_id UUID NOT NULL,
    product_id UUID,

    product_name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    barcode VARCHAR(100),

    quantity NUMERIC(20, 6) NOT NULL,

    unit VARCHAR(30) NOT NULL,

    unit_price NUMERIC(20, 6) NOT NULL,

    discount_amount NUMERIC(20, 6) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(20, 6) NOT NULL DEFAULT 0,

    subtotal NUMERIC(20, 6) NOT NULL,
    total NUMERIC(20, 6) NOT NULL,

    position INTEGER NOT NULL DEFAULT 0,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, sale_id)
        REFERENCES sales(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, product_id)
        REFERENCES products(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),

    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (discount_amount >= 0),
    CHECK (tax_amount >= 0),
    CHECK (subtotal >= 0),
    CHECK (total >= 0),
    CHECK (position >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_sale_items_sale
    ON sale_items(company_id, environment_id, sale_id);

CREATE INDEX idx_sale_items_product
    ON sale_items(company_id, environment_id, product_id);



CREATE TABLE sale_item_taxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    sale_item_id UUID NOT NULL,
    tax_id UUID,

    tax_name VARCHAR(150) NOT NULL,
    tax_code VARCHAR(50),

    tax_rate NUMERIC(12, 6) NOT NULL,

    taxable_base NUMERIC(20, 6) NOT NULL,
    tax_amount NUMERIC(20, 6) NOT NULL,

    is_inclusive BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, sale_item_id)
        REFERENCES sale_items(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, tax_id)
        REFERENCES taxes(company_id, environment_id, id),

    CHECK (tax_rate >= 0),
    CHECK (taxable_base >= 0),
    CHECK (tax_amount >= 0)
);

CREATE INDEX idx_sale_item_taxes_item
    ON sale_item_taxes(company_id, environment_id, sale_item_id);



CREATE TABLE sale_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    sale_id UUID NOT NULL,
    payment_method_id UUID NOT NULL,

    amount NUMERIC(20, 6) NOT NULL,

    reference VARCHAR(255),

    status VARCHAR(20) NOT NULL DEFAULT 'confirmed',

    received_by UUID,

    paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, sale_id)
        REFERENCES sales(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, payment_method_id)
        REFERENCES payment_methods(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, received_by)
        REFERENCES users(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),

    CHECK (amount > 0),
    CHECK (status IN ('pending', 'confirmed', 'failed', 'refunded')),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_sale_payments_sale
    ON sale_payments(company_id, environment_id, sale_id);

CREATE INDEX idx_sale_payments_method
    ON sale_payments(company_id, environment_id, payment_method_id);



CREATE TABLE cash_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    cash_session_id UUID NOT NULL,

    movement_type VARCHAR(30) NOT NULL,

    amount NUMERIC(20, 6) NOT NULL,

    description TEXT,

    reference_type VARCHAR(50),
    reference_id UUID,

    created_by UUID NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, cash_session_id)
        REFERENCES cash_sessions(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, created_by)
        REFERENCES users(company_id, environment_id, id),

    CHECK (
        movement_type IN (
            'opening',
            'sale',
            'cash_in',
            'cash_out',
            'refund',
            'withdrawal',
            'closing_adjustment'
        )
    ),

    CHECK (amount > 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE INDEX idx_cash_movements_session
    ON cash_movements(company_id, environment_id, cash_session_id);

CREATE INDEX idx_cash_movements_created_at
    ON cash_movements(company_id, environment_id, created_at);



CREATE TABLE sale_returns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    sale_id UUID NOT NULL,

    return_number VARCHAR(100) NOT NULL,

    status VARCHAR(20) NOT NULL DEFAULT 'draft',

    reason TEXT,

    subtotal NUMERIC(20, 6) NOT NULL DEFAULT 0,
    tax_total NUMERIC(20, 6) NOT NULL DEFAULT 0,
    total NUMERIC(20, 6) NOT NULL DEFAULT 0,

    created_by UUID NOT NULL,
    approved_by UUID,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ,

    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,

    FOREIGN KEY (company_id, environment_id, sale_id)
        REFERENCES sales(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, created_by)
        REFERENCES users(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, approved_by)
        REFERENCES users(company_id, environment_id, id),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, return_number),

    CHECK (status IN ('draft', 'approved', 'rejected')),
    CHECK (subtotal >= 0),
    CHECK (tax_total >= 0),
    CHECK (total >= 0),
    CHECK (jsonb_typeof(metadata) = 'object')
);

CREATE TABLE sale_return_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,

    sale_return_id UUID NOT NULL,
    sale_item_id UUID NOT NULL,

    quantity NUMERIC(20, 6) NOT NULL,

    unit_price NUMERIC(20, 6) NOT NULL,
    tax_amount NUMERIC(20, 6) NOT NULL DEFAULT 0,
    total NUMERIC(20, 6) NOT NULL,

    disposition VARCHAR(30) NOT NULL DEFAULT 'restock',

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    FOREIGN KEY (company_id, environment_id, sale_return_id)
        REFERENCES sale_returns(company_id, environment_id, id),

    FOREIGN KEY (company_id, environment_id, sale_item_id)
        REFERENCES sale_items(company_id, environment_id, id),

    CHECK (quantity > 0),
    CHECK (unit_price >= 0),
    CHECK (tax_amount >= 0),
    CHECK (total >= 0),

    CHECK (
        disposition IN (
            'restock',
            'damaged',
            'discarded'
        )
    )
);

CREATE INDEX idx_sale_returns_sale
    ON sale_returns(company_id, environment_id, sale_id);
