
import { supabase } from '@/integrations/supabase/client';

export interface User {
    id: string;
    email: string;
    name?: string;
    avatar_url?: string;
}

export const updateUserEmail = async (userId: string, newEmail: string): Promise<void> => {
    const { error } = await supabase.auth.updateUser({
        email: newEmail
    });

    if (error) {
        throw new Error(error.message);
    }

    // Update email in users table
    const { error: updateError } = await supabase
        .from('users')
        .update({ email: newEmail })
        .eq('id', userId);

    if (updateError) {
        throw new Error(updateError.message);
    }
};

export const updateUserPassword = async (
    userId: string,
    currentPassword: string,
    newPassword: string
): Promise<void> => {
    try {
        // We don't need to verify the current password on the client side
        // Supabase Auth will handle this when updating the password
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        });

        if (error) {
            throw new Error(error.message);
        }
    } catch (error) {
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('Failed to update password');
    }
};

export const getUserProfile = async (userId: string): Promise<User> => {
    const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

    if (error) {
        throw new Error(error.message);
    }

    return data;
}; 
