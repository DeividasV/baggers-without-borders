/**
 * CreateUserModal — minimal member creation.
 *
 * The modal was redesigned into a "minimal member creation" flow: the admin
 * supplies given name, family name, and email; the username is derived
 * automatically, and a password is generated server-side and shown once after
 * creation. The previous suite asserted a password input, a role select, and a
 * manually typed username, none of which exist any more.
 *
 * These tests cover the current contract.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CreateUserModal from "@/app/components/features/members/CreateUserModal";

function setup(overrides: Partial<{ isOpen: boolean }> = {}) {
  const onClose = jest.fn();
  const onSuccess = jest.fn();
  const utils = render(
    <CreateUserModal isOpen={overrides.isOpen ?? true} onClose={onClose} onSuccess={onSuccess} />
  );
  return { ...utils, onClose, onSuccess };
}

describe("CreateUserModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The modal probes availability endpoints whose responses are read as
    // { available: boolean }. Return an available result so username
    // generation resolves on the first attempt.
    (global.fetch as jest.Mock).mockImplementation(async (url: string) => ({
      ok: true,
      status: 200,
      statusText: "OK",
      json: async () => {
        const target = String(url);
        if (target.includes("check-username")) return { available: true };
        if (target.includes("check-email")) return { available: true };
        return {};
      },
      text: async () => "",
    }));
  });

  it("renders a dialog with the Create Member title when open", () => {
    setup();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Create Member" })).toBeInTheDocument();
  });

  it("renders nothing when closed", () => {
    setup({ isOpen: false });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows the given name, family name, and email fields", () => {
    setup();
    expect(screen.getByLabelText(/given name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/family name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it("does not offer a password input or role select (generated instead)", () => {
    setup();
    expect(screen.queryByLabelText(/^password/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^role/i)).not.toBeInTheDocument();
  });

  it("keeps submit disabled until the required fields are valid", () => {
    setup();
    expect(screen.getByRole("button", { name: /create member/i })).toBeDisabled();
  });

  it("derives a username from the given and family name", async () => {
    const user = userEvent.setup();
    setup();

    expect(screen.getByText(/will be generated from name/i)).toBeInTheDocument();

    await user.type(screen.getByLabelText(/given name/i), "Ada");
    await user.type(screen.getByLabelText(/family name/i), "Demo");

    await waitFor(
      () => {
        expect(screen.queryByText(/will be generated from name/i)).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it("calls onClose when Cancel is pressed", async () => {
    const user = userEvent.setup();
    const { onClose } = setup();

    await user.click(screen.getByRole("button", { name: /cancel/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it("exposes an accessible close control", () => {
    setup();
    expect(screen.getAllByRole("button", { name: /close dialog/i }).length).toBeGreaterThan(0);
  });
});
