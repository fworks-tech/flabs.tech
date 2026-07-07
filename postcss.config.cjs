module.exports = {
  plugins: {
    "postcss-preset-mantine": {},
    "postcss-simple-vars": {
      variables: {
        "mantine-breakpoint-xs": "480px",
        "mantine-breakpoint-sm": "768px",
        "mantine-breakpoint-md": "1024px",
        "mantine-breakpoint-lg": "1440px",
        "mantine-breakpoint-xl": "1600px",
      },
    },
  },
};
