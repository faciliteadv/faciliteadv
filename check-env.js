console.log('--- Verificação de Ambiente (Node Nativo) ---');
console.log('NEXT_PUBLIC_SUPABASE_URL existe?', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
}

console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY existe?', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
if (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY (primeiros 10 chars):', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 10) + '...');
}
console.log('-------------------------------');
