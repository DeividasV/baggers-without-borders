import { render, screen } from "@/__tests__/utils/test-utils";
import FormSection from "@/app/components/ui/FormSection";

describe("FormSection Component", () => {
  describe("Rendering", () => {
    it("should render with title", () => {
      render(
        <FormSection title="Personal Information">
          <div>Form content</div>
        </FormSection>,
      );
      expect(screen.getByText("Personal Information")).toBeInTheDocument();
    });

    it("should render children", () => {
      render(
        <FormSection title="Section">
          <div>Form fields go here</div>
        </FormSection>,
      );
      expect(screen.getByText("Form fields go here")).toBeInTheDocument();
    });

    it("should render with description", () => {
      render(
        <FormSection
          title="Contact Info"
          description="Enter your contact details below"
        >
          <div>Content</div>
        </FormSection>,
      );
      expect(
        screen.getByText("Enter your contact details below"),
      ).toBeInTheDocument();
    });

    it("should render without description", () => {
      render(
        <FormSection title="Section">
          <div>Content</div>
        </FormSection>,
      );
      expect(screen.queryByRole("paragraph")).not.toBeInTheDocument();
    });
  });

  describe("Styling", () => {
    it("should have card class", () => {
      const { container } = render(
        <FormSection title="Section">
          <div>Content</div>
        </FormSection>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("card");
    });

    it("should accept custom className", () => {
      const { container } = render(
        <FormSection title="Section" className="custom-class">
          <div>Content</div>
        </FormSection>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("card");
      expect(wrapper).toHaveClass("custom-class");
    });

    it("should style title appropriately", () => {
      render(
        <FormSection title="Section Title">
          <div>Content</div>
        </FormSection>,
      );
      const title = screen.getByText("Section Title");
      expect(title).toHaveClass("text-lg");
      expect(title).toHaveClass("font-medium");
      expect(title).toHaveClass("text-white");
    });

    it("should style description appropriately", () => {
      render(
        <FormSection title="Section" description="Description text">
          <div>Content</div>
        </FormSection>,
      );
      const description = screen.getByText("Description text");
      expect(description).toHaveClass("text-sm");
      expect(description).toHaveClass("text-gray-400");
    });
  });

  describe("Children Rendering", () => {
    it("should render single child element", () => {
      render(
        <FormSection title="Section">
          <input type="text" placeholder="Name" />
        </FormSection>,
      );
      expect(screen.getByPlaceholderText("Name")).toBeInTheDocument();
    });

    it("should render multiple children", () => {
      render(
        <FormSection title="Section">
          <input type="text" placeholder="Given Name" />
          <input type="text" placeholder="Family Name" />
          <button>Submit</button>
        </FormSection>,
      );
      expect(screen.getByPlaceholderText("Given Name")).toBeInTheDocument();
      expect(screen.getByPlaceholderText("Family Name")).toBeInTheDocument();
      expect(screen.getByText("Submit")).toBeInTheDocument();
    });

    it("should render nested components", () => {
      render(
        <FormSection title="Section">
          <div>
            <label>Email</label>
            <input type="email" placeholder="email@example.com" />
          </div>
        </FormSection>,
      );
      expect(screen.getByText("Email")).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText("email@example.com"),
      ).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty title", () => {
      render(
        <FormSection title="">
          <div>Content</div>
        </FormSection>,
      );
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe("");
    });

    it("should handle long title", () => {
      const longTitle =
        "This is a very long form section title that might wrap to multiple lines";
      render(
        <FormSection title={longTitle}>
          <div>Content</div>
        </FormSection>,
      );
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it("should handle long description", () => {
      const longDesc =
        "This is a very long description that provides detailed instructions about what to do in this section";
      render(
        <FormSection title="Section" description={longDesc}>
          <div>Content</div>
        </FormSection>,
      );
      expect(screen.getByText(longDesc)).toBeInTheDocument();
    });

    it("should handle multiple className values", () => {
      const { container } = render(
        <FormSection title="Section" className="class1 class2 class3">
          <div>Content</div>
        </FormSection>,
      );
      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper.className).toContain("class1");
      expect(wrapper.className).toContain("class2");
      expect(wrapper.className).toContain("class3");
    });

    it("should render with all props", () => {
      render(
        <FormSection
          title="Complete Section"
          description="This section has all props"
          className="my-custom-class"
        >
          <div>Form content here</div>
        </FormSection>,
      );
      expect(screen.getByText("Complete Section")).toBeInTheDocument();
      expect(
        screen.getByText("This section has all props"),
      ).toBeInTheDocument();
      expect(screen.getByText("Form content here")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("should have heading for title", () => {
      render(
        <FormSection title="Accessible Section">
          <div>Content</div>
        </FormSection>,
      );
      const heading = screen.getByRole("heading", { level: 3 });
      expect(heading).toHaveTextContent("Accessible Section");
    });

    it("should maintain semantic structure", () => {
      const { container } = render(
        <FormSection title="Section" description="Description">
          <label htmlFor="input1">Label</label>
          <input id="input1" type="text" />
        </FormSection>,
      );
      const label = screen.getByText("Label");
      const input = screen.getByRole("textbox");
      expect(label).toBeInTheDocument();
      expect(input).toBeInTheDocument();
    });
  });
});
