export const XSO_SCHEMA_VERSION = 'xso.manifest/1' as const;

export const SENDER_REVEAL_MODES = ['START', 'LATER', 'DISCOVER', 'ANONYMOUS'] as const;
export const XSO_ENDING_MODES = ['PEARL', 'BOX', 'BOTH'] as const;
export const XSO_DELIVERY_STATUSES = ['PENDING', 'SCHEDULED', 'PROCESSING', 'READY', 'DELIVERED', 'FAILED'] as const;
export const XSO_LIFECYCLE_STATUSES = [
  'DRAFT',
  'FORM_SUBMITTED',
  'PREVIEW_READY',
  'PAID',
  'PROCESSING',
  'READY',
  'DELIVERED',
  'REPLY_RECEIVED',
  'ARCHIVED',
] as const;
export const XSO_MEDIA_KINDS = ['image', 'video', 'audio'] as const;
export const XSO_CONTENT_BLOCK_KINDS = ['image', 'video', 'voiceMemo', 'text'] as const;

export type SenderRevealMode = typeof SENDER_REVEAL_MODES[number];
export type XsoEndingMode = typeof XSO_ENDING_MODES[number];
export type XsoDeliveryStatus = typeof XSO_DELIVERY_STATUSES[number];
export type XsoLifecycleStatus = typeof XSO_LIFECYCLE_STATUSES[number];
export type XsoMediaKind = typeof XSO_MEDIA_KINDS[number];
export type XsoContentBlockKind = typeof XSO_CONTENT_BLOCK_KINDS[number];

export interface XsoMediaAsset {
  id: string;
  kind: XsoMediaKind;
  url: string;
  mimeType?: string;
  title?: string;
  durationSeconds?: number;
  width?: number;
  height?: number;
  byteSize?: number;
  originalFileName?: string;
  sourceLegacyId?: string;
}

interface XsoContentBlockBase {
  id: string;
  title?: string;
}

export interface XsoImageBlock extends XsoContentBlockBase {
  kind: 'image';
  assetId: string;
}

export interface XsoVideoBlock extends XsoContentBlockBase {
  kind: 'video';
  assetId: string;
}

export interface XsoVoiceMemoBlock extends XsoContentBlockBase {
  kind: 'voiceMemo';
  assetId: string;
}

export interface XsoTextBlock extends XsoContentBlockBase {
  kind: 'text';
  text: string;
}

export type XsoContentBlock = XsoImageBlock | XsoVideoBlock | XsoVoiceMemoBlock | XsoTextBlock;

export interface XsoIdentity {
  senderName: string;
  senderEmail: string;
  recipientName: string;
  recipientEmail?: string;
  senderRevealMode: SenderRevealMode;
}

export interface XsoContent {
  imageAssetIds: string[];
  videoAssetIds: string[];
  voiceMemoAssetId?: string;
  textMessage?: string;
  story?: string;
  memories: string[];
  emotionalDirection?: string;
  selectedAtmosphere?: string;
  timeline: XsoContentBlock[];
  ambientAudioAssetId?: string;
}

export interface XsoEnding {
  mode: XsoEndingMode;
}

export interface XsoDelivery {
  scheduledAt?: string;
  status: XsoDeliveryStatus;
}

export interface XsoLifecycle {
  status: XsoLifecycleStatus;
  deliveredAt?: string;
  replyReceivedAt?: string;
  archivedAt?: string;
}

export interface XsoManifest {
  schemaVersion: typeof XSO_SCHEMA_VERSION;
  id: string;
  createdAt: string;
  updatedAt: string;
  identity: XsoIdentity;
  content: XsoContent;
  ending: XsoEnding;
  delivery: XsoDelivery;
  lifecycle: XsoLifecycle;
  assets: XsoMediaAsset[];
}

export interface XsoPlayerMediaItem {
  id: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  voiceNoteUrl?: string;
  title?: string;
  duration?: string;
}

export interface XsoPlayerManifest {
  id: string;
  masterAudioUrl?: string;
  media: XsoPlayerMediaItem[];
  textMessage?: string;
  story?: string;
  memories: string[];
  emotionalDirection?: string;
  selectedAtmosphere?: string;
  senderRevealMode: SenderRevealMode;
  endingMode: XsoEndingMode;
}

export interface LegacyPlayerMediaItem {
  id?: string;
  type: 'image' | 'video' | 'audio';
  url: string;
  title?: string;
  duration?: string;
  voiceNoteUrl?: string;
}

export interface LegacyPlayerManifest {
  masterAudioUrl?: string;
  media: LegacyPlayerMediaItem[];
}

