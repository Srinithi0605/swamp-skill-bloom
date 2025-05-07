import { supabase } from '@/integrations/supabase/client';
import bcrypt from 'bcryptjs';

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
    // First verify the current password
    const { data: userData, error: fetchError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

    if (fetchError) {
        throw new Error(fetchError.message);
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, userData.password_hash);
    if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
    }

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in auth
    const { error: authError } = await supabase.auth.updateUser({
        password: newPassword
    });

    if (authError) {
        throw new Error(authError.message);
    }

    // Update password hash in users table
    const { error: updateError } = await supabase
        .from('users')
        .update({ password_hash: hashedPassword })
        .eq('id', userId);

    if (updateError) {
        throw new Error(updateError.message);
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