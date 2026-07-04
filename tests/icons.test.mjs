import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ICONS } from '../src/icons.js'

test('every brand icon has a path and a color', () => {
  const expected = ['claude', 'codex', 'cursor', 'git']
  assert.deepEqual(Object.keys(ICONS).sort(), expected.sort())
  for (const [name, icon] of Object.entries(ICONS)) {
    assert.ok(icon.d.length > 50, `${name} path looks truncated`)
    assert.match(icon.color, /^#[0-9A-Fa-f]{6}$/, `${name} color is not a hex color`)
  }
})