export interface XsoValidationIssue {
  path: string;
  message: string;
}

export class XsoValidationError extends Error {
  constructor(public readonly issues: XsoValidationIssue[]) {
    super(issues.map((issue) => `${issue.path}: ${issue.message}`).join('\n'));
    this.name = 'XsoValidationError';
  }
}

export interface CreateXsoInput {
  identity: XsoIdentity;
  content?: Partial<XsoContent>;
  ending?: Partial<XsoEnding>;
  delivery?: Partial<XsoDelivery>;
  lifecycle?: Partial<XsoLifecycle>;
  assets?: XsoMediaAsset[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isIsoDateTime(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
}

function isEnumValue<T extends readonly string[]>(value: unknown, values: T): value is T[number] {
  return typeof value === 'string' && (values as readonly string[]).includes(value);
}

function formatDuration(durationSeconds?: number): string | undefined {
  if (typeof durationSeconds !== 'number' || durationSeconds <= 0) return undefined;
  const totalSeconds = Math.ceil(durationSeconds);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}

function makeId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '')}`;
}

function cloneAssets(assets: XsoMediaAsset[]): XsoMediaAsset[] {
  return assets.map((asset) => ({ ...asset }));
}

export function createXsoDraft(input: CreateXsoInput): XsoManifest {
  const now = new Date().toISOString();
  const manifest: XsoManifest = {
    schemaVersion: XSO_SCHEMA_VERSION,
    id: makeId('xso'),
    createdAt: now,
    updatedAt: now,
    identity: { ...input.identity },
    content: {
      imageAssetIds: input.content?.imageAssetIds ? [...input.content.imageAssetIds] : [],
      videoAssetIds: input.content?.videoAssetIds ? [...input.content.videoAssetIds] : [],
      voiceMemoAssetId: input.content?.voiceMemoAssetId,
      textMessage: input.content?.textMessage,
      story: input.content?.story,
      memories: input.content?.memories ? [...input.content.memories] : [],
      emotionalDirection: input.content?.emotionalDirection,
      selectedAtmosphere: input.content?.selectedAtmosphere,
      timeline: input.content?.timeline ? input.content.timeline.map((block) => ({ ...block })) : [],
      ambientAudioAssetId: input.content?.ambientAudioAssetId,
    },
    ending: {
      mode: input.ending?.mode ?? 'PEARL',
    },
    delivery: {
      scheduledAt: input.delivery?.scheduledAt,
      status: input.delivery?.status ?? 'PENDING',
    },
    lifecycle: {
      status: input.lifecycle?.status ?? 'DRAFT',
      deliveredAt: input.lifecycle?.deliveredAt,
      replyReceivedAt: input.lifecycle?.replyReceivedAt,
      archivedAt: input.lifecycle?.archivedAt,
    },
    assets: cloneAssets(input.assets ?? []),
  };

  return assertValidXso(manifest);
}

export function validateXsoManifest(manifest: unknown): XsoValidationIssue[] {
  const issues: XsoValidationIssue[] = [];
  if (!isRecord(manifest)) {
    return [{ path: 'manifest', message: 'Manifest must be an object.' }];
  }

  const assetMap = new Map<string, XsoMediaAsset>();

  if (manifest.schemaVersion !== XSO_SCHEMA_VERSION) {
    issues.push({ path: 'schemaVersion', message: `Expected ${XSO_SCHEMA_VERSION}.` });
  }
  if (!isNonEmptyString(manifest.id)) {
    issues.push({ path: 'id', message: 'Stable XSO id is required.' });
  }
  if (!isIsoDateTime(manifest.createdAt)) {
    issues.push({ path: 'createdAt', message: 'createdAt must be an ISO datetime.' });
  }
  if (!isIsoDateTime(manifest.updatedAt)) {
    issues.push({ path: 'updatedAt', message: 'updatedAt must be an ISO datetime.' });
  }

  if (!isRecord(manifest.identity)) {
    issues.push({ path: 'identity', message: 'identity is required.' });
  } else {
    const { senderName, senderEmail, recipientName, recipientEmail, senderRevealMode } = manifest.identity;
    if (!isNonEmptyString(senderName)) {
      issues.push({ path: 'identity.senderName', message: 'senderName is required.' });
    }
    if (!isNonEmptyString(senderEmail) || !EMAIL_RE.test(senderEmail)) {
      issues.push({ path: 'identity.senderEmail', message: 'senderEmail must be valid.' });
    }
    if (!isNonEmptyString(recipientName)) {
      issues.push({ path: 'identity.recipientName', message: 'recipientName is required.' });
    }
    if (recipientEmail !== undefined && (!isNonEmptyString(recipientEmail) || !EMAIL_RE.test(recipientEmail))) {
      issues.push({ path: 'identity.recipientEmail', message: 'recipientEmail must be valid when provided.' });
    }
    if (!isEnumValue(senderRevealMode, SENDER_REVEAL_MODES)) {
      issues.push({ path: 'identity.senderRevealMode', message: 'senderRevealMode is invalid.' });
    }
  }

  if (!Array.isArray(manifest.assets)) {
    issues.push({ path: 'assets', message: 'assets must be an array.' });
  } else {
    for (const [index, rawAsset] of manifest.assets.entries()) {
      if (!isRecord(rawAsset)) {
        issues.push({ path: `assets[${index}]`, message: 'asset must be an object.' });
        continue;
      }
      if (!isNonEmptyString(rawAsset.id)) {
        issues.push({ path: `assets[${index}].id`, message: 'asset id is required.' });
      } else if (assetMap.has(rawAsset.id)) {
        issues.push({ path: `assets[${index}].id`, message: 'asset ids must be unique.' });
      }
      if (!isEnumValue(rawAsset.kind, XSO_MEDIA_KINDS)) {
        issues.push({ path: `assets[${index}].kind`, message: 'asset kind is invalid.' });
      }
      if (!isNonEmptyString(rawAsset.url)) {
        issues.push({ path: `assets[${index}].url`, message: 'asset url is required.' });
      }
      if (typeof rawAsset.durationSeconds === 'number' && rawAsset.durationSeconds < 0) {
        issues.push({ path: `assets[${index}].durationSeconds`, message: 'durationSeconds cannot be negative.' });
      }
      if (isNonEmptyString(rawAsset.id) && isEnumValue(rawAsset.kind, XSO_MEDIA_KINDS) && isNonEmptyString(rawAsset.url)) {
        assetMap.set(rawAsset.id, rawAsset as unknown as XsoMediaAsset);
      }
    }
  }

  if (!isRecord(manifest.content)) {
    issues.push({ path: 'content', message: 'content is required.' });
  } else {
    const {
      imageAssetIds,
      videoAssetIds,
      voiceMemoAssetId,
      memories,
      timeline,
      ambientAudioAssetId,
    } = manifest.content;

    if (!Array.isArray(imageAssetIds)) {
      issues.push({ path: 'content.imageAssetIds', message: 'imageAssetIds must be an array.' });
    }
    if (!Array.isArray(videoAssetIds)) {
      issues.push({ path: 'content.videoAssetIds', message: 'videoAssetIds must be an array.' });
    }
    if (!Array.isArray(memories)) {
      issues.push({ path: 'content.memories', message: 'memories must be an array.' });
    }
    if (!Array.isArray(timeline)) {
      issues.push({ path: 'content.timeline', message: 'timeline must be an array.' });
    }

    const seenRefs = new Set<string>();
    const validateAssetRef = (path: string, assetId: unknown, expectedKind: XsoMediaKind) => {
      if (!isNonEmptyString(assetId)) {
        issues.push({ path, message: 'asset id is required.' });
        return;
      }
      const asset = assetMap.get(assetId);
      if (!asset) {
        issues.push({ path, message: 'asset id was not found.' });
        return;
      }
      if (asset.kind !== expectedKind) {
        issues.push({ path, message: `asset must reference a ${expectedKind}.` });
      }
      seenRefs.add(assetId);
    };

    if (Array.isArray(imageAssetIds)) {
      for (const [index, assetId] of imageAssetIds.entries()) {
        validateAssetRef(`content.imageAssetIds[${index}]`, assetId, 'image');
      }
    }
    if (Array.isArray(videoAssetIds)) {
      for (const [index, assetId] of videoAssetIds.entries()) {
        validateAssetRef(`content.videoAssetIds[${index}]`, assetId, 'video');
      }
    }
    if (voiceMemoAssetId !== undefined) {
      validateAssetRef('content.voiceMemoAssetId', voiceMemoAssetId, 'audio');
    }
    if (ambientAudioAssetId !== undefined) {
      validateAssetRef('content.ambientAudioAssetId', ambientAudioAssetId, 'audio');
    }

    if (Array.isArray(timeline)) {
      const timelineIds = new Set<string>();
      for (const [index, rawBlock] of timeline.entries()) {
        if (!isRecord(rawBlock)) {
          issues.push({ path: `content.timeline[${index}]`, message: 'timeline block must be an object.' });
          continue;
        }
        if (!isNonEmptyString(rawBlock.id)) {
          issues.push({ path: `content.timeline[${index}].id`, message: 'timeline block id is required.' });
        } else if (timelineIds.has(rawBlock.id)) {
          issues.push({ path: `content.timeline[${index}].id`, message: 'timeline block ids must be unique.' });
        } else {
          timelineIds.add(rawBlock.id);
        }
        if (!isEnumValue(rawBlock.kind, XSO_CONTENT_BLOCK_KINDS)) {
          issues.push({ path: `content.timeline[${index}].kind`, message: 'timeline block kind is invalid.' });
          continue;
        }
        if (rawBlock.kind === 'text') {
          if (!isNonEmptyString(rawBlock.text)) {
            issues.push({ path: `content.timeline[${index}].text`, message: 'text block text is required.' });
          }
        } else {
          const expectedKind = rawBlock.kind === 'voiceMemo' ? 'audio' : rawBlock.kind;
          validateAssetRef(`content.timeline[${index}].assetId`, rawBlock.assetId, expectedKind);
        }
      }
    }
  }

  if (!isRecord(manifest.ending) || !isEnumValue(manifest.ending.mode, XSO_ENDING_MODES)) {
    issues.push({ path: 'ending.mode', message: 'ending mode is invalid.' });
  }

  if (!isRecord(manifest.delivery)) {
    issues.push({ path: 'delivery', message: 'delivery is required.' });
  } else {
    if (!isEnumValue(manifest.delivery.status, XSO_DELIVERY_STATUSES)) {
      issues.push({ path: 'delivery.status', message: 'delivery status is invalid.' });
    }
    if (manifest.delivery.scheduledAt !== undefined && !isIsoDateTime(manifest.delivery.scheduledAt)) {
      issues.push({ path: 'delivery.scheduledAt', message: 'scheduledAt must be an ISO datetime.' });
    }
    if (manifest.delivery.status === 'SCHEDULED' && !isIsoDateTime(manifest.delivery.scheduledAt)) {
      issues.push({ path: 'delivery.scheduledAt', message: 'scheduledAt is required when delivery is scheduled.' });
    }
  }

  if (!isRecord(manifest.lifecycle)) {
    issues.push({ path: 'lifecycle', message: 'lifecycle is required.' });
  } else {
    if (!isEnumValue(manifest.lifecycle.status, XSO_LIFECYCLE_STATUSES)) {
      issues.push({ path: 'lifecycle.status', message: 'lifecycle status is invalid.' });
    }
    if (manifest.lifecycle.deliveredAt !== undefined && !isIsoDateTime(manifest.lifecycle.deliveredAt)) {
      issues.push({ path: 'lifecycle.deliveredAt', message: 'deliveredAt must be an ISO datetime.' });
    }
    if (manifest.lifecycle.replyReceivedAt !== undefined && !isIsoDateTime(manifest.lifecycle.replyReceivedAt)) {
      issues.push({ path: 'lifecycle.replyReceivedAt', message: 'replyReceivedAt must be an ISO datetime.' });
    }
    if (manifest.lifecycle.archivedAt !== undefined && !isIsoDateTime(manifest.lifecycle.archivedAt)) {
      issues.push({ path: 'lifecycle.archivedAt', message: 'archivedAt must be an ISO datetime.' });
    }
  }

  if (
    isRecord(manifest.lifecycle) &&
    isRecord(manifest.delivery) &&
    manifest.lifecycle.status === 'DELIVERED' &&
    manifest.delivery.status !== 'DELIVERED'
  ) {
    issues.push({ path: 'delivery.status', message: 'delivery must be DELIVERED when lifecycle is DELIVERED.' });
  }

  if (
    isRecord(manifest.lifecycle) &&
    isRecord(manifest.ending) &&
    manifest.lifecycle.status === 'REPLY_RECEIVED' &&
    manifest.ending.mode === 'BOX'
  ) {
    issues.push({ path: 'ending.mode', message: 'BOX-only experiences cannot enter REPLY_RECEIVED.' });
  }

  return issues;
}

export function assertValidXso<T extends XsoManifest>(manifest: T): T {
  const issues = validateXsoManifest(manifest);
  if (issues.length > 0) {
    throw new XsoValidationError(issues);
  }
  return manifest;
}

export function serializeXsoManifest(manifest: XsoManifest): string {
  assertValidXso(manifest);
  return JSON.stringify(manifest, null, 2);
}

export function deserializeXsoManifest(payload: string): XsoManifest {
  const parsed = JSON.parse(payload) as unknown;
  return assertValidXso(parsed as XsoManifest);
}

export function toPlayerManifest(manifest: XsoManifest): XsoPlayerManifest {
  assertValidXso(manifest);
  const assetMap = new Map(manifest.assets.map((asset) => [asset.id, asset] as const));
  const media: XsoPlayerMediaItem[] = [];

  for (const block of manifest.content.timeline) {
    if (block.kind === 'text') continue;
    const asset = assetMap.get(block.assetId);
    if (!asset) continue;
    media.push({
      id: block.id,
      type: block.kind === 'voiceMemo' ? 'audio' : block.kind,
      url: asset.url,
      title: block.title ?? asset.title,
      duration: formatDuration(asset.durationSeconds),
    });
  }

  return {
    id: manifest.id,
    masterAudioUrl: manifest.content.ambientAudioAssetId
      ? assetMap.get(manifest.content.ambientAudioAssetId)?.url
      : undefined,
    media,
    textMessage: manifest.content.textMessage,
    story: manifest.content.story,
    memories: [...manifest.content.memories],
    emotionalDirection: manifest.content.emotionalDirection,
    selectedAtmosphere: manifest.content.selectedAtmosphere,
    senderRevealMode: manifest.identity.senderRevealMode,
    endingMode: manifest.ending.mode,
  };
}

export interface LegacyMigrationOptions {
  now?: string;
  identity?: Partial<XsoIdentity>;
  endingMode?: XsoEndingMode;
  deliveryStatus?: XsoDeliveryStatus;
  lifecycleStatus?: XsoLifecycleStatus;
  textMessage?: string;
  story?: string;
  memories?: string[];
  emotionalDirection?: string;
  selectedAtmosphere?: string;
}

export function migrateLegacyPlayerManifest(
  legacy: LegacyPlayerManifest,
  options: LegacyMigrationOptions = {},
): XsoManifest {
  const now = options.now ?? new Date().toISOString();
  const assets: XsoMediaAsset[] = [];
  const imageAssetIds: string[] = [];
  const videoAssetIds: string[] = [];
  const timeline: XsoContentBlock[] = [];
  let voiceMemoAssetId: string | undefined;

  for (const legacyItem of legacy.media) {
    const assetId = makeId(legacyItem.type);
    assets.push({
      id: assetId,
      kind: legacyItem.type,
      url: legacyItem.url,
      title: legacyItem.title,
      sourceLegacyId: legacyItem.id,
    });

    if (legacyItem.type === 'image') {
      imageAssetIds.push(assetId);
      timeline.push({
        id: makeId('block'),
        kind: 'image',
        assetId,
        title: legacyItem.title,
      });
    } else if (legacyItem.type === 'video') {
      videoAssetIds.push(assetId);
      timeline.push({
        id: makeId('block'),
        kind: 'video',
        assetId,
        title: legacyItem.title,
      });
    } else if (!voiceMemoAssetId) {
      voiceMemoAssetId = assetId;
      timeline.push({
        id: makeId('block'),
        kind: 'voiceMemo',
        assetId,
        title: legacyItem.title,
      });
    }
  }

  let ambientAudioAssetId: string | undefined;
  if (legacy.masterAudioUrl) {
    ambientAudioAssetId = makeId('audio');
    assets.push({
      id: ambientAudioAssetId,
      kind: 'audio',
      url: legacy.masterAudioUrl,
      title: 'Ambient bed',
    });
  }

  return createXsoDraft({
    identity: {
      senderName: options.identity?.senderName ?? 'Unknown Sender',
      senderEmail: options.identity?.senderEmail ?? 'unknown.sender@example.com',
      recipientName: options.identity?.recipientName ?? 'Recipient',
      recipientEmail: options.identity?.recipientEmail,
      senderRevealMode: options.identity?.senderRevealMode ?? 'DISCOVER',
    },
    assets,
    content: {
      imageAssetIds,
      videoAssetIds,
      voiceMemoAssetId,
      ambientAudioAssetId,
      textMessage: options.textMessage,
      story: options.story,
      memories: options.memories ?? [],
      emotionalDirection: options.emotionalDirection,
      selectedAtmosphere: options.selectedAtmosphere,
      timeline,
    },
    ending: {
      mode: options.endingMode ?? 'PEARL',
    },
    delivery: {
      status: options.deliveryStatus ?? 'PENDING',
    },
    lifecycle: {
      status: options.lifecycleStatus ?? 'DRAFT',
    },
  });
}
