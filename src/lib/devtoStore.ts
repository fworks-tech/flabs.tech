import { store } from "@/lib/abuse/store";

export const DEVTO_RECORD_PREFIX = "devto:";

export type DevtoRecord = {
  id: number;
  slug: string;
  url: string;
  publishedAt: string;
};

export function devtoRecordKey(slug: string): string {
  return `${DEVTO_RECORD_PREFIX}${slug}`;
}

export async function getDevtoRecord(slug: string): Promise<DevtoRecord | null> {
  return store.get<DevtoRecord>(devtoRecordKey(slug));
}

export async function saveDevtoRecord(record: DevtoRecord): Promise<void> {
  await store.set(devtoRecordKey(record.slug), record);
}

export async function deleteDevtoRecord(slug: string): Promise<void> {
  await store.del(devtoRecordKey(slug));
}

/** Returns every recorded cross-post, in no particular order. */
export async function listDevtoRecords(): Promise<DevtoRecord[]> {
  const keys = await store.keys(`${DEVTO_RECORD_PREFIX}*`);
  const records = await Promise.all(keys.map((key) => store.get<DevtoRecord>(key)));
  return records.filter((record): record is DevtoRecord => record !== null);
}
