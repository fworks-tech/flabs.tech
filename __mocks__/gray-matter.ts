function matter(content: string) {
  const lines = content.split("\n");
  let data: Record<string, any> = {};
  let bodyStart = 0;

  if (lines[0]?.trim() === "---") {
    let endIndex = lines.indexOf("---", 1);
    if (endIndex === -1) endIndex = lines.length;
    const frontmatter = lines.slice(1, endIndex);
    data = Object.fromEntries(
      frontmatter
        .filter((line) => line.includes(":"))
        .map((line) => {
          const [key, ...rest] = line.split(":");
          return [key.trim(), rest.join(":").trim()];
        }),
    );
    bodyStart = endIndex + 1;
  }

  const content_text = lines.slice(bodyStart).join("\n").trim();
  return { data, content: content_text };
}

export default matter;
