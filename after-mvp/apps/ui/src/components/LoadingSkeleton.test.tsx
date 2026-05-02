import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LoadingSkeleton } from "@/components/LoadingSkeleton";

describe("LoadingSkeleton", () => {
  it("exposes a loading state to assistive technology", () => {
    render(<LoadingSkeleton />);

    expect(screen.getByLabelText("Loading project data")).toBeInTheDocument();
  });
});
