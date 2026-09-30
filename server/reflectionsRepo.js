// A reflection log is append-only: entries are added, never edited or
// removed individually. Ownership runs through the project (project_id ->
// projects.user_id), same indirection kit_colors uses through kits.

export async function getAllForProject(pool, userId, projectId) {
  const result = await pool.query(
    `SELECT r.* FROM project_reflections r
     JOIN projects p ON p.id = r.project_id
     WHERE r.project_id = $1 AND p.user_id = $2
     ORDER BY r.created_at DESC`,
    [projectId, userId]
  )
  return result.rows
}

// Returns null (rather than throwing) when the project doesn't exist or
// isn't the caller's, so the route can answer 404 either way.
export async function create(pool, userId, projectId, text) {
  const owns = await pool.query('SELECT 1 FROM projects WHERE id = $1 AND user_id = $2', [projectId, userId])
  if (owns.rows.length === 0) return null
  const result = await pool.query(
    'INSERT INTO project_reflections (project_id, text) VALUES ($1, $2) RETURNING *',
    [projectId, text]
  )
  return result.rows[0]
}
