import { render, screen, within } from "@testing-library/react";
import LandingPage from "@/app/page";
import { getServerSession } from "next-auth";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/src/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/src/lib/prisma", () => ({
  prisma: {
    hallOfFame: {
      findMany: jest.fn(),
    },
  },
}));

const { prisma } = jest.requireMock("@/src/lib/prisma") as {
  prisma: {
    hallOfFame: {
      findMany: jest.Mock;
    };
  };
};

describe("LandingPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getServerSession as jest.Mock).mockResolvedValue(null);
    prisma.hallOfFame.findMany.mockResolvedValue([
      { id: "hof-p100", code: "P100", title: "P100 Table" },
      { id: "hof-p600", code: "P600", title: "P600 Table" },
    ]);
  });

  it("uses the public HoF defaults link without hardcoded filters", async () => {
    const page = await LandingPage();
    render(page);

    const headline = screen.getByRole("heading", { name: "Hall of Fame Tables" });
    const card = headline.closest("div");

    expect(card).toBeTruthy();
    expect(within(card as HTMLElement).getByRole("link", { name: /read more/i })).toHaveAttribute(
      "href",
      "/hof-tables"
    );
  });

  it("preserves the clicked HoF without forcing a year in footer links", async () => {
    const page = await LandingPage();
    render(page);

    expect(screen.getByRole("link", { name: "P100" })).toHaveAttribute(
      "href",
      "/hof-tables?hof=hof-p100"
    );
    expect(screen.getByRole("link", { name: "P600" })).toHaveAttribute(
      "href",
      "/hof-tables?hof=hof-p600"
    );
  });
});
