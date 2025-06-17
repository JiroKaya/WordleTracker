import { defineConfig } from "eslint/config";
import { fileURLToPath } from "url";
import { dirname } from "path";

import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import importPlugin from "eslint-plugin-import";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettierPlugin from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig([
  // 🔹 Ignore typical build folders
  {
    ignores: ["node_modules/**", "dist/**", "build/**", "coverage/**"],
  },

  // 🔹 ESLint base JS rules
  js.configs.recommended,

  // 🔹 TypeScript support
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
        ecmaVersion: "latest",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs["recommended-requiring-type-checking"].rules,
    },
  },

  // 🔹 Import plugin
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      ...importPlugin.configs.recommended.rules,
      ...importPlugin.configs.typescript.rules,
    },
    settings: {
      "import/resolver": {
        node: {
          extensions: [".js", ".ts", ".tsx"],
        },
      },
    },
  },

  // 🔹 React, Hooks, A11y
  {
    files: ["**/*.{jsx,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      ...jsxA11y.configs.recommended.rules,
      "react/prop-types": "off",
    },
  },

  // 🔹 Prettier formatting
  {
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      "prettier/prettier": "error",
    },
  },
  prettierConfig, // disables conflicting ESLint stylistic rules

  // 🔹 Backend override
  {
  files: ["apps/server/**/*.ts"],
  languageOptions: {
    parser: tsParser,
    parserOptions: { project: "apps/server/tsconfig.json" },
    ecmaVersion: 2021,
    globals: {
      __dirname: "readonly",
      module: "readonly",
      require: "readonly",
      process: "readonly",
      console: "readonly",
      fetch: "readonly",
    },
  },
  rules: {
    "no-console": "off",
  },
},


  // 🔹 Frontend override
  {
  files: ["apps/web/**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: { projectService: "apps/web/tsconfig.json" },
    ecmaVersion: 2021,
    globals: {
      window: "readonly",
      document: "readonly",
      localStorage: "readonly",
      console: "readonly",
      fetch: "readonly",
    },
  },
  settings: { react: { version: "detect" } },
  rules: { 
    "react/prop-types": "off",
    "react/react-in-jsx-scope": "off"
  },
},

]);
