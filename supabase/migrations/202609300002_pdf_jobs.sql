CREATE TABLE IF NOT EXISTS app_pdf_jobs (
 id uuid PRIMARY KEY, user_id integer NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
 object_key varchar(64) NOT NULL UNIQUE, file_name varchar(120) NOT NULL,
 mime varchar(120) NOT NULL, expires_at timestamp NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_pdf_jobs_expiry ON app_pdf_jobs(expires_at);
ALTER TABLE app_pdf_jobs ENABLE ROW LEVEL SECURITY;
INSERT INTO storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
VALUES ('private-pdf-jobs','private-pdf-jobs',false,4194304,ARRAY['application/pdf','application/zip','text/plain','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
ON CONFLICT (id) DO UPDATE SET public=false,file_size_limit=4194304,allowed_mime_types=EXCLUDED.allowed_mime_types;
