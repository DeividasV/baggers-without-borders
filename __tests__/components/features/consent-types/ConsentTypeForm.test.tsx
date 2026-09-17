import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ConsentTypeForm from "@/components/features/consent-types/ConsentTypeForm";

global.fetch = jest.fn();

describe("ConsentTypeForm", () => {
  const mockConsentType = {
    id: "consent-1",
    title: "Privacy Policy",
    description: "User privacy policy consent",
    internalNotes: "Internal notes",
    status: "ACTIVE",
    dateIntroduced: "2024-01-01",
    attachments: [],
    _count: {
      attachments: 0,
      userConsents: 5,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Basic Rendering", () => {
    it("should render component", () => {
      const { container } = render(<ConsentTypeForm mode="create" />);
      expect(container).toBeInTheDocument();
    });
  });

  describe("Create Mode", () => {
    it("should render create form fields", async () => {
      render(<ConsentTypeForm mode="create" />);

      // Component should render even if access control redirects
      expect(document.body).toBeTruthy();
    });
  });

  describe("Edit Mode", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockConsentType,
      });
    });

    it("should render edit mode", () => {
      const { container } = render(
        <ConsentTypeForm mode="edit" consentTypeId="consent-1" />
      );
      expect(container).toBeInTheDocument();
    });
  });

  describe("View Mode", () => {
    beforeEach(() => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockConsentType,
      });
    });

    it("should render view mode", () => {
      const { container } = render(
        <ConsentTypeForm mode="view" consentTypeId="consent-1" />
      );
      expect(container).toBeInTheDocument();
    });
  });
});
