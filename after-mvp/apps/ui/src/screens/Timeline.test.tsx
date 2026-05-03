import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Timeline } from "@/screens/Timeline";

describe("Timeline", () => {
  it("renders timeline filters and event detail", () => {
    render(<Timeline />);

    expect(screen.getByRole("textbox", { name: /search timeline/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
    expect(screen.getByText("Capture engine completed")).toBeInTheDocument();
  });

  it("filters, searches, and selects timeline events", () => {
    render(<Timeline />);

    fireEvent.click(screen.getByRole("button", { name: "Decisions" }));
    expect(screen.getByText("Audit and verification cleaned up")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("textbox", { name: /search timeline/i }), {
      target: { value: "dashboard" },
    });
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    expect(screen.getByText("Dashboard slice started")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Dashboard slice started"));
    expect(screen.getByText("apps/ui/src")).toBeInTheDocument();
  });
});
