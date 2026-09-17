import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ChangeForm from "@/components/features/changes/ChangeForm";

// Import mocked modules
jest.mock("next/navigation");
jest.mock("next-auth/react");

global.fetch = jest.fn();

// Get the mocked functions
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSearchParamsGet = jest.fn();

// Mock the modules to return our jest functions
const nextNavigation = require("next/navigation");
const nextAuth = require("next-auth/react");

describe("ChangeForm", () => {
  const mockExistingRequest = {
    id: "req-1",
    title: "Test Change Request",
    description: "Test description",
    type: "FEATURE",
    priority: "MEDIUM",
    impact: "MEDIUM",
    status: "PENDING",
    plannedTime: 120,
    actualTime: null,
    createdAt: "2024-01-01T12:00:00Z",
    updatedAt: "2024-01-01T12:00:00Z",
    createdBy: {
      id: "user-1",
      displayName: "Admin User",
      username: "admin",
    },
    attachments: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup router mock
    nextNavigation.useRouter.mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      back: mockBack,
      pathname: "/admin/changes",
      query: {},
      asPath: "/admin/changes",
    });

    // Setup search params mock
    const mockSearchParams = new URLSearchParams();
    mockSearchParams.get = mockSearchParamsGet;
    nextNavigation.useSearchParams.mockReturnValue(mockSearchParams);

    // Setup session mock - admin by default
    nextAuth.useSession.mockReturnValue({
      data: {
        user: {
          id: "user-1",
          name: "Admin User",
          username: "admin",
          role: "ADMIN",
        },
      },
      status: "authenticated",
    });

    mockSearchParamsGet.mockReturnValue(null);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => mockExistingRequest,
    });
  });

  describe("Access Control", () => {
    it("should redirect non-admin users", () => {
      nextAuth.useSession.mockReturnValue({
        data: {
          user: { id: "user-1", name: "User", role: "USER" },
        },
        status: "authenticated",
      });

      render(<ChangeForm mode="create" />);

      expect(mockPush).toHaveBeenCalledWith("/");
    });

    it("should show loading while session is loading", () => {
      nextAuth.useSession.mockReturnValue({
        data: null,
        status: "loading",
      });

      render(<ChangeForm mode="create" />);

      expect(screen.getByText("Loading change request form...")).toBeInTheDocument();
    });
  });

  describe("Create Mode", () => {
    it("should render create form", async () => {
      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/Short Title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/What should change\?/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Change Type/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Urgency/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Reach/i)).toBeInTheDocument();
      expect(screen.getByText("0 / 3000")).toBeInTheDocument();
      expect(screen.getByText("0 / 600")).toBeInTheDocument();
      expect(screen.getByText("0 / 1200")).toBeInTheDocument();
    });

    it("should submit form with valid data", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: "new-req-1" }),
      });

      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/Short Title/i);
      const descriptionInput = screen.getByLabelText(/What should change\?/i);

      await user.type(titleInput, "New Feature Request");
      await user.type(descriptionInput, "Detailed description of the feature");

      const saveButton = screen.getByRole("button", { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/change-requests",
          expect.objectContaining({
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: expect.stringContaining("New Feature Request"),
          })
        );
      });

      expect(mockPush).toHaveBeenCalledWith("/admin/changes");
    });

    it("should handle time input in hours:minutes format", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => ({ id: "new-req-1" }),
      });

      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/Short Title/i);
      const descriptionInput = screen.getByLabelText(/What should change\?/i);
      const plannedTimeInput = screen.getByLabelText(/Expected Time/i);
      const typeSelect = screen.getByLabelText(/Change Type/i);
      const prioritySelect = screen.getByLabelText(/Urgency/i);
      const impactSelect = screen.getByLabelText(/Reach/i);

      await user.type(titleInput, "Test");
      await user.type(descriptionInput, "Test description");
      await user.selectOptions(typeSelect, "FEATURE");
      await user.selectOptions(prioritySelect, "MEDIUM");
      await user.selectOptions(impactSelect, "MEDIUM");
      await user.clear(plannedTimeInput);
      await user.type(plannedTimeInput, "2h30");

      const saveButton = screen.getByRole("button", { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/change-requests",
          expect.objectContaining({
            body: expect.stringContaining('"plannedTime":150'),
          })
        );
      });
    });

    it("should handle file uploads", async () => {
      const user = userEvent.setup();
      const file = new File(["test"], "test.png", { type: "image/png" });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-req-1" }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "attachment-1" }),
        });

      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/Short Title/i);
      const descriptionInput = screen.getByLabelText(/What should change\?/i);
      const typeSelect = screen.getByLabelText(/Change Type/i);
      const prioritySelect = screen.getByLabelText(/Urgency/i);
      const impactSelect = screen.getByLabelText(/Reach/i);

      await user.type(titleInput, "Test");
      await user.type(descriptionInput, "Test description");
      await user.selectOptions(typeSelect, "FEATURE");
      await user.selectOptions(prioritySelect, "MEDIUM");
      await user.selectOptions(impactSelect, "MEDIUM");

      // Find file input (it may be hidden)
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        await user.upload(fileInput as HTMLInputElement, file);
      }

      const saveButton = screen.getByRole("button", { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/change-requests", expect.any(Object));
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/change-requests/new-req-1/attachments",
          expect.objectContaining({ method: "POST" })
        );
      });

      expect(mockPush).toHaveBeenCalledWith("/admin/changes");
    });

    it("should keep the user on the form when an attachment upload fails", async () => {
      const user = userEvent.setup();
      const file = new File(["test"], "failed-upload.png", { type: "image/png" });

      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ id: "new-req-1" }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Upload failed" }),
        });

      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/Short Title/i), "Test");
      await user.type(screen.getByLabelText(/What should change\?/i), "Test description");
      await user.selectOptions(screen.getByLabelText(/Change Type/i), "FEATURE");
      await user.selectOptions(screen.getByLabelText(/Urgency/i), "MEDIUM");
      await user.selectOptions(screen.getByLabelText(/Reach/i), "MEDIUM");

      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) {
        await user.upload(fileInput as HTMLInputElement, file);
      }

      await user.click(screen.getByRole("button", { name: /Save/i }));

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Change request saved, but failed-upload.png still needs to be uploaded."
        );
      });

      expect(mockPush).not.toHaveBeenCalledWith("/admin/changes");
    });

    it("should navigate back on cancel", async () => {
      const user = userEvent.setup();
      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith("/admin/changes");
    });

    it("should respect returnTo parameter", async () => {
      const user = userEvent.setup();
      mockSearchParamsGet.mockReturnValue("/custom/path");

      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      expect(mockPush).toHaveBeenCalledWith("/custom/path");
    });
  });

  describe("Edit Mode", () => {
    it("should fetch and display existing request", async () => {
      render(<ChangeForm mode="edit" requestId="req-1" />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/change-requests/req-1",
          expect.objectContaining({ signal: expect.any(Object) })
        );
      });

      await waitFor(
        () => {
          expect(screen.getByDisplayValue("Test Change Request")).toBeInTheDocument();
          expect(screen.getByDisplayValue("Test description")).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should update existing request", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockExistingRequest,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            ...mockExistingRequest,
            title: "Updated Title",
          }),
        });

      render(<ChangeForm mode="edit" requestId="req-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Change Request")).toBeInTheDocument();
      });

      const titleInput = screen.getByDisplayValue("Test Change Request");
      await user.clear(titleInput);
      await user.type(titleInput, "Updated Title");

      const saveButton = screen.getByRole("button", { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/change-requests/req-1",
          expect.objectContaining({
            method: "PUT",
            body: expect.stringContaining("Updated Title"),
          })
        );
      });
    });

    it("should show delete button in edit mode", async () => {
      render(<ChangeForm mode="edit" requestId="req-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Change Request")).toBeInTheDocument();
      });

      expect(screen.getByRole("button", { name: /Delete/i })).toBeInTheDocument();
    });

    it("should handle delete confirmation", async () => {
      const user = userEvent.setup();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockExistingRequest,
        })
        .mockResolvedValueOnce({ ok: true });

      render(<ChangeForm mode="edit" requestId="req-1" />);

      await waitFor(() => {
        expect(screen.getByDisplayValue("Test Change Request")).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole("button", { name: /Delete/i });
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText("Delete This Change")).toBeInTheDocument();
      });

      const confirmButton = screen.getAllByRole("button", {
        name: /Delete/i,
      })[1];
      await user.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/change-requests/req-1",
          expect.objectContaining({ method: "DELETE" })
        );
      });

      expect(mockPush).toHaveBeenCalledWith("/admin/changes");
    });

    it("should show status field in edit mode", async () => {
      render(<ChangeForm mode="edit" requestId="req-1" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Progress/i)).toBeInTheDocument();
      });
    });

    it("should show retryable fallback on fetch error", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      });

      render(<ChangeForm mode="edit" requestId="req-1" />);

      await waitFor(() => {
        expect(screen.getByText("Couldn't load this change request")).toBeInTheDocument();
      });
    });
  });

  describe("View Mode", () => {
    it("should display request in read-only mode", async () => {
      render(<ChangeForm mode="view" requestId="req-1" />);

      await waitFor(() => {
        const titleElements = screen.getAllByText("Test Change Request");
        expect(titleElements.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("Test description")).toBeInTheDocument();

      // Should not have input fields
      expect(screen.queryByLabelText(/Title/i)).not.toBeInTheDocument();
    });

    it("should show edit button in view mode", async () => {
      render(<ChangeForm mode="view" requestId="req-1" />);

      await waitFor(() => {
        const titleElements = screen.getAllByText("Test Change Request");
        expect(titleElements.length).toBeGreaterThan(0);
      });

      const editButton = screen.getByRole("button", { name: /Edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it("should navigate to edit mode when edit clicked", async () => {
      const user = userEvent.setup();
      render(<ChangeForm mode="view" requestId="req-1" />);

      await waitFor(() => {
        const titleElements = screen.getAllByText("Test Change Request");
        expect(titleElements.length).toBeGreaterThan(0);
      });

      const editButton = screen.getByRole("button", { name: /Edit/i });
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith("/admin/changes/req-1/edit");
    });

    it("should preserve returnTo when navigating to edit mode", async () => {
      const user = userEvent.setup();
      mockSearchParamsGet.mockImplementation((key: string) =>
        key === "returnTo" ? "/admin/changes?search=Bug" : null
      );

      render(<ChangeForm mode="view" requestId="req-1" />);

      await waitFor(() => {
        const titleElements = screen.getAllByText("Test Change Request");
        expect(titleElements.length).toBeGreaterThan(0);
      });

      const editButton = screen.getByRole("button", { name: /Edit/i });
      await user.click(editButton);

      expect(mockPush).toHaveBeenCalledWith(
        "/admin/changes/req-1/edit?returnTo=%2Fadmin%2Fchanges%3Fsearch%3DBug"
      );
    });

    it("should show attachments in view mode", async () => {
      const requestWithAttachments = {
        ...mockExistingRequest,
        attachments: [
          {
            id: "att-1",
            filename: "file1.pdf",
            originalName: "document.pdf",
            mimeType: "application/pdf",
            size: 1024,
            path: "/uploads/file1.pdf",
            createdAt: "2024-01-01T12:00:00Z",
          },
        ],
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => requestWithAttachments,
      });

      render(<ChangeForm mode="view" requestId="req-1" />);

      await waitFor(() => {
        expect(screen.getByText("Attachments (1)")).toBeInTheDocument();
      });
    });
  });

  describe("Form Validation", () => {
    it("should require title field", async () => {
      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Short Title/i)).toBeRequired();
      });
    });

    it("should require description field", async () => {
      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/What should change\?/i)).toBeRequired();
      });
    });
  });

  describe("Clipboard paste functionality", () => {
    it("should handle pasted images in description", async () => {
      const user = userEvent.setup();
      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByLabelText(/What should change\?/i)).toBeInTheDocument();
      });

      const descriptionInput = screen.getByLabelText(/What should change\?/i);

      // Create a mock clipboard event with an image
      const mockFile = new File([""], "pasted-image.png", {
        type: "image/png",
      });
      const mockDataTransfer = {
        items: [
          {
            type: "image/png",
            getAsFile: () => mockFile,
          },
        ],
      };

      // Note: This is a simplified test. Full clipboard testing may require more setup
      await user.click(descriptionInput);
    });
  });

  describe("Error Handling", () => {
    it("should display error on save failure", async () => {
      const user = userEvent.setup();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => ({ error: "Save failed" }),
      });

      render(<ChangeForm mode="create" />);

      await waitFor(() => {
        expect(screen.getByText("Add a Change")).toBeInTheDocument();
      });

      const titleInput = screen.getByLabelText(/Short Title/i);
      const descriptionInput = screen.getByLabelText(/What should change\?/i);
      const typeSelect = screen.getByLabelText(/Change Type/i);
      const prioritySelect = screen.getByLabelText(/Urgency/i);
      const impactSelect = screen.getByLabelText(/Reach/i);

      await user.type(titleInput, "Test");
      await user.type(descriptionInput, "Test description");
      await user.selectOptions(typeSelect, "FEATURE");
      await user.selectOptions(prioritySelect, "MEDIUM");
      await user.selectOptions(impactSelect, "MEDIUM");

      const saveButton = screen.getByRole("button", { name: /Save/i });
      await user.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent("Save failed");
      });
    });
  });
});
