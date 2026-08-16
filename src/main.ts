import { mount } from "svelte";
import App from "./App.svelte";
import "./styles.css";

const target = document.getElementById("app");
if (!target) throw new Error("Missing app mount point");
const demo = import.meta.env.DEV && new URLSearchParams(location.search).has("demo");
if (demo) {
  const { createDemoClient } = await import("./demo");
  mount(App, { target, props: { client: createDemoClient() } });
} else {
  mount(App, { target });
}
