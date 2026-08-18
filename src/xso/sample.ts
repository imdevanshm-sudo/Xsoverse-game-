import { createXsoDraft, toPlayerManifest } from './manifest';

export const sampleXso = createXsoDraft({
  identity: {
    senderName: 'Alex',
    senderEmail: 'alex@example.com',
    recipientName: 'Taylor',
    recipientEmail: 'taylor@example.com',
    senderRevealMode: 'LATER',
  },
  assets: [
    {
      id: 'asset_img_kyoto',
      kind: 'image',
      url: 'https://picsum.photos/seed/kyoto/800/800',
      title: 'Summer in Kyoto - 2024',
      width: 800,
      height: 800,
    },
    {
      id: 'asset_vid_night_ride',
      kind: 'video',
      url: '/video.mp4',
      title: 'Night Ride',
    },
    {
      id: 'asset_audio_voice',
      kind: 'audio',
      url: '/Easy on Me Now.mp3',
      title: 'Voice Note from Taylor',
      durationSeconds: 42,
    },
    {
      id: 'asset_img_drive',
      kind: 'image',
      url: 'https://picsum.photos/seed/drive/800/800',
      title: 'The drive back home...',
      width: 800,
      height: 800,
    },
    {
      id: 'asset_audio_ambient',
      kind: 'audio',
      url: 'https://actions.google.com/sounds/v1/ambiences/coffee_shop.ogg',
      title: 'Ambient bed',
    },
  ],
  content: {
    imageAssetIds: ['asset_img_kyoto', 'asset_img_drive'],
    videoAssetIds: ['asset_vid_night_ride'],
    voiceMemoAssetId: 'asset_audio_voice',
    ambientAudioAssetId: 'asset_audio_ambient',
    textMessage: 'A sealed thing I needed you to feel before I explained it.',
    story: 'A cinematic drift through the places and moments that still glow.',
    memories: ['Summer in Kyoto', 'The drive back home'],
    emotionalDirection: 'Tender, unresolved, and close.',
    selectedAtmosphere: 'Cosmic Void',
    timeline: [
      { id: 'block_img_kyoto', kind: 'image', assetId: 'asset_img_kyoto', title: 'Summer in Kyoto - 2024' },
      { id: 'block_vid_night_ride', kind: 'video', assetId: 'asset_vid_night_ride', title: 'Night Ride' },
      { id: 'block_voice_reply', kind: 'voiceMemo', assetId: 'asset_audio_voice', title: 'Voice Note from Taylor' },
      { id: 'block_img_drive', kind: 'image', assetId: 'asset_img_drive', title: 'The drive back home...' },
    ],
  },
  ending: {
    mode: 'BOTH',
  },
  delivery: {
    status: 'READY',
  },
  lifecycle: {
    status: 'PREVIEW_READY',
  },
});

export const samplePlayerManifest = toPlayerManifest(sampleXso);
