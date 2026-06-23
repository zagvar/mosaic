import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TradeDecimalField } from "../src/internal/trade-decimal-field";

describe("TradeDecimalField", () => {
  it("allows transitional decimal input without clearing the field", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TradeDecimalField
        label="Quantity"
        onChange={handleChange}
        precision={6}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Quantity" });

    await user.type(input, ".");

    expect(input).toHaveValue(".");
    expect(handleChange).not.toHaveBeenCalled();
  });

  it("keeps trailing decimal edits local until the value is complete", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TradeDecimalField
        label="Quantity"
        onChange={handleChange}
        precision={6}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Quantity" });

    await user.type(input, "1.");

    expect(input).toHaveValue("1.");
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenLastCalledWith(1);
  });

  it("does not collapse fractional input to zero while deleting", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TradeDecimalField
        label="Quantity"
        onChange={handleChange}
        precision={6}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Quantity" });

    await user.type(input, "0.00001");
    await user.keyboard("{Backspace}");

    expect(input).toHaveValue("0.0000");
    expect(handleChange).toHaveBeenLastCalledWith(0);
  });

  it("prevents extra decimal places beyond the configured precision", async () => {
    const user = userEvent.setup();

    render(<TradeDecimalField label="Quantity" precision={6} />);

    const input = screen.getByRole("textbox", { name: "Quantity" });

    await user.type(input, "0.0000001");

    expect(input).toHaveValue("0.000000");
  });

  it("prevents multiple leading zeros in the whole-number part", async () => {
    const user = userEvent.setup();

    render(<TradeDecimalField label="Quantity" precision={6} />);

    const input = screen.getByRole("textbox", { name: "Quantity" });

    await user.type(input, "00000.1");

    expect(input).toHaveValue("0.1");
  });
});
