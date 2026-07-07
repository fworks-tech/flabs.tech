import { JsonLd } from "@/components/layout/JsonLd";

type WebPageSchema = {
  as: "webPage";
  baseURL: string;
  sameAs?: string[];
  path?: string;
  title?: string;
  description?: string;
  image?: string;
  author?: {
    name: string;
    url: string;
    image: string;
  };
};

type BlogPostingSchema = {
  as: "blogPosting";
  baseURL: string;
  sameAs?: string[];
  path?: string;
  title?: string;
  description?: string;
  image?: string;
  author?: {
    name: string;
    url: string;
    image: string;
  };
  datePublished?: string;
  dateModified?: string;
};

type SchemaProps = WebPageSchema | BlogPostingSchema;

function buildWebPageSchema(props: WebPageSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    url: props.path ? `${props.baseURL}${props.path}` : props.baseURL,
    ...(props.title && { name: props.title }),
    ...(props.description && { description: props.description }),
    ...(props.image && { image: props.image }),
    ...(props.sameAs?.length && { sameAs: props.sameAs }),
    ...(props.author && {
      author: {
        "@type": "Person",
        name: props.author.name,
        url: props.author.url,
        image: props.author.image,
      },
    }),
  };
}

function buildBlogPostingSchema(props: BlogPostingSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    ...(props.path && { url: `${props.baseURL}${props.path}` }),
    ...(props.title && { headline: props.title }),
    ...(props.description && { description: props.description }),
    ...(props.image && { image: props.image }),
    ...(props.datePublished && { datePublished: props.datePublished }),
    ...(props.dateModified && { dateModified: props.dateModified }),
    ...(props.author && {
      author: {
        "@type": "Person",
        name: props.author.name,
        url: props.author.url,
        image: props.author.image,
      },
    }),
    ...(props.sameAs?.length && { sameAs: props.sameAs }),
  };
}

export function Schema(props: SchemaProps) {
  const data =
    props.as === "webPage"
      ? buildWebPageSchema(props)
      : buildBlogPostingSchema(props);

  return <JsonLd data={data} />;
}
