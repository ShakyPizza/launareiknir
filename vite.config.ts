import { defineConfig } from "vitest/config";

export default defineConfig({
  base: "/launareiknir/",
  test: {
    environment: "jsdom",
    globals: true
  }
});
