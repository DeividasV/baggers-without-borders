import { render, screen } from "@/__tests__/utils/test-utils";
import TestSummaryCards from "@/app/components/features/test-results/TestSummaryCards";

describe("TestSummaryCards", () => {
  describe("Test Suites Section", () => {
    it("renders test suites section with correct title", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      expect(screen.getByText("Test Suites")).toBeInTheDocument();
    });

    it("displays total suites count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // Find the card with "Total Suites" text
      const totalSuitesCard = screen
        .getByText("Total Suites")
        .closest("div.bg-dark-800");
      expect(totalSuitesCard).toHaveTextContent("20");
    });

    it("displays passed suites count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const passedSuitesCards = screen.getAllByText("Passed");
      const passedSuitesCard = passedSuitesCards[0].closest("div.bg-dark-800");
      expect(passedSuitesCard).toHaveTextContent("18");
    });

    it("displays failed suites count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const failedSuitesCards = screen.getAllByText("Failed");
      const failedSuitesCard = failedSuitesCards[0].closest("div.bg-dark-800");
      expect(failedSuitesCard).toHaveTextContent("1");
    });

    it("displays skipped suites count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const skippedSuitesCards = screen.getAllByText("Skipped");
      const skippedSuitesCard =
        skippedSuitesCards[0].closest("div.bg-dark-800");
      expect(skippedSuitesCard).toHaveTextContent("1");
    });

    it("calculates and displays suite pass rate correctly", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // 18/20 = 90.0%
      const totalSuitesCard = screen
        .getByText("Total Suites")
        .closest("div.bg-dark-800");
      expect(totalSuitesCard).toHaveTextContent("90.0% pass rate");
    });

    it("displays suite failure percentage", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={2}
          skippedSuites={0}
        />
      );

      // 2/20 = 10.0%
      const failedSuitesCards = screen.getAllByText("Failed");
      const failedSuitesCard = failedSuitesCards[0].closest("div.bg-dark-800");
      expect(failedSuitesCard).toHaveTextContent("10.0% need fixing");
    });

    it("displays 'None' when no failed suites", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={100}
          failedTests={0}
          skippedTests={0}
          totalSuites={20}
          passedSuites={20}
          failedSuites={0}
          skippedSuites={0}
        />
      );

      const failedSuitesCards = screen.getAllByText("Failed");
      const failedSuitesCard = failedSuitesCards[0].closest("div.bg-dark-800");
      expect(failedSuitesCard).toHaveTextContent("None");
    });

    it("displays suite skipped percentage", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // 1/20 = 5.0%
      const skippedSuitesCards = screen.getAllByText("Skipped");
      const skippedSuitesCard =
        skippedSuitesCards[0].closest("div.bg-dark-800");
      expect(skippedSuitesCard).toHaveTextContent("5.0% skipped");
    });

    it("displays 'None' when no skipped suites", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={10}
          skippedTests={0}
          totalSuites={20}
          passedSuites={18}
          failedSuites={2}
          skippedSuites={0}
        />
      );

      const skippedSuitesCards = screen.getAllByText("Skipped");
      const skippedSuitesCard =
        skippedSuitesCards[0].closest("div.bg-dark-800");
      expect(skippedSuitesCard).toHaveTextContent("None");
    });
  });

  describe("Individual Tests Section", () => {
    it("renders individual tests section with correct title", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      expect(screen.getByText("Individual Tests")).toBeInTheDocument();
    });

    it("displays total tests count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const totalTestsCard = screen
        .getByText("Total Tests")
        .closest("div.bg-dark-800");
      expect(totalTestsCard).toHaveTextContent("100");
    });

    it("displays passed tests count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const passedTestsCards = screen.getAllByText("Passed");
      const passedTestsCard = passedTestsCards[1].closest("div.bg-dark-800");
      expect(passedTestsCard).toHaveTextContent("90");
    });

    it("displays failed tests count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const failedTestsCards = screen.getAllByText("Failed");
      const failedTestsCard = failedTestsCards[1].closest("div.bg-dark-800");
      expect(failedTestsCard).toHaveTextContent("5");
    });

    it("displays skipped tests count", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      const skippedTestsCards = screen.getAllByText("Skipped");
      const skippedTestsCard = skippedTestsCards[1].closest("div.bg-dark-800");
      expect(skippedTestsCard).toHaveTextContent("5");
    });

    it("calculates and displays test pass rate correctly", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // 90/100 = 90.0%
      const totalTestsCard = screen
        .getByText("Total Tests")
        .closest("div.bg-dark-800");
      expect(totalTestsCard).toHaveTextContent("90.0% pass rate");
    });

    it("displays test failure percentage", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={10}
          skippedTests={0}
          totalSuites={20}
          passedSuites={18}
          failedSuites={2}
          skippedSuites={0}
        />
      );

      // 10/100 = 10.0%
      const failedTestsCards = screen.getAllByText("Failed");
      const failedTestsCard = failedTestsCards[1].closest("div.bg-dark-800");
      expect(failedTestsCard).toHaveTextContent("10.0% need review");
    });

    it("displays 'None' when no failed tests", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={100}
          failedTests={0}
          skippedTests={0}
          totalSuites={20}
          passedSuites={20}
          failedSuites={0}
          skippedSuites={0}
        />
      );

      const failedTestsCards = screen.getAllByText("Failed");
      const failedTestsCard = failedTestsCards[1].closest("div.bg-dark-800");
      expect(failedTestsCard).toHaveTextContent("None");
    });

    it("displays test skipped percentage", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // 5/100 = 5.0%
      const skippedTestsCards = screen.getAllByText("Skipped");
      const skippedTestsCard = skippedTestsCards[1].closest("div.bg-dark-800");
      expect(skippedTestsCard).toHaveTextContent("5.0% skipped");
    });

    it("displays 'None' when no skipped tests", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={10}
          skippedTests={0}
          totalSuites={20}
          passedSuites={18}
          failedSuites={2}
          skippedSuites={0}
        />
      );

      const skippedTestsCards = screen.getAllByText("Skipped");
      const skippedTestsCard = skippedTestsCards[1].closest("div.bg-dark-800");
      expect(skippedTestsCard).toHaveTextContent("None");
    });
  });

  describe("Edge Cases", () => {
    it("handles zero values for all counts", () => {
      render(
        <TestSummaryCards
          totalTests={0}
          passedTests={0}
          failedTests={0}
          skippedTests={0}
          totalSuites={0}
          passedSuites={0}
          failedSuites={0}
          skippedSuites={0}
        />
      );

      expect(screen.getByText("Total Suites")).toBeInTheDocument();
      expect(screen.getByText("Total Tests")).toBeInTheDocument();
    });

    it("calculates 0% pass rate when totalTests is 0", () => {
      render(
        <TestSummaryCards
          totalTests={0}
          passedTests={0}
          failedTests={0}
          skippedTests={0}
          totalSuites={0}
          passedSuites={0}
          failedSuites={0}
          skippedSuites={0}
        />
      );

      const totalTestsCard = screen
        .getByText("Total Tests")
        .closest("div.bg-dark-800");
      expect(totalTestsCard).toHaveTextContent("0.0% pass rate");
    });

    it("calculates 0% suite pass rate when totalSuites is 0", () => {
      render(
        <TestSummaryCards
          totalTests={0}
          passedTests={0}
          failedTests={0}
          skippedTests={0}
          totalSuites={0}
          passedSuites={0}
          failedSuites={0}
          skippedSuites={0}
        />
      );

      const totalSuitesCard = screen
        .getByText("Total Suites")
        .closest("div.bg-dark-800");
      expect(totalSuitesCard).toHaveTextContent("0.0% pass rate");
    });

    it("displays 100% pass rate when all tests pass", () => {
      render(
        <TestSummaryCards
          totalTests={100}
          passedTests={100}
          failedTests={0}
          skippedTests={0}
          totalSuites={20}
          passedSuites={20}
          failedSuites={0}
          skippedSuites={0}
        />
      );

      const totalTestsCard = screen
        .getByText("Total Tests")
        .closest("div.bg-dark-800");
      expect(totalTestsCard).toHaveTextContent("100.0% pass rate");

      const totalSuitesCard = screen
        .getByText("Total Suites")
        .closest("div.bg-dark-800");
      expect(totalSuitesCard).toHaveTextContent("100.0% pass rate");
    });

    it("handles large numbers correctly", () => {
      render(
        <TestSummaryCards
          totalTests={99999}
          passedTests={99900}
          failedTests={99}
          skippedTests={0}
          totalSuites={9999}
          passedSuites={9990}
          failedSuites={9}
          skippedSuites={0}
        />
      );

      const totalTestsCard = screen
        .getByText("Total Tests")
        .closest("div.bg-dark-800");
      expect(totalTestsCard).toHaveTextContent("99999");

      const totalSuitesCard = screen
        .getByText("Total Suites")
        .closest("div.bg-dark-800");
      expect(totalSuitesCard).toHaveTextContent("9999");
    });

    it("formats decimal percentages to one decimal place", () => {
      render(
        <TestSummaryCards
          totalTests={3}
          passedTests={2}
          failedTests={1}
          skippedTests={0}
          totalSuites={3}
          passedSuites={2}
          failedSuites={1}
          skippedSuites={0}
        />
      );

      // 2/3 = 66.666...% should display as 66.7%
      const totalTestsCard = screen
        .getByText("Total Tests")
        .closest("div.bg-dark-800");
      expect(totalTestsCard).toHaveTextContent("66.7% pass rate");

      // 1/3 = 33.333...% should display as 33.3%
      const failedTestsCards = screen.getAllByText("Failed");
      const failedTestsCard = failedTestsCards[1].closest("div.bg-dark-800");
      expect(failedTestsCard).toHaveTextContent("33.3% need review");
    });
  });

  describe("Icon Rendering", () => {
    it("renders appropriate icons for each card type", () => {
      const { container } = render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // Check for lucide icons (they render as SVGs)
      const svgs = container.querySelectorAll("svg");
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe("Border Color Classes", () => {
    it("applies correct border color classes", () => {
      const { container } = render(
        <TestSummaryCards
          totalTests={100}
          passedTests={90}
          failedTests={5}
          skippedTests={5}
          totalSuites={20}
          passedSuites={18}
          failedSuites={1}
          skippedSuites={1}
        />
      );

      // Check that cards have border-l-4 class
      const cards = container.querySelectorAll(".border-l-4");
      expect(cards.length).toBeGreaterThan(0);

      // Check for specific border color classes
      expect(container.querySelector(".border-l-gray-500")).toBeInTheDocument();
      expect(
        container.querySelector(".border-l-green-500")
      ).toBeInTheDocument();
      expect(container.querySelector(".border-l-red-500")).toBeInTheDocument();
      expect(
        container.querySelector(".border-l-yellow-500")
      ).toBeInTheDocument();
    });
  });
});
