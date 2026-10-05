import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assertJwtConfigured } from '../src/lib/jwt';

test('on Render, a missing JWT_SECRET fails instead of using the dev secret', () => {
  const saved = { JWT_SECRET: process.env.JWT_SECRET, RENDER: process.env.RENDER };
  delete process.env.JWT_SECRET;
  process.env.RENDER = 'true';
  try {
    assert.throws(assertJwtConfigured, /JWT_SECRET must be set/);
  } finally {
    Object.assign(process.env, saved);
    if (saved.RENDER === undefined) delete process.env.RENDER;
    if (saved.JWT_SECRET === undefined) delete process.env.JWT_SECRET;
  }
});
