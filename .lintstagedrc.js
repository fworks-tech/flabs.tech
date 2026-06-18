module.exports = {
  "*.{js,jsx,ts,tsx}": (filenames) => [
    `eslint --fix ${filenames.map((f) => `"${f}"`).join(" ")}`,
    `prettier --write ${filenames.map((f) => `"${f}"`).join(" ")}`,
  ],
  "*.{json,css,scss,md,mdx}": (filenames) => [
    `prettier --write ${filenames.map((f) => `"${f}"`).join(" ")}`,
  ],
};
