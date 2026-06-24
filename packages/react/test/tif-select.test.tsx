import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TifSelect } from "../src/tif-select";

describe("TifSelect", () => {
  it("shows the selected TIF label", () => {
    render(<TifSelect allowedTifs={["day", "gtc"]} value="day" />);

    expect(
      screen.getByRole("button", { name: /Time in force/i }),
    ).toHaveTextContent("Day");
  });

  it("reports a selected TIF", async () => {
    const user = userEvent.setup();
    const handleChange = vi.fn();

    render(
      <TifSelect
        allowedTifs={["day", "gtc"]}
        value="day"
        onChange={handleChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Time in force/i }));

    await user.click(
      screen.getByRole("option", {
        name: "Good 'til canceled",
      }),
    );

    expect(handleChange).toHaveBeenCalledWith("gtc");
  });

  it("supports translated labels", () => {
    render(
      <TifSelect
        allowedTifs={["day", "gtc"]}
        value="gtc"
        messages={{
          label: "有効期限",
          gtc: "取消まで有効",
        }}
      />,
    );

    expect(screen.getByRole("button", { name: /有効期限/ })).toHaveTextContent(
      "取消まで有効",
    );
  });

  it("mounts the popover within the select positioning root", async () => {
    const user = userEvent.setup();

    render(
      <TifSelect
        allowedTifs={["day", "gtc"]}
        value="day"
        classNames={{
          root: "tif-root",
          popover: "tif-popover",
        }}
      />,
    );

    await user.click(screen.getByRole("button", { name: /Time in force/i }));

    const root = document.querySelector<HTMLElement>(".tif-root");
    const popover = document.querySelector<HTMLElement>(".tif-popover");

    expect(root).toContainElement(popover);
  });
});
