// Adds invented sample data (two kits, two projects, three quick notes) for ONE
// signed-up account, so a fresh local database isn't empty.
//
//   npm run db:seed -- <firebase-uid>
//
// Every row belongs to a user, so the seed needs the UID of the account that
// should see it: Firebase console > Authentication > Users > "User UID".
//
// Safety: this only ever INSERTs (it never deletes or truncates), it stops if
// that account already has kits, and it refuses to touch a hosted database.
// The data is made up. It contains no real people.

import { pool } from './pool.js'

const uid = process.argv[2]
const allowRemote = process.argv.includes('--allow-remote')

if (!uid || uid.startsWith('--')) {
  console.error('usage: npm run db:seed -- <firebase-uid>')
  console.error('Find the UID in Firebase console > Authentication > Users.')
  process.exit(1)
}

const url = process.env.DATABASE_URL
if (!allowRemote && !url.includes('localhost') && !url.includes('127.0.0.1')) {
  console.error('DATABASE_URL is not a local database, so the seed will not run.')
  console.error('Sign up on the site and add your own data instead. (--allow-remote overrides this.)')
  process.exit(1)
}

const kits = [
  {
    name: 'Nara Core',
    tag: 'brand',
    colors: [['#FF00AE', 'magenta'], ['#C1FF1A', 'lime'], ['#111111', 'ink']],
  },
  {
    name: 'Editorial Zine',
    tag: 'personal project',
    colors: [['#F4F4F0', 'paper'], ['#111111', 'ink'], ['#3366CC', 'cobalt']],
  },
]

const projects = [
  {
    title: 'Nara website design kit',
    kit: 'Nara Core',
    worked: 'The magenta and lime pairing reads loud without feeling messy.',
    change: 'Try a calmer palette for long reading pages.',
  },
  {
    title: 'Zine layout draft',
    kit: 'Editorial Zine',
    worked: 'Wide margins made the body text easy to read.',
    change: '',
  },
]

const notes = [
  'Try a pixel typeface for the poster headline',
  'Lime on black for the event flyer',
  'Ask about printing on uncoated paper',
]

const client = await pool.connect()
try {
  const existing = await client.query('SELECT 1 FROM kits WHERE user_id = $1 LIMIT 1', [uid])
  if (existing.rows.length > 0) {
    console.log('That account already has kits, so nothing was added.')
  } else {
    await client.query('BEGIN')
    const kitIds = new Map()
    for (const kit of kits) {
      const { rows } = await client.query(
        'INSERT INTO kits (user_id, name, tag) VALUES ($1, $2, $3) RETURNING id',
        [uid, kit.name, kit.tag]
      )
      kitIds.set(kit.name, rows[0].id)
      for (const [index, [hex, name]] of kit.colors.entries()) {
        await client.query(
          'INSERT INTO kit_colors (kit_id, hex, name, position) VALUES ($1, $2, $3, $4)',
          [rows[0].id, hex, name, index]
        )
      }
    }
    for (const project of projects) {
      await client.query(
        `INSERT INTO projects (user_id, title, kit_id, notes_worked, notes_to_change)
         VALUES ($1, $2, $3, $4, $5)`,
        [uid, project.title, kitIds.get(project.kit), project.worked, project.change]
      )
    }
    for (const text of notes) {
      await client.query('INSERT INTO quick_notes (user_id, text) VALUES ($1, $2)', [uid, text])
    }
    await client.query('COMMIT')
    console.log(`Added ${kits.length} kits, ${projects.length} projects and ${notes.length} notes for that account.`)
  }
} catch (error) {
  await client.query('ROLLBACK').catch(() => {})
  console.error(`seed failed: ${error.message}`)
  process.exitCode = 1
} finally {
  client.release()
  await pool.end()
}
