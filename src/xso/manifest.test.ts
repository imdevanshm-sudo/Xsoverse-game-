import test from 'node:test';
import assert from 'node:assert/strict';

import {
  XsoValidationError,
  createXsoDraft,
  deserializeXsoManifest,
  migrateLegacyPlayerManifest,
  serializeXsoManifest,
  toPlayerManifest,
} from './manifest';

test('creates, serializes, and deserializes a valid XSO manifest', () => {
  const xso = createXsoDraft({
    identity: {
      senderName: 'Morgan',
      senderEmail: 'morgan@example.com',
      recipientName: 'Riley',
      recipientEmail: 'riley@example.com',
      senderRevealMode: 'DISCOVER',
    },
    assets: [
      { id: 'asset_image', kind: 'image', url: 'https://example.com/image.jpg', title: 'Still' },
      { id: 'asset_audio', kind: 'audio', url: 'https://example.com/reply.mp3', durationSeconds: 42 },
    ],
    content: {
      imageAssetIds: ['asset_image'],
      voiceMemoAssetId: 'asset_audio',
      videoAssetIds: [],
      memories: ['The station platform'],
      timeline: [
        { id: 'block_image', kind: 'image', assetId: 'asset_image', title: 'Still' },
        { id: 'block_voice', kind: 'voiceMemo', assetId: 'asset_audio', title: 'Reply' },
      ],
      selectedAtmosphere: 'Cosmic Void',
    },
    ending: { mode: 'PEARL' },
    delivery: { status: 'SCHEDULED', scheduledAt: '2026-08-20T10:30:00.000Z' },
    lifecycle: { status: 'FORM_SUBMITTED' },
  });

  const payload = serializeXsoManifest(xso);
  const parsed = deserializeXsoManifest(payload);
  const player = toPlayerManifest(parsed);

  assert.equal(parsed.identity.senderRevealMode, 'DISCOVER');
  assert.equal(player.media.length, 2);
  assert.equal(player.media[1]?.type, 'audio');
  assert.equal(player.media[1]?.duration, '0:42');
});

test('rejects invalid lifecycle and delivery combinations', () => {
  assert.throws(
    () =>
      createXsoDraft({
        identity: {
          senderName: 'Morgan',
          senderEmail: 'not-an-email',
          recipientName: 'Riley',
          senderRevealMode: 'START',
        },
        content: {
          imageAssetIds: [],
          videoAssetIds: [],
          memories: [],
          timeline: [],
        },
        ending: { mode: 'BOX' },
        delivery: { status: 'DELIVERED' },
        lifecycle: { status: 'REPLY_RECEIVED' },
      }),
    (error: unknown) => {
      assert.ok(error instanceof XsoValidationError);
      assert.match(error.message, /senderEmail/);
      assert.match(error.message, /BOX-only experiences cannot enter REPLY_RECEIVED/);
      return true;
    },
  );
});

test('rejects missing scheduledAt for scheduled delivery', () => {
  assert.throws(
    () =>
      createXsoDraft({
        identity: {
          senderName: 'Morgan',
          senderEmail: 'morgan@example.com',
          recipientName: 'Riley',
          senderRevealMode: 'LATER',
        },
        content: {
          imageAssetIds: [],
          videoAssetIds: [],
          memories: [],
          timeline: [],
        },
        delivery: { status: 'SCHEDULED' },
      }),
    /scheduledAt is required/,
  );
});

test('migrates legacy player data into a stable-id XSO manifest', () => {
  const migrated = migrateLegacyPlayerManifest(
    {
      masterAudioUrl: 'https://example.com/ambient.mp3',
      media: [
        { id: '1', type: 'image', url: 'https://example.com/one.jpg', title: 'One' },
        { id: '2', type: 'audio', url: 'https://example.com/two.mp3', title: 'Two', duration: '0:42' },
        { id: '3', type: 'video', url: 'https://example.com/three.mp4', title: 'Three' },
      ],
    },
    {
      identity: {
        senderName: 'Alex',
        senderEmail: 'alex@example.com',
        recipientName: 'Taylor',
        senderRevealMode: 'ANONYMOUS',
      },
    },
  );

  assert.match(migrated.id, /^xso_/);
  assert.ok(migrated.assets.every((asset) => !['1', '2', '3'].includes(asset.id)));
  assert.equal(migrated.content.imageAssetIds.length, 1);
  assert.equal(migrated.content.videoAssetIds.length, 1);
  assert.ok(migrated.content.voiceMemoAssetId);
  assert.equal(migrated.content.ambientAudioAssetId !== undefined, true);
  assert.equal(migrated.identity.senderRevealMode, 'ANONYMOUS');
});
