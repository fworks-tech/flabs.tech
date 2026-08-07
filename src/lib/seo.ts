import type { Metadata } from "next";
import { person } from "@/content";

export type GenerateMetaParams = {
  title: string;
  description: string;
  baseURL: string;
  image?: string;
  path: string;
};

export function generateMeta({
  title,
  description,
  baseURL,
  image,
  path,
}: GenerateMetaParams): Metadata {
  const url = `${baseURL}${path}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: person.name,
      locale: "en_US",
      type: "website",
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}
