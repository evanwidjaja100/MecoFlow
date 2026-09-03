import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    linterOptions: {
      reportUnusedDisableDirectives: "off",
    },
  },
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: process.cwd(),
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      "no-console": "error",
    },
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
  },
  {
    ...tseslint.configs.disableTypeChecked,
    files: ["**/*.config.{js,mjs,ts}", "**/scripts/**/*.{js,mjs,ts}"],
    rules: {
      ...tseslint.configs.disableTypeChecked.rules,
      "no-console": "off",
    },
  },
);