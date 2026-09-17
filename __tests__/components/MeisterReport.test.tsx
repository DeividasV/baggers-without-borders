import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import MeisterReport from "@/app/components/features/hof-tables/MeisterReport";

describe("MeisterReport", () => {
  const mockConfig = {
    meisterReportContent: "# Test Report\n\nThis is a test report.",
    meisterReportImage: "/uploads/meister-reports/test.webp",
    meisterReportImageTitle: "Beautiful Mountain",
    meisterReportImageAttribution: "Photo by Test Photographer",
    hofmeister: {
      displayName: "John Doe",
      username: "johndoe",
    },
  };

  it("should not render when no content", () => {
    const { container } = render(
      <MeisterReport
        config={{ meisterReportContent: null }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it("should render report content with meister info", () => {
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    expect(screen.getByText("HoF Meister Report")).toBeInTheDocument();
    expect(screen.getByText("John Doe")).toBeInTheDocument();
    expect(screen.getByText(/for Test HOF 2026/)).toBeInTheDocument();
  });

  it("should render image with title and attribution", () => {
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    const img = screen.getByAltText("Beautiful Mountain");
    expect(img).toHaveAttribute("src", "/uploads/meister-reports/test.webp");
    expect(screen.getByText("Beautiful Mountain")).toBeInTheDocument();
    expect(screen.getByText("Photo by Test Photographer")).toBeInTheDocument();
  });

  it("should open image zoom modal on click", async () => {
    const user = userEvent.setup();
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    const imageButton = screen.getByLabelText(
      "Open image in fullscreen preview"
    );
    await user.click(imageButton);

    // Modal should be visible
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
    expect(screen.getByLabelText("Close image preview")).toBeInTheDocument();
  });

  it("should open image zoom modal with Enter key", async () => {
    const user = userEvent.setup();
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    const imageButton = screen.getByLabelText(
      "Open image in fullscreen preview"
    );
    imageButton.focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should open image zoom modal with Space key", async () => {
    const user = userEvent.setup();
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    const imageButton = screen.getByLabelText(
      "Open image in fullscreen preview"
    );
    imageButton.focus();
    await user.keyboard(" ");

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should close image zoom modal on Escape key", async () => {
    const user = userEvent.setup();
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    // Open modal
    const imageButton = screen.getByLabelText(
      "Open image in fullscreen preview"
    );
    await user.click(imageButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close with Escape
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should close image zoom modal on close button click", async () => {
    const user = userEvent.setup();
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    // Open modal
    const imageButton = screen.getByLabelText(
      "Open image in fullscreen preview"
    );
    await user.click(imageButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Close with button
    const closeButton = screen.getByLabelText("Close image preview");
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });

  it("should show Read More button for long content", () => {
    const longContent = "A".repeat(600);
    render(
      <MeisterReport
        config={{ ...mockConfig, meisterReportContent: longContent }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    expect(screen.getByText("Read More")).toBeInTheDocument();
  });

  it("should expand content when Read More is clicked", async () => {
    const user = userEvent.setup();
    const longContent = "A".repeat(600);
    render(
      <MeisterReport
        config={{ ...mockConfig, meisterReportContent: longContent }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    const readMoreButton = screen.getByText("Read More");
    await user.click(readMoreButton);

    await waitFor(() => {
      expect(screen.getByText("Show Less")).toBeInTheDocument();
    });
    expect(screen.queryByText("Read More")).not.toBeInTheDocument();
  });

  it("should collapse content when Show Less is clicked", async () => {
    const user = userEvent.setup();
    const longContent = "A".repeat(600);
    render(
      <MeisterReport
        config={{ ...mockConfig, meisterReportContent: longContent }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    // Expand
    await user.click(screen.getByText("Read More"));
    await waitFor(() => {
      expect(screen.getByText("Show Less")).toBeInTheDocument();
    });

    // Collapse
    await user.click(screen.getByText("Show Less"));
    await waitFor(() => {
      expect(screen.getByText("Read More")).toBeInTheDocument();
    });
    expect(screen.queryByText("Show Less")).not.toBeInTheDocument();
  });

  it("should not show Read More for short content", () => {
    const shortContent = "Short report.";
    render(
      <MeisterReport
        config={{ ...mockConfig, meisterReportContent: shortContent }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    expect(screen.queryByText("Read More")).not.toBeInTheDocument();
  });

  it("should use default alt text when no image title", () => {
    render(
      <MeisterReport
        config={{
          ...mockConfig,
          meisterReportImageTitle: null,
        }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    const img = screen.getByAltText("John Doe report image for Test HOF 2026");
    expect(img).toBeInTheDocument();
  });

  it("should render without image", () => {
    render(
      <MeisterReport
        config={{
          ...mockConfig,
          meisterReportImage: null,
        }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    expect(screen.getByText("HoF Meister Report")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("should render without hofmeister info", () => {
    render(
      <MeisterReport
        config={{
          ...mockConfig,
          hofmeister: null,
        }}
        hofLabel="Test HOF"
        yearLabel="2026"
      />
    );

    expect(screen.getByText("HoF Meister Report")).toBeInTheDocument();
    expect(screen.queryByText("Report by:")).not.toBeInTheDocument();
  });

  it("should close modal on background click", async () => {
    const user = userEvent.setup();
    render(
      <MeisterReport config={mockConfig} hofLabel="Test HOF" yearLabel="2026" />
    );

    // Open modal
    const imageButton = screen.getByLabelText(
      "Open image in fullscreen preview"
    );
    await user.click(imageButton);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    // Click on the background (dialog itself)
    const dialog = screen.getByRole("dialog");
    await user.click(dialog);

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  });
});
