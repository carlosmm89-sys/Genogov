import { createClient } from '@supabase/supabase-js';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Solo permitir POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { password, access_token } = req.body;

    if (!password || !access_token) {
        return res.status(400).json({ error: 'Missing password or access_token' });
    }

    try {
        // Crear cliente con anon key primero para verificar el token
        const supabaseClient = createClient(SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY || '');

        // Verificar el token de recovery
        const { data: verifyData, error: verifyError } = await supabaseClient.auth.verifyOtp({
            token_hash: access_token,
            type: 'recovery'
        });

        if (verifyError || !verifyData.user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Ahora usar Admin API para actualizar la contraseña
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
            verifyData.user.id,
            { password }
        );

        if (updateError) {
            return res.status(400).json({ error: updateError.message });
        }

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error: any) {
        console.error('Password update error:', error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
}
