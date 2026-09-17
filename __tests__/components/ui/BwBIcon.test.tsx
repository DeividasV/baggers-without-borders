import { render } from "@/__tests__/utils/test-utils";
import BwBIcon from "@/app/components/ui/BwBIcon";

describe("BwBIcon Component", () => {
  describe("Rendering", () => {
    it("should render the BwB icon SVG", () => {
      const { container } = render(<BwBIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("should have correct viewBox", () => {
      const { container } = render(<BwBIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("viewBox", "0 0 512 512");
    });

    it("should accept custom className", () => {
      const { container } = render(<BwBIcon className="custom-class" />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveClass("custom-class");
    });

    it("should render mountain paths", () => {
      const { container } = render(<BwBIcon />);
      const paths = container.querySelectorAll("path");
      expect(paths).toHaveLength(2);
    });

    it("should render dot indicator circles", () => {
      const { container } = render(<BwBIcon />);
      const circles = container.querySelectorAll("circle");
      expect(circles).toHaveLength(1); // Minimalistic single circle
    });
  });

  describe("Styling", () => {
    it("should use currentColor for fill", () => {
      const { container } = render(<BwBIcon />);
      const paths = container.querySelectorAll("path");
      paths.forEach((path) => {
        expect(path).toHaveAttribute("fill", "currentColor");
      });
    });

    it("should use currentColor for stroke on main mountain", () => {
      const { container } = render(<BwBIcon />);
      const mainPath = container.querySelector("path");
      expect(mainPath).toHaveAttribute("stroke", "currentColor");
    });

    it("should have proper stroke width", () => {
      const { container } = render(<BwBIcon />);
      const mainPath = container.querySelector("path");
      expect(mainPath).toHaveAttribute("stroke-width", "6");
    });
  });

  describe("Accessibility", () => {
    it("should have proper SVG attributes", () => {
      const { container } = render(<BwBIcon />);
      const svg = container.querySelector("svg");
      expect(svg).toHaveAttribute("fill", "none");
      expect(svg).toHaveAttribute("xmlns", "http://www.w3.org/2000/svg");
    });
  });
});
