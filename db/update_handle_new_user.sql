-- ============================================================
-- Update handle_new_user to support Name, Phone, and Role
-- Run this in Supabase SQL Editor
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name, phone, role, plan_type, trial_expires_at)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'name', ''), 
    new.raw_user_meta_data->>'phone',
    COALESCE(new.raw_user_meta_data->>'role', 'owner'), -- Default to owner for SaaS model
    'free', 
    now() + INTERVAL '60 days'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
