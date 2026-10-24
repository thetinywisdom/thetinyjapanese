CREATE TABLE public.user_state (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_state TO authenticated;
GRANT ALL ON public.user_state TO service_role;

ALTER TABLE public.user_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own state"
  ON public.user_state FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.diary_entries (
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  id TEXT NOT NULL,
  date_iso TEXT NOT NULL,
  text TEXT NOT NULL DEFAULT '',
  direction TEXT NOT NULL DEFAULT 'vertical',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  strokes JSONB NOT NULL DEFAULT '[]'::jsonb,
  drawing TEXT NOT NULL DEFAULT '',
  drawing_base TEXT,
  entry_updated_at BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.diary_entries TO authenticated;
GRANT ALL ON public.diary_entries TO service_role;

ALTER TABLE public.diary_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own diary entries"
  ON public.diary_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_user_state_updated_at
  BEFORE UPDATE ON public.user_state
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON public.diary_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();