import "@fontsource/newsreader/latin-500.css";
import "@fontsource/public-sans/latin-400.css";
import "@fontsource/public-sans/latin-700.css";
import "@fontsource/public-sans/latin-800.css";
import "./styles.css";
import { renderCalculator } from "./app";
import { copy } from "./content/is";

document.title = copy.meta.title;

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("App container fannst ekki.");
}

renderCalculator(app);
