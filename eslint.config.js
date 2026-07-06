import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default tseslint.config(
  // CQI_Quality_Dashboard_Reference.jsx is a standalone Power BI reference mock, not part of the app build.
  { ignores: ["**/dist/**", "**/node_modules/**", "CQI_Quality_Dashboard_Reference.jsx"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["server/src/**/*.ts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["client/src/**/*.{ts,tsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  }
);
