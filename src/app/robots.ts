import { baseURL } from "@/config";

export default function robots() {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: ["/admin"],
      },
    ],
    sitemap: `${baseURL}/sitemap.xml`,
  };
}
