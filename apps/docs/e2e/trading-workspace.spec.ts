import { expect, test } from "@playwright/test";

test("renders the equity trade workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Mosaic" })).toBeVisible();
  await expect(page.getByRole("button", { name: "AAPL" })).toBeVisible();
  await expect(page.getByRole("button", { name: "BTC/USD" })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review order" }),
  ).toBeVisible();
});

test("renders crypto market data with order book and recent trades", async ({
  page,
}) => {
  await page.goto("/");

  await page.getByRole("button", { name: "BTC/USD" }).click();

  await expect(page.getByRole("heading", { name: "Order book" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Recent trades" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Review order" }),
  ).toBeVisible();
});

test("can click an order-book price into the limit field", async ({ page }) => {
  await page.goto("/");

  await page.getByRole("button", { name: "BTC/USD" }).click();

  const limitPrice = page.getByRole("textbox", { name: "Limit price" });
  await expect(limitPrice).toBeVisible();

  await page
    .getByRole("button", { name: /Use ask price/i })
    .first()
    .click();

  await expect(limitPrice).not.toHaveValue("0");
});
