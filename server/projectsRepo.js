export async function getAll(pool, userId) {
  const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  return result.rows
}

export async function ownedBy(pool, userId, id) {
  if (!/^\d+$/.test(String(id))) return false
  const result = await pool.query('SELECT 1 FROM projects WHERE id = $1 AND user_id = $2', [id, userId])
  return result.rows.length > 0
}

export async function getById(pool, userId, id) {
  const result = await pool.query('SELECT * FROM projects WHERE id = $1 AND user_id = $2', [id, userId])
  return result.rows[0] ?? null
}

export async function create(pool, userId, { title, image_url, kit_id, notes_worked, notes_to_change }) {
  const result = await pool.query(
    `INSERT INTO projects (user_id, title, image_url, kit_id, notes_worked, notes_to_change)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [userId, title, image_url ?? null, kit_id || null, notes_worked ?? '', notes_to_change ?? '']
  )
  return result.rows[0]
}

export async function update(pool, userId, id, { title, image_url, kit_id, notes_worked, notes_to_change }) {
  const result = await pool.query(
    `UPDATE projects SET title = $1, image_url = $2, kit_id = $3, notes_worked = $4, notes_to_change = $5
     WHERE id = $6 AND user_id = $7 RETURNING *`,
    [title, image_url ?? null, kit_id || null, notes_worked ?? '', notes_to_change ?? '', id, userId]
  )
  return result.rows[0] ?? null
}

export async function remove(pool, userId, id) {
  const result = await pool.query('DELETE FROM projects WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])
  return result.rowCount > 0
}