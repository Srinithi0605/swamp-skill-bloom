
-- Create waiting_list table
CREATE TABLE IF NOT EXISTS waiting_list (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    desired_skill TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add RLS policies
ALTER TABLE waiting_list ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own waiting list entries
CREATE POLICY "Users can view their own waiting list entries"
    ON waiting_list FOR SELECT
    USING (auth.uid() = user_id);

-- Allow users to insert their own waiting list entries
CREATE POLICY "Users can insert their own waiting list entries"
    ON waiting_list FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Allow admins to view all waiting list entries (will need further implementation of admin roles)
-- CREATE POLICY "Admins can view all waiting list entries"
--    ON waiting_list FOR SELECT 
--    USING (auth.uid() IN (SELECT user_id FROM user_roles WHERE role = 'admin'));
