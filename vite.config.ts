import { defineConfig } from "vite";

export default defineConfig({
  base: "/launareiknir/",
  test: {
    environment: "jsdom",
    globals: true
  }
});
