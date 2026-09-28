export async function create(pool, userId, { filename, mimeType, data }) {
  const result = await pool.query(
    `INSERT INTO uploads (user_id, filename, mime_type, size_bytes, data)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [userId, filename, mimeType, data.length, data]
  )
  return result.rows[0].id
}

export async function getById(pool, userId, id) {
  const result = await pool.query(
    'SELECT mime_type, data FROM uploads WHERE id = $1 AND user_id = $2',
    [id, userId]
  )
  return result.rows[0] ?? null
}

export async function usedBytes(pool, userId) {
  const result = await pool.query(
    'SELECT COALESCE(SUM(size_bytes), 0)::bigint AS total FROM uploads WHERE user_id = $1',
    [userId]
  )
  return Number(result.rows[0].total)
}

// Deletes this user's files that no kit or project points to any more.
// The 1-day grace period protects files uploaded to a kit that hasn't been saved yet.
export async function removeOrphans(pool, userId) {
  const result = await pool.query(
    `DELETE FROM uploads u
     WHERE u.user_id = $1
       AND u.created_at < now() - interval '1 day'
       AND NOT EXISTS (
         SELECT 1 FROM kit_logos l JOIN kits k ON k.id = l.kit_id
         WHERE k.user_id = $1 AND l.file_path LIKE ('%/api/files/' || u.id::text))
       AND NOT EXISTS (
         SELECT 1 FROM kit_fonts f JOIN kits k ON k.id = f.kit_id
         WHERE k.user_id = $1 AND f.file_path LIKE ('%/api/files/' || u.id::text))
       AND NOT EXISTS (
         SELECT 1 FROM projects p
         WHERE p.user_id = $1 AND p.image_url LIKE ('%/api/files/' || u.id::text))`,
    [userId]
  )
  return result.rowCount
}
