import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { RecentTrades } from "../src/recent-trades";

const trades = [
  {
    symbol: "BTC/USD",
    assetClass: "crypto" as const,
    tradeId: "t-1",
    px: 67250.12,
    qty: 0.015,
    side: "buy" as const,
    executedAt: Date.UTC(2026, 5, 26, 1, 30, 10),
  },
  {
    symbol: "BTC/USD",
    assetClass: "crypto" as const,
    tradeId: "t-2",
    px: 67249.98,
    qty: 0.02,
    side: "sell" as const,
    executedAt: Date.UTC(2026, 5, 26, 1, 30, 9),
  },
];

describe("RecentTrades", () => {
  it("renders recent trade prints", () => {
    render(<RecentTrades trades={trades} quoteCurrency="USD" />);

    expect(
      screen.getByRole("heading", { name: "Recent trades" }),
    ).toBeInTheDocument();
    expect(screen.getByText("67,250.12 USD")).toBeInTheDocument();
    expect(screen.getByText("0.015")).toBeInTheDocument();
  });

  it("limits visible rows by depth", () => {
    render(<RecentTrades trades={trades} quoteCurrency="USD" depth={1} />);

    expect(screen.getByText("67,250.12 USD")).toBeInTheDocument();
    expect(screen.queryByText("67,249.98 USD")).not.toBeInTheDocument();
  });

  it("calls onSelectPrice when a trade is clicked", async () => {
    const user = userEvent.setup();
    const handleSelect = vi.fn();

    render(
      <RecentTrades
        trades={trades}
        quoteCurrency="USD"
        onSelectPrice={handleSelect}
      />,
    );

    await user.click(
      screen.getByRole("button", { name: "Use trade price 67,250.12 USD" }),
    );

    expect(handleSelect).toHaveBeenCalledWith(67250.12, trades[0]);
  });

  it("supports custom messages", () => {
    render(
      <RecentTrades
        trades={[]}
        quoteCurrency="USD"
        messages={{
          title: "Ultimas operaciones",
          empty: "Sin operaciones recientes.",
        }}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "Ultimas operaciones" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Sin operaciones recientes.")).toBeInTheDocument();
  });
});
