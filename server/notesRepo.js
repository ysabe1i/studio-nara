export async function getAll(pool, userId) {
  const result = await pool.query('SELECT * FROM quick_notes WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  return result.rows
}

// projectId must be one the caller owns, or null. Checked by the caller
// (server.js), same pattern as projects.kit_id.
export async function create(pool, userId, text, projectId) {
  const result = await pool.query(
    'INSERT INTO quick_notes (user_id, text, project_id) VALUES ($1, $2, $3) RETURNING *',
    [userId, text, projectId ?? null]
  )
  return result.rows[0]
}

export async function update(pool, userId, id, text, projectId) {
  const result = await pool.query(
    'UPDATE quick_notes SET text = $1, project_id = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [text, projectId ?? null, id, userId]
  )
  return result.rows[0] ?? null
}

export async function remove(pool, userId, id) {
  const result = await pool.query('DELETE FROM quick_notes WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])
  return result.rowCount > 0
}
