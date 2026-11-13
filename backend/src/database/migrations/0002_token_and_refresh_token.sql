CREATE TABLE session (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID NOT NULL,

    token TEXT NOT NULL,
    refresh_token TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,

    active BOOLEAN NOT NULL DEFAULT TRUE,
    is_refresh BOOLEAN NOT NULL DEFAULT FALSE,

    FOREIGN KEY (user_id) REFERENCES users (id),

    UNIQUE (user_id, token),
    UNIQUE (user_id, refresh_token)
);

CREATE INDEX idx_session_expires_at
    ON session (expires_at)
    WHERE active = TRUE;


CREATE OR REPLACE PROCEDURE remove_tokens()
LANGUAGE plpgsql
AS $$
BEGIN
    DELETE FROM session
    WHERE active = FALSE
       OR expires_at <= NOW();
END;
$$;

CREATE EXTENSION IF NOT EXISTS pg_cron;

SELECT cron.schedule(
    'remove-expired-sessions',
    '0 * * * *',
    'CALL remove_tokens()'
);