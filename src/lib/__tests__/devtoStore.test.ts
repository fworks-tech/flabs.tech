import { beforeEach, describe, expect, it } from "vitest";
import {
  deleteDevtoRecord,
  devtoRecordKey,
  getDevtoRecord,
  listDevtoRecords,
  saveDevtoRecord,
} from "../devtoStore";

describe("devtoStore", () => {
  beforeEach(async () => {
    await deleteDevtoRecord("alpha");
    await deleteDevtoRecord("beta");
  });

  it("stores and reads a record by slug", async () => {
    const record = { id: 1, slug: "alpha", url: "https://dev.to/flabs/alpha", publishedAt: "2026-08-01T00:00:00.000Z" };
    await saveDevtoRecord(record);

    await expect(getDevtoRecord("alpha")).resolves.toEqual(record);
  });

  it("returns null for an unknown slug", async () => {
    await expect(getDevtoRecord("missing")).resolves.toBeNull();
  });

  it("deletes a record", async () => {
    await saveDevtoRecord({ id: 2, slug: "alpha", url: "https://dev.to/flabs/alpha", publishedAt: "2026-08-01T00:00:00.000Z" });
    await deleteDevtoRecord("alpha");

    await expect(getDevtoRecord("alpha")).resolves.toBeNull();
  });

  it("lists all records under the devto prefix", async () => {
    await saveDevtoRecord({ id: 1, slug: "alpha", url: "https://dev.to/flabs/alpha", publishedAt: "2026-08-01T00:00:00.000Z" });
    await saveDevtoRecord({ id: 2, slug: "beta", url: "https://dev.to/flabs/beta", publishedAt: "2026-08-02T00:00:00.000Z" });

    const records = await listDevtoRecords();
    expect(records).toHaveLength(2);
    expect(records.map((r) => r.slug).sort()).toEqual(["alpha", "beta"]);
  });

  it("builds namespaced keys", () => {
    expect(devtoRecordKey("alpha")).toBe("devto:alpha");
  });
});
