import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // The React Compiler rules assume a pure render model that react-three-fiber
    // deliberately does not follow. Inside the scene we must:
    //   - configure textures returned by useTexture (colorSpace, wrapping,
    //     anisotropy) — drei hands them over expecting exactly that;
    //   - mutate camera and reuse module-level vectors inside useFrame, because
    //     allocating per frame is what actually costs frames here;
    //   - seed particle buffers with Math.random once inside useMemo.
    // These are the documented idioms for this library, so the rules are scoped
    // off here rather than worked around in ways that would be slower and less
    // conventional. Everything outside src/components/scene stays fully checked.
    files: ["src/components/scene/**/*.tsx"],
    rules: {
      "react-hooks/purity": "off",
      "react-hooks/immutability": "off",
      "react-hooks/refs": "off",
    },
  },
]);

export default eslintConfig;
