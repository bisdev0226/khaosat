// Gọi API — ném Error với message tiếng Việt từ server nếu có
export async function api(path, options = {}) {
  const { headers, ...rest } = options
  const res = await fetch(path, {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...(headers || {}) },
  })
  let body = null
  try {
    body = await res.json()
  } catch {
    /* không phải JSON */
  }
  if (!res.ok) {
    const err = new Error(body?.message || `Lỗi ${res.status}`)
    err.status = res.status
    err.errors = body?.errors || []
    throw err
  }
  return body
}

export function adminHeaders() {
  return { 'x-admin-key': sessionStorage.getItem('adminKey') || '' }
}
