import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";
const shots = "assets/screenshots";
test.beforeAll(async () => {
  await mkdir(shots, { recursive: true });
});
test("captures normal context workspace", async ({ page }) => {
  await page.setViewportSize({ width: 1180, height: 760 });
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: "Choose folder" }).click();
  await expect(page.getByText("src/App.svelte")).toBeVisible();
  await page.getByText("src/App.svelte").click();
  await expect(page.getByText(/focused local context/)).toBeVisible();
  await page.screenshot({ path: `${shots}/v1-context-1180x760.png`, fullPage: true });
});
test("captures compact rules state", async ({ page }) => {
  await page.setViewportSize({ width: 720, height: 520 });
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: "Rules" }).click();
  await expect(page.getByText("Shape the context deliberately.")).toBeVisible();
  await page.screenshot({ path: `${shots}/v1-rules-720x520.png`, fullPage: true });
});
test("captures expanded generated output", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/?demo=1");
  await page.getByRole("button", { name: "Choose folder" }).click();
  await page.getByRole("button", { name: "Generate" }).click();
  await expect(page.getByText(/Repository Context/)).toBeVisible();
  await page.screenshot({ path: `${shots}/v1-output-1440x900.png`, fullPage: true });
});
