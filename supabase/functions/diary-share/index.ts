import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-lovable-signature, x-lovable-timestamp, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const BUCKET = 'diary-shares'
const LINK_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days
const MAX_BASE64_LENGTH = 8 * 1024 * 1024 // ~6 MB decoded

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405)
  }

  let image: unknown
  try {
    const body = await req.json()
    image = body?.image
  } catch {
    return json({ error: 'Invalid JSON body' }, 400)
  }

  if (typeof image !== 'string' || !image.startsWith('data:image/jpeg;base64,')) {
    return json({ error: 'image must be a base64 JPEG data URL' }, 400)
  }
  if (image.length > MAX_BASE64_LENGTH) {
    return json({ error: 'Image too large' }, 413)
  }

  const base64 = image.slice('data:image/jpeg;base64,'.length)
  let bytes: Uint8Array
  try {
    const binary = atob(base64)
    bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  } catch {
    return json({ error: 'Invalid base64 image data' }, 400)
  }

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const path = `shares/${crypto.randomUUID()}.jpg`
  const { error: uploadError } = await admin.storage.from(BUCKET).upload(path, bytes, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (uploadError) {
    console.error('upload failed:', uploadError.message)
    return json({ error: 'Could not store the image' }, 500)
  }

  const { data: signed, error: signError } = await admin.storage
    .from(BUCKET)
    .createSignedUrl(path, LINK_TTL_SECONDS)
  if (signError || !signed?.signedUrl) {
    console.error('sign failed:', signError?.message)
    return json({ error: 'Could not create the download link' }, 500)
  }

  return json({ url: signed.signedUrl })
})
