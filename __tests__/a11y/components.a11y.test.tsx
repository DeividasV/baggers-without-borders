/**
 * Accessibility tests for UI components
 * Tests components for WCAG violations using jest-axe
 */

import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import Button from "@/app/components/ui/Button";
import Input from "@/app/components/ui/Input";
import Card from "@/app/components/ui/Card";
import Modal from "@/app/components/ui/Modal";
import Logo from "@/app/components/ui/Logo";

describe("UI Components Accessibility", () => {
  describe("Button", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Button>Click me</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle disabled state accessibly", async () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle loading state accessibly", async () => {
      const { container } = render(<Button loading>Loading</Button>);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle icon-only button with label", async () => {
      const { container } = render(
        <Button aria-label="Delete item" icon={<span>×</span>} />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Input", () => {
    it("should not have accessibility violations with label", async () => {
      const { container } = render(
        <Input label="Username" placeholder="Enter username" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle error state accessibly", async () => {
      const { container } = render(
        <Input label="Email" error="Invalid email address" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle required fields accessibly", async () => {
      const { container } = render(
        <Input label="Password" required type="password" />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle helper text accessibly", async () => {
      const { container } = render(
        <Input
          label="Phone"
          helperText="Format: (123) 456-7890"
          placeholder="(123) 456-7890"
        />
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Card", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(
        <Card>
          <h3>Card Title</h3>
          <p>Card content goes here</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle clickable card accessibly", async () => {
      const handleClick = jest.fn();
      const { container } = render(
        <Card onClick={handleClick}>
          <h3>Clickable Card</h3>
          <p>Click me!</p>
        </Card>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Modal", () => {
    it("should not have accessibility violations when open", async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle modal with form accessibly", async () => {
      const { container } = render(
        <Modal isOpen={true} onClose={() => {}} title="Form Modal">
          <form>
            <Input label="Name" required />
            <Button type="submit">Submit</Button>
          </form>
        </Modal>
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe("Logo", () => {
    it("should not have accessibility violations", async () => {
      const { container } = render(<Logo />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it("should handle logo without text accessibly", async () => {
      const { container } = render(<Logo showText={false} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
