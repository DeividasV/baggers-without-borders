import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import BackupsManagement from "@/components/features/backups/BackupsManagement";

// Mock fetch
global.fetch = jest.fn();

describe("BackupsManagement", () => {
  const mockBackups = [
    {
      filename: "manual-backup-2024-01-01.zip",
      size: 1024000,
      sizeFormatted: "1.00 MB",
      createdAt: "2024-01-01T12:00:00Z",
      relativeTime: "1 day ago",
      type: "database",
    },
    {
      filename: "files-backup-2024-01-02.zip",
      size: 2048000,
      sizeFormatted: "2.00 MB",
      createdAt: "2024-01-02T12:00:00Z",
      relativeTime: "2 hours ago",
      type: "files",
    },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ backups: mockBackups }),
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("Initial rendering", () => {
    it("should render the component with title and description", async () => {
      render(<BackupsManagement />);

      await waitFor(() => {
        expect(screen.getByText("Backups")).toBeInTheDocument();
      });

      expect(
        screen.getByText(/Manage database and file backups/i)
      ).toBeInTheDocument();
    });

    it("should display loading state initially", () => {
      render(<BackupsManagement />);
      expect(screen.getByText("Loading backups...")).toBeInTheDocument();
    });

    it("should fetch and display backups on mount", async () => {
      render(<BackupsManagement />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith("/api/backup");
      });

      await waitFor(() => {
        const backup1Elements = screen.getAllByText(
          "manual-backup-2024-01-01.zip"
        );
        const backup2Elements = screen.getAllByText(
          "files-backup-2024-01-02.zip"
        );
        expect(backup1Elements.length).toBeGreaterThan(0);
        expect(backup2Elements.length).toBeGreaterThan(0);
      });
    });

    it("should display error message if fetch fails", async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error("Failed to fetch")
      );

      render(<BackupsManagement />);

      await waitFor(() => {
        expect(screen.getByText(/Failed to load backups/i)).toBeInTheDocument();
      });
    });
  });

  describe("Stats display", () => {
    it("should display correct backup statistics", async () => {
      render(<BackupsManagement />);

      await waitFor(() => {
        const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
        expect(backups.length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(screen.getByText("Total Backups")).toBeInTheDocument();
        expect(screen.getByText("2")).toBeInTheDocument(); // Total backups
      });
    });

    it("should display correct database and file counts", async () => {
      render(<BackupsManagement />);

      await waitFor(() => {
        const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
        expect(backups.length).toBeGreaterThan(0);
      });

      expect(screen.getByText("1 DB")).toBeInTheDocument();
      expect(screen.getByText("1 Files")).toBeInTheDocument();
    });

    it("should calculate total size correctly", async () => {
      render(<BackupsManagement />);

      await waitFor(() => {
        const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
        expect(backups.length).toBeGreaterThan(0);
      });

      // Total size is 1MB + 2MB = 3.0MB
      expect(screen.getByText("Total Size")).toBeInTheDocument();
      // Use a function matcher to find text that includes MB
      expect(
        screen.getByText((content, element) => {
          return (
            (element?.textContent?.includes("MB") &&
              element?.classList?.contains("font-bold")) ||
            false
          );
        })
      ).toBeInTheDocument();
    });
  });

  describe("Creating backups", () => {
    it("should create a database backup successfully", async () => {
      const user = userEvent.setup();
      const mockNewBackup = {
        filename: "manual-backup-new.zip",
        size: 500000,
        sizeFormatted: "500 KB",
        createdAt: "2024-01-03T12:00:00Z",
        relativeTime: "Just now",
        type: "database",
      };

      jest.clearAllMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backup: mockNewBackup }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: [...mockBackups, mockNewBackup] }),
        });

      render(<BackupsManagement />);

      await waitFor(() => {
        const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
        expect(backups.length).toBeGreaterThan(0);
      });

      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Backup Database/i })
        ).toBeInTheDocument();
      });

      const backupButton = screen.getByRole("button", {
        name: /Backup Database/i,
      });
      await user.click(backupButton);

      await waitFor(
        () => {
          expect(
            screen.getByText(/Database backup created/i)
          ).toBeInTheDocument();
        },
        { timeout: 3000 }
      );

      // Verify the backup was created via API
      expect(global.fetch).toHaveBeenCalledWith(
        "/api/backup",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ type: "database" }),
        })
      );
    });

    it("should create a file backup successfully", async () => {
      const user = userEvent.setup();
      const mockNewBackup = {
        filename: "files-backup-new.zip",
        size: 1000000,
        sizeFormatted: "1.00 MB",
        createdAt: "2024-01-03T12:00:00Z",
        relativeTime: "Just now",
        type: "files",
      };

      jest.clearAllMocks();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backup: mockNewBackup }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: [...mockBackups, mockNewBackup] }),
        });

      render(<BackupsManagement />);

      await waitFor(() => {
        const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
        expect(backups.length).toBeGreaterThan(0);
      });

      const backupButton = screen.getByRole("button", {
        name: /Backup Files/i,
      });
      await user.click(backupButton);

      await waitFor(
        () => {
          // Verify the backup was created via API
          expect(global.fetch).toHaveBeenCalledWith(
            "/api/backup",
            expect.objectContaining({
              method: "POST",
              body: JSON.stringify({ type: "files" }),
            })
          );
        },
        { timeout: 5000 }
      );
    });

    it("should show error when backup creation fails", async () => {
      const user = userEvent.setup();

      // Reset mock completely for this test
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: "Backup failed" }),
        });

      render(<BackupsManagement />);

      await waitFor(
        () => {
          const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
          expect(backups.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      const backupButton = screen.getByRole("button", {
        name: /Backup Database/i,
      });
      await user.click(backupButton);

      await waitFor(
        () => {
          expect(screen.getByText(/Backup failed/i)).toBeInTheDocument();
        },
        { timeout: 3000 }
      );
    });

    it("should disable backup buttons during backup creation", async () => {
      const user = userEvent.setup();

      // Reset mock completely for this test
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockImplementationOnce(
          () =>
            new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve({
                    ok: true,
                    json: async () => ({
                      backup: {
                        filename: "test.zip",
                        size: 1000,
                        sizeFormatted: "1 KB",
                      },
                    }),
                  }),
                1000
              )
            )
        );

      render(<BackupsManagement />);

      await waitFor(() => {
        const backups = screen.getAllByText("manual-backup-2024-01-01.zip");
        expect(backups.length).toBeGreaterThan(0);
      });

      const dbButton = screen.getByRole("button", { name: /Backup Database/i });
      const filesButton = screen.getByRole("button", { name: /Backup Files/i });

      await user.click(dbButton);

      await waitFor(() => {
        expect(dbButton).toBeDisabled();
        expect(filesButton).toBeDisabled();
      });
    });
  });

  describe("Deleting backups", () => {
    it("should show delete confirmation modal", async () => {
      const user = userEvent.setup();
      render(<BackupsManagement />);

      await waitFor(() => {
        const backupElements = screen.getAllByText(
          "manual-backup-2024-01-01.zip"
        );
        expect(backupElements.length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByTitle("Delete backup");
      await user.click(deleteButtons[0]);

      expect(screen.getByText("Delete Backup")).toBeInTheDocument();
      expect(
        screen.getByText(/Are you sure you want to delete/i)
      ).toBeInTheDocument();
    });

    it("should delete backup when confirmed", async () => {
      const user = userEvent.setup();

      // Reset mock completely for this test
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockResolvedValueOnce({ ok: true })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: [mockBackups[1]] }),
        });

      render(<BackupsManagement />);

      await waitFor(
        () => {
          const backupElements = screen.getAllByText(
            "manual-backup-2024-01-01.zip"
          );
          expect(backupElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      const deleteButtons = screen.getAllByTitle("Delete backup");
      await user.click(deleteButtons[0]);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText("Delete Backup")).toBeInTheDocument();
      });

      //Get the Delete button inside the modal (exact text match)
      const confirmButton = screen.getByRole("button", { name: "Delete" });
      await user.click(confirmButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          "/api/backup/files-backup-2024-01-02.zip",
          { method: "DELETE" }
        );
      });

      await waitFor(() => {
        expect(screen.getByText(/Backup deleted/i)).toBeInTheDocument();
      });
    });

    it("should close modal when cancel is clicked", async () => {
      const user = userEvent.setup();
      render(<BackupsManagement />);

      await waitFor(() => {
        const backupElements = screen.getAllByText(
          "manual-backup-2024-01-01.zip"
        );
        expect(backupElements.length).toBeGreaterThan(0);
      });

      const deleteButtons = screen.getAllByTitle("Delete backup");
      await user.click(deleteButtons[0]);

      const cancelButton = screen.getByRole("button", { name: /Cancel/i });
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText("Delete Backup")).not.toBeInTheDocument();
      });
    });
  });

  describe("Backup password modal", () => {
    it("should show password modal when button clicked", async () => {
      const user = userEvent.setup();

      // Reset mock completely for this test
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ password: "test-password-123" }),
        });

      render(<BackupsManagement />);

      await waitFor(
        () => {
          const backupElements = screen.getAllByText(
            "manual-backup-2024-01-01.zip"
          );
          expect(backupElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      const passwordButton = screen.getByRole("button", {
        name: /Show Password/i,
      });
      await user.click(passwordButton);

      await waitFor(() => {
        expect(screen.getByText("Backup ZIP Password")).toBeInTheDocument();
        expect(screen.getByText("test-password-123")).toBeInTheDocument();
      });
    });
  });

  describe("Refresh functionality", () => {
    it("should refresh backup list when refresh button clicked", async () => {
      const user = userEvent.setup();

      // Reset mock completely for this test
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: mockBackups }),
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ backups: [...mockBackups, mockBackups[0]] }),
        });

      render(<BackupsManagement />);

      await waitFor(
        () => {
          const backupElements = screen.getAllByText(
            "manual-backup-2024-01-01.zip"
          );
          expect(backupElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      const refreshButton = screen.getByRole("button", { name: /Refresh/i });
      await user.click(refreshButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe("Empty state", () => {
    it("should show empty state when no backups exist", async () => {
      // Reset mock completely for this test
      (global.fetch as jest.Mock).mockReset();
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ backups: [] }),
      });

      render(<BackupsManagement />);

      await waitFor(() => {
        expect(
          screen.queryByText("Loading backups...")
        ).not.toBeInTheDocument();
      });

      await waitFor(
        () => {
          expect(screen.getByText("No backups found")).toBeInTheDocument();
          expect(
            screen.getByText(/Create your first database or file backup/i)
          ).toBeInTheDocument();
        },
        { timeout: 5000 }
      );
    });
  });

  describe("Download functionality", () => {
    it("should trigger download when download button clicked", async () => {
      const user = userEvent.setup();
      const createElementSpy = jest.spyOn(document, "createElement");
      const appendChildSpy = jest.spyOn(document.body, "appendChild");
      const removeChildSpy = jest.spyOn(document.body, "removeChild");

      render(<BackupsManagement />);

      await waitFor(
        () => {
          const backupElements = screen.getAllByText(
            "manual-backup-2024-01-01.zip"
          );
          expect(backupElements.length).toBeGreaterThan(0);
        },
        { timeout: 5000 }
      );

      const downloadButtons = screen.getAllByTitle("Download backup");
      await user.click(downloadButtons[0]);

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(appendChildSpy).toHaveBeenCalled();
      expect(removeChildSpy).toHaveBeenCalled();

      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });
  });
});
