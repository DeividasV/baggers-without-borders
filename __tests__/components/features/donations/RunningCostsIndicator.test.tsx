/**
 * RunningCostsIndicator
 *
 * This component was refactored from a client-side timeline (with month buttons
 * and hover tooltips) into an async server component that reads funding
 * settings directly and renders a single static bar. The previous suite asserted
 * the removed timeline UI, so it could never pass.
 *
 * These tests render the current component output.
 */

import { render, screen } from "@testing-library/react";

jest.mock("@/src/lib/funding-settings", () => {
  const actual = jest.requireActual("@/src/lib/funding-bar-utils");
  return {
    getFundingSettings: jest.fn(),
    computeBarSegments: actual.computeBarSegments,
  };
});

import { getFundingSettings } from "@/src/lib/funding-settings";
import { RunningCostsIndicator } from "@/app/components/features/donations/RunningCostsIndicator";

const mockSettings = getFundingSettings as jest.MockedFunction<typeof getFundingSettings>;

const SETTINGS = {
  totalSpent: 1200,
  totalCollected: 480,
  monthlyEst: 25,
};

async function renderIndicator() {
  const ui = await RunningCostsIndicator();
  return render(ui);
}

describe("RunningCostsIndicator", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSettings.mockResolvedValue(SETTINGS);
  });

  it("renders the Running Costs heading", async () => {
    await renderIndicator();
    expect(screen.getByRole("heading", { name: /running costs/i })).toBeInTheDocument();
  });

  it("states total spend and the ongoing monthly estimate", async () => {
    await renderIndicator();
    const text = document.body.textContent || "";
    expect(text).toContain(`€${SETTINGS.totalSpent.toFixed(0)}`);
    expect(text).toContain(`€${SETTINGS.monthlyEst}/month`);
    expect(text).toContain(`€${SETTINGS.monthlyEst * 12}/year`);
  });

  it("reports the contributed amount", async () => {
    await renderIndicator();
    expect(
      screen.getByText(`€${SETTINGS.totalCollected.toFixed(2)} contributed`)
    ).toBeInTheDocument();
  });

  it("exposes the coverage as an accessible progressbar", async () => {
    await renderIndicator();
    const bar = screen.getByRole("progressbar");
    const expected = Math.round((SETTINGS.totalCollected / SETTINGS.totalSpent) * 100);
    expect(bar).toHaveAttribute("aria-valuenow", String(expected));
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
    expect(bar.getAttribute("aria-label")).toMatch(/% of costs covered/);
  });

  it("renders machine-readable timestamps for the timeline ends", async () => {
    const { container } = await renderIndicator();
    const times = container.querySelectorAll("time[dateTime]");
    expect(times.length).toBeGreaterThanOrEqual(2);
    times.forEach((t) => {
      expect(t.getAttribute("dateTime")).toMatch(/^\d{4}-\d{2}$/);
    });
  });

  it("shows a gap when contributions do not cover costs", async () => {
    await renderIndicator();
    // totalCollected (480) < totalSpent (1200), so a gap must be shown.
    expect(screen.getByText(/gap$/)).toBeInTheDocument();
  });

  it("does not show a gap when costs are fully covered", async () => {
    mockSettings.mockResolvedValue({
      totalSpent: 100,
      totalCollected: 500,
      monthlyEst: 10,
    });
    await renderIndicator();
    expect(screen.queryByText(/gap$/)).not.toBeInTheDocument();
  });
});
