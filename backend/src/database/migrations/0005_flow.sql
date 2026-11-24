-- Custom SQL migration file, put your code below! --
-- ESTA TABLA DEFINE EL FLUJO DE TRABAJO DEL ERP Y SUS AMBIENTES, ESTE FLUJO DE TRABAJO SON EXCLUSIVAMENTE PARA LAS VENTAS CORPORATIVAS NO TRASLADO DE MERCANCIA; VENTAS POS O DEMAS MODULOS
-- 1. Cabecera del flujo de trabajo
CREATE TABLE sales_flows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    
    code VARCHAR(100) NOT NULL,
    name VARCHAR(250) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (company_id, environment_id, id),
    UNIQUE (company_id, environment_id, code),

    FOREIGN KEY (company_id, environment_id)
        REFERENCES environments(company_id, id)
        ON DELETE CASCADE
);

-- 2. Pasos del flujo (Nodos)
CREATE TABLE sales_flow_steps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    flow_id UUID NOT NULL,
    
    -- Apunta al TIPO de documento (Cotización, Remisión, Factura), no a una instancia
    document_type_id UUID NOT NULL,
    
    code VARCHAR(100) NOT NULL,
    name VARCHAR(250) NOT NULL,
    description TEXT,
    
    -- Identifica dónde inicia y dónde termina el flujo
    is_initial BOOLEAN NOT NULL DEFAULT FALSE,
    is_final BOOLEAN NOT NULL DEFAULT FALSE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    position_x FLOAT NOT NULL DEFAULT 0,
    position_y FLOAT NOT NULL DEFAULT 0,

    UNIQUE (company_id, environment_id, flow_id, id),
    UNIQUE (company_id, environment_id, flow_id, code),

    -- Garantiza que el flujo pertenezca a la misma empresa y ambiente
    FOREIGN KEY (company_id, environment_id, flow_id)
        REFERENCES sales_flows(company_id, environment_id, id)
        ON DELETE CASCADE,

    -- Garantiza que el tipo de documento pertenezca a la misma empresa y ambiente
    FOREIGN KEY (company_id, environment_id, document_type_id)
        REFERENCES document_types(company_id, environment_id, id)
);

-- 3. Transiciones entre pasos (Rutas / Ramificaciones no lineales)
CREATE TABLE sales_flow_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    environment_id UUID NOT NULL,
    flow_id UUID NOT NULL,

    from_step_id UUID NOT NULL,
    to_step_id UUID NOT NULL,

    -- Etiqueta de la acción (ej. "Despachar", "Solicitar Stock a Compras")
    action_name VARCHAR(150) NOT NULL,
    
    -- Regla o condición en JSON para automatizar o validar el salto
    -- Ej: {"requires_stock": false} o {"min_amount": 5000000}
    condition_rules JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Evita transiciones duplicadas entre los mismos dos pasos con la misma acción
    UNIQUE (flow_id, from_step_id, to_step_id, action_name),

    -- Garantiza que el paso origen pertenezca al mismo flujo, empresa y ambiente
    FOREIGN KEY (company_id, environment_id, flow_id, from_step_id)
        REFERENCES sales_flow_steps(company_id, environment_id, flow_id, id)
        ON DELETE CASCADE,

    -- Garantiza que el paso destino pertenezca al mismo flujo, empresa y ambiente
    FOREIGN KEY (company_id, environment_id, flow_id, to_step_id)
        REFERENCES sales_flow_steps(company_id, environment_id, flow_id, id)
        ON DELETE CASCADE,

    CHECK (from_step_id <> to_step_id),
    CHECK (jsonb_typeof(condition_rules) = 'object')
);