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

type FAQPageSchema = {
  as: "faqPage";
  baseURL: string;
  path?: string;
  title?: string;
  description?: string;
  faqs: { question: string; answer: string }[];
};

type SchemaProps = WebPageSchema | BlogPostingSchema | FAQPageSchema;

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

function buildFAQPageSchema(props: FAQPageSchema) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    ...(props.title && { name: props.title }),
    ...(props.description && { description: props.description }),
    ...(props.path && { url: `${props.baseURL}${props.path}` }),
    mainEntity: props.faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function Schema(props: SchemaProps) {
  const data =
    props.as === "webPage"
      ? buildWebPageSchema(props)
      : props.as === "blogPosting"
        ? buildBlogPostingSchema(props)
        : buildFAQPageSchema(props);

  return <JsonLd data={data} />;
}
