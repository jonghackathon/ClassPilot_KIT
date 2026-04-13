type UploadToSupabaseStorageParams = {
  buffer: Buffer
  objectPath: string
  contentType: string
}

function getStorageConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const bucket = process.env.NEXT_PUBLIC_SUPABASE_BUCKET

  if (!url || !serviceRoleKey || !bucket) {
    throw new Error(
      'Supabase Storage 환경변수(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, NEXT_PUBLIC_SUPABASE_BUCKET)가 필요합니다.',
    )
  }

  return {
    bucket,
    serviceRoleKey,
    storageBaseUrl: `${url.replace(/\/$/, '')}/storage/v1`,
  }
}

export async function uploadToSupabaseStorage({
  buffer,
  objectPath,
  contentType,
}: UploadToSupabaseStorageParams) {
  const { bucket, serviceRoleKey, storageBaseUrl } = getStorageConfig()
  const uploadUrl = `${storageBaseUrl}/object/${bucket}/${objectPath}`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      apikey: serviceRoleKey,
      'Content-Type': contentType,
      'x-upsert': 'false',
    },
    body: new Uint8Array(buffer),
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Supabase Storage 업로드에 실패했습니다. ${details}`.trim())
  }

  return {
    bucket,
    objectPath,
    publicUrl: `${storageBaseUrl}/object/public/${bucket}/${objectPath}`,
  }
}
