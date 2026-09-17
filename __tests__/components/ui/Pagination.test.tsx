import { render, screen, fireEvent } from "@/__tests__/utils/test-utils";
import { Pagination } from "@/app/components/ui/Pagination";

describe("Pagination Component", () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 10,
    totalCount: 100,
    pageSize: 10,
    onPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    it("should render pagination info", () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText(/Showing 1-10 of 100/)).toBeInTheDocument();
    });

    it("should not render when single page and no page size change", () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should render when single page but has page size change", () => {
      render(
        <Pagination
          {...defaultProps}
          totalPages={1}
          onPageSizeChange={jest.fn()}
        />
      );
      expect(screen.getByText(/Showing 1-10 of 100/)).toBeInTheDocument();
    });
  });

  describe("Page Info Display", () => {
    it("should show correct range for first page", () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      expect(screen.getByText(/Showing 1-10 of 100/)).toBeInTheDocument();
    });

    it("should show correct range for middle page", () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      expect(screen.getByText(/Showing 41-50 of 100/)).toBeInTheDocument();
    });

    it("should show correct range for last page", () => {
      render(<Pagination {...defaultProps} currentPage={10} />);
      expect(screen.getByText(/Showing 91-100 of 100/)).toBeInTheDocument();
    });

    it("should handle incomplete last page", () => {
      render(
        <Pagination
          {...defaultProps}
          currentPage={11}
          totalPages={11}
          totalCount={105}
        />
      );
      expect(screen.getByText(/Showing 101-105 of 105/)).toBeInTheDocument();
    });
  });

  describe("Navigation Buttons", () => {
    it("should render navigation buttons", () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText("Previous")).toBeInTheDocument();
      expect(screen.getByText("Next")).toBeInTheDocument();
      expect(screen.getByText("First")).toBeInTheDocument();
      expect(screen.getByText("Last")).toBeInTheDocument();
    });

    it("should have disabled state on first page", () => {
      render(<Pagination {...defaultProps} currentPage={1} />);
      const prevButton = screen.getByText("Previous").closest("button");
      expect(prevButton).toBeDisabled();
    });

    it("should have disabled state on last page", () => {
      render(<Pagination {...defaultProps} currentPage={10} />);
      const nextButton = screen.getByText("Next").closest("button");
      expect(nextButton).toBeDisabled();
    });
  });

  describe("Page Navigation", () => {
    it("should handle Previous button click", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );
      fireEvent.click(screen.getByText("Previous"));
      expect(onPageChange).toHaveBeenCalledWith(4);
    });

    it("should handle Next button click", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );
      fireEvent.click(screen.getByText("Next"));
      expect(onPageChange).toHaveBeenCalledWith(6);
    });

    it("should handle First button click", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );
      fireEvent.click(screen.getByText("First"));
      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("should handle Last button click", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );
      fireEvent.click(screen.getByText("Last"));
      expect(onPageChange).toHaveBeenCalledWith(10);
    });
  });

  describe("Page Number Buttons", () => {
    it("should render all page numbers when 10 or fewer pages", () => {
      render(<Pagination {...defaultProps} totalPages={10} />);
      for (let i = 1; i <= 10; i++) {
        expect(screen.getByText(i.toString())).toBeInTheDocument();
      }
    });

    it("should highlight current page", () => {
      render(<Pagination {...defaultProps} currentPage={5} />);
      const currentButton = screen.getByText("5");
      expect(currentButton.closest("button")).toHaveClass("bg-primary-600");
    });

    it("should handle page number click", () => {
      const onPageChange = jest.fn();
      render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
      fireEvent.click(screen.getByText("3"));
      expect(onPageChange).toHaveBeenCalledWith(3);
    });
  });

  describe("Page Input", () => {
    it("should render page input for many pages", () => {
      render(<Pagination {...defaultProps} totalPages={50} />);
      const inputs = screen.getAllByPlaceholderText("1");
      expect(inputs.length).toBeGreaterThan(0);
    });

    it("should handle Enter key in page input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const input = screen.getAllByPlaceholderText("1")[0];
      fireEvent.change(input, { target: { value: "25" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onPageChange).toHaveBeenCalledWith(25);
    });

    it("should not navigate on invalid page number", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const input = screen.getAllByPlaceholderText("1")[0];
      fireEvent.change(input, { target: { value: "999" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should not navigate on non-numeric input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const input = screen.getAllByPlaceholderText("1")[0];
      fireEvent.change(input, { target: { value: "abc" } });
      fireEvent.keyDown(input, { key: "Enter" });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should handle blur event in page input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const input = screen.getAllByPlaceholderText("1")[0];
      fireEvent.change(input, { target: { value: "30" } });
      fireEvent.blur(input);
      expect(onPageChange).toHaveBeenCalledWith(30);
    });
  });

  describe("Custom Item Name", () => {
    it("should display pagination info", () => {
      render(<Pagination {...defaultProps} />);
      expect(screen.getByText(/Showing 1-10 of 100/)).toBeInTheDocument();
    });

    it("should display page size in info", () => {
      render(<Pagination {...defaultProps} itemName="users" />);
      expect(screen.getByText(/10 per page/)).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle totalPages of 1", () => {
      const { container } = render(
        <Pagination {...defaultProps} totalPages={1} />
      );
      expect(container.firstChild).toBeNull();
    });

    it("should handle large page numbers", () => {
      render(
        <Pagination
          {...defaultProps}
          totalPages={1000}
          currentPage={500}
          totalCount={5000}
        />
      );
      expect(screen.getByText("500")).toBeInTheDocument();
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it("should not render when only one page", () => {
      const { container } = render(
        <Pagination
          {...defaultProps}
          pageSize={100}
          totalPages={1}
          totalCount={100}
        />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe("Ellipsis Display", () => {
    it("should show ellipsis for many pages", () => {
      render(<Pagination {...defaultProps} totalPages={50} currentPage={25} />);
      const ellipsis = screen.getAllByText("...");
      expect(ellipsis.length).toBeGreaterThan(0);
    });

    it("should not show ellipsis when near start", () => {
      render(<Pagination {...defaultProps} totalPages={50} currentPage={2} />);
      const ellipsis = screen.queryAllByText("...");
      expect(ellipsis.length).toBeLessThan(2);
    });

    it("should not show ellipsis when near end", () => {
      render(<Pagination {...defaultProps} totalPages={50} currentPage={49} />);
      const ellipsis = screen.queryAllByText("...");
      expect(ellipsis.length).toBeLessThan(2);
    });
  });

  describe("Mobile Page Input", () => {
    it("should handle Enter key in mobile page input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const mobileInput = inputs[inputs.length - 1]; // Last input is mobile
      fireEvent.change(mobileInput, { target: { value: "20" } });
      fireEvent.keyDown(mobileInput, { key: "Enter" });
      expect(onPageChange).toHaveBeenCalledWith(20);
    });

    it("should handle blur in mobile page input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          currentPage={5}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("5");
      const mobileInput = inputs[inputs.length - 1];
      fireEvent.change(mobileInput, { target: { value: "15" } });
      fireEvent.blur(mobileInput);
      expect(onPageChange).toHaveBeenCalledWith(15);
    });

    it("should not navigate on invalid page in mobile input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const mobileInput = inputs[inputs.length - 1];
      fireEvent.change(mobileInput, { target: { value: "0" } });
      fireEvent.keyDown(mobileInput, { key: "Enter" });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should not navigate on page out of range in mobile input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const mobileInput = inputs[inputs.length - 1];
      fireEvent.change(mobileInput, { target: { value: "51" } });
      fireEvent.keyDown(mobileInput, { key: "Enter" });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should not navigate to same page on blur in mobile input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={10}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("10");
      const mobileInput = inputs[inputs.length - 1];
      fireEvent.change(mobileInput, { target: { value: "10" } });
      fireEvent.blur(mobileInput);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should clear mobile input after successful navigation", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const mobileInput = inputs[inputs.length - 1] as HTMLInputElement;
      fireEvent.change(mobileInput, { target: { value: "25" } });
      fireEvent.keyDown(mobileInput, { key: "Enter" });
      expect(mobileInput.value).toBe("");
    });

    it("should clear mobile input on blur after navigation", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={5}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("5");
      const mobileInput = inputs[inputs.length - 1] as HTMLInputElement;
      fireEvent.change(mobileInput, { target: { value: "20" } });
      fireEvent.blur(mobileInput);
      expect(mobileInput.value).toBe("");
    });
  });

  describe("Desktop Page Input Edge Cases", () => {
    it("should not navigate to same page on blur in desktop input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          currentPage={15}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("15");
      const desktopInput = inputs[0];
      fireEvent.change(desktopInput, { target: { value: "15" } });
      fireEvent.blur(desktopInput);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should handle zero in desktop input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const desktopInput = inputs[0];
      fireEvent.change(desktopInput, { target: { value: "0" } });
      fireEvent.blur(desktopInput);
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should handle negative number in desktop input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const desktopInput = inputs[0];
      fireEvent.change(desktopInput, { target: { value: "-5" } });
      fireEvent.keyDown(desktopInput, { key: "Enter" });
      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should clear desktop input after successful navigation", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const desktopInput = inputs[0] as HTMLInputElement;
      fireEvent.change(desktopInput, { target: { value: "35" } });
      fireEvent.blur(desktopInput);
      expect(desktopInput.value).toBe("");
    });

    it("should handle decimal input", () => {
      const onPageChange = jest.fn();
      render(
        <Pagination
          {...defaultProps}
          totalPages={50}
          onPageChange={onPageChange}
        />
      );
      const inputs = screen.getAllByPlaceholderText("1");
      const desktopInput = inputs[0];
      fireEvent.change(desktopInput, { target: { value: "15.5" } });
      fireEvent.keyDown(desktopInput, { key: "Enter" });
      // parseInt will convert 15.5 to 15, which is an integer, so it will navigate
      expect(onPageChange).toHaveBeenCalledWith(15);
    });
  });
});
