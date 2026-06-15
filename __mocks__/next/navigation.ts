const useRouter = vi.fn(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
}));

const usePathname = vi.fn(() => "/");

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

const useSearchParams = vi.fn(() => new URLSearchParams());

export { notFound, usePathname, useRouter, useSearchParams };
