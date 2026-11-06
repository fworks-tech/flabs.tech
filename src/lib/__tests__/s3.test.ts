import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const sendMock = vi.hoisted(() => vi.fn());
const getSignedUrlMock = vi.hoisted(() => vi.fn());

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: class {
    send = sendMock;
  },
  PutObjectCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  DeleteObjectCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
  GetObjectCommand: class {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  },
}));

vi.mock("@aws-sdk/s3-request-presigner", () => ({
  getSignedUrl: getSignedUrlMock,
}));

describe("s3 helper", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    sendMock.mockReset();
    getSignedUrlMock.mockReset();
    process.env.AWS_REGION = "us-east-1";
    process.env.AWS_S3_BUCKET = "test-bucket";
    process.env.AWS_ACCESS_KEY_ID = "AKIAIOSFODNN7EXAMPLE";
    process.env.AWS_SECRET_ACCESS_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("isS3Configured returns true when bucket + creds are set", async () => {
    const { isS3Configured } = await import("../s3");
    expect(isS3Configured()).toBe(true);
  });

  it("uploadFile sends PutObject and returns public URL", async () => {
    sendMock.mockResolvedValue({});
    const { uploadFile } = await import("../s3");
    const url = await uploadFile("uploads/foo.png", Buffer.from("x"), "image/png");
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(url).toBe("https://test-bucket.s3.us-east-1.amazonaws.com/uploads/foo.png");
  });

  it("deleteFile sends DeleteObject", async () => {
    sendMock.mockResolvedValue({});
    const { deleteFile } = await import("../s3");
    await deleteFile("uploads/foo.png");
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it("getPresignedUrl delegates to presigner", async () => {
    getSignedUrlMock.mockResolvedValue("https://signed.example/url");
    const { getPresignedUrl } = await import("../s3");
    const url = await getPresignedUrl("uploads/foo.png", 60);
    expect(url).toBe("https://signed.example/url");
    expect(getSignedUrlMock).toHaveBeenCalledTimes(1);
  });

  it("publicUrl builds the expected URL", async () => {
    const { publicUrl } = await import("../s3");
    expect(publicUrl("a/b.png")).toBe("https://test-bucket.s3.us-east-1.amazonaws.com/a/b.png");
  });
});