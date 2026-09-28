async function attachChildren(pool, kits) {
  if (kits.length === 0) return kits
  const ids = kits.map((k) => k.id)

  const [colors, logos, fonts] = await Promise.all([
    pool.query('SELECT * FROM kit_colors WHERE kit_id = ANY($1) ORDER BY position ASC, id ASC', [ids]),
    pool.query('SELECT * FROM kit_logos WHERE kit_id = ANY($1) ORDER BY id ASC', [ids]),
    pool.query('SELECT * FROM kit_fonts WHERE kit_id = ANY($1) ORDER BY id ASC', [ids]),
  ])

  return kits.map((kit) => ({
    ...kit,
    colors: colors.rows.filter((c) => c.kit_id === kit.id),
    logos: logos.rows.filter((l) => l.kit_id === kit.id),
    fonts: fonts.rows.filter((f) => f.kit_id === kit.id),
  }))
}

export async function getAll(pool, userId) {
  const result = await pool.query('SELECT * FROM kits WHERE user_id = $1 ORDER BY created_at DESC', [userId])
  return attachChildren(pool, result.rows)
}

export async function ownedBy(pool, userId, id) {
  if (!/^\d+$/.test(String(id))) return false
  const result = await pool.query('SELECT 1 FROM kits WHERE id = $1 AND user_id = $2', [id, userId])
  return result.rows.length > 0
}

export async function getById(pool, userId, id) {
  const result = await pool.query('SELECT * FROM kits WHERE id = $1 AND user_id = $2', [id, userId])
  if (result.rows.length === 0) return null
  const [withChildren] = await attachChildren(pool, result.rows)
  return withChildren
}

async function replaceChildren(client, kitId, { colors = [], logos = [], fonts = [] }) {
  await client.query('DELETE FROM kit_colors WHERE kit_id = $1', [kitId])
  await client.query('DELETE FROM kit_logos WHERE kit_id = $1', [kitId])
  await client.query('DELETE FROM kit_fonts WHERE kit_id = $1', [kitId])

  for (const [index, color] of colors.entries()) {
    await client.query(
      'INSERT INTO kit_colors (kit_id, hex, name, position) VALUES ($1, $2, $3, $4)',
      [kitId, color.hex, color.name ?? '', index]
    )
  }
  for (const logo of logos) {
    await client.query('INSERT INTO kit_logos (kit_id, file_path, label) VALUES ($1, $2, $3)', [kitId, logo.file_path, logo.label ?? ''])
  }
  for (const font of fonts) {
    await client.query(
      'INSERT INTO kit_fonts (kit_id, file_path, font_family_name, label) VALUES ($1, $2, $3, $4)',
      [kitId, font.file_path, font.font_family_name, font.label ?? '']
    )
  }
}

export async function create(pool, userId, { name, tag, colors, logos, fonts }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const inserted = await client.query(
      'INSERT INTO kits (user_id, name, tag) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, tag ?? '']
    )
    const kit = inserted.rows[0]
    await replaceChildren(client, kit.id, { colors, logos, fonts })
    await client.query('COMMIT')
    return getById(pool, userId, kit.id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function update(pool, userId, id, { name, tag, colors, logos, fonts }) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const updated = await client.query(
      'UPDATE kits SET name = $1, tag = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
      [name, tag ?? '', id, userId]
    )
    if (updated.rows.length === 0) {
      await client.query('ROLLBACK')
      return null
    }
    await replaceChildren(client, id, { colors, logos, fonts })
    await client.query('COMMIT')
    return getById(pool, userId, id)
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}

export async function remove(pool, userId, id) {
  const result = await pool.query('DELETE FROM kits WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId])
  return result.rowCount > 0
}