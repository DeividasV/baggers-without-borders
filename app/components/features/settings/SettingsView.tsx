"use client";

import { useState, useEffect, useRef } from "react";
import { SITE_NAME } from "@/src/config/site";
import { Settings, Save, Loader2, Edit2, X, Check } from "lucide-react";

type AppSetting = {
  id: string;
  key: string;
  value: string | null;
  description: string | null;
  category: string;
  createdAt: string;
  updatedAt: string;
};

type Year = {
  id: string;
  code: string;
  title: string;
};

type HallOfFame = {
  id: string;
  code: string;
  title: string;
};

export default function SettingsView() {
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [years, setYears] = useState<Year[]>([]);
  const [hofs, setHofs] = useState<HallOfFame[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const [defaultYearId, setDefaultYearId] = useState<string>("");
  const [defaultHofId, setDefaultHofId] = useState<string>("");
  const [supportClerkEmail, setSupportClerkEmail] = useState<string>("");
  const [supportAdminEmail, setSupportAdminEmail] = useState<string>("");
  const [editingYearId, setEditingYearId] = useState(false);
  const [editingHofId, setEditingHofId] = useState(false);
  const [editingClerkEmail, setEditingClerkEmail] = useState(false);
  const [editingAdminEmail, setEditingAdminEmail] = useState(false);

  // Funding settings
  const [fundingTotalSpent, setFundingTotalSpent] = useState<string>("");
  const [fundingTotalCollected, setFundingTotalCollected] = useState<string>("");
  const [fundingMonthlyEst, setFundingMonthlyEst] = useState<string>("");
  const [editingTotalSpent, setEditingTotalSpent] = useState(false);
  const [editingTotalCollected, setEditingTotalCollected] = useState(false);
  const [editingMonthlyEst, setEditingMonthlyEst] = useState(false);
  const [savingFunding, setSavingFunding] = useState(false);

  const hasInitialized = useRef(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Only fetch once
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    try {
      setLoading(true);
      const [settingsRes, yearsRes, hofsRes] = await Promise.all([
        fetch("/api/app-settings"),
        fetch("/api/years"),
        fetch("/api/hofs"),
      ]);

      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        setSettings(settingsData);

        // Extract current values
        const yearSetting = settingsData.find((s: AppSetting) => s.key === "default_year_id");
        const hofSetting = settingsData.find((s: AppSetting) => s.key === "default_hof_id");
        const clerkEmailSetting = settingsData.find(
          (s: AppSetting) => s.key === "support_clerk_email"
        );
        const adminEmailSetting = settingsData.find(
          (s: AppSetting) => s.key === "support_admin_email"
        );

        setDefaultYearId(yearSetting?.value || "");
        setDefaultHofId(hofSetting?.value || "");
        setSupportClerkEmail(clerkEmailSetting?.value || "");
        setSupportAdminEmail(adminEmailSetting?.value || "");

        const spentSetting = settingsData.find((s: AppSetting) => s.key === "funding_total_spent");
        const collectedSetting = settingsData.find(
          (s: AppSetting) => s.key === "funding_total_collected"
        );
        const monthlyEstSetting = settingsData.find(
          (s: AppSetting) => s.key === "funding_monthly_est"
        );
        setFundingTotalSpent(spentSetting?.value || "630.36");
        setFundingTotalCollected(collectedSetting?.value || "559.08");
        setFundingMonthlyEst(monthlyEstSetting?.value || "40");
      }

      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        setYears(yearsData);
      }

      if (hofsRes.ok) {
        const hofsData = await hofsRes.json();
        setHofs(hofsData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setMessage({ type: "error", text: "Failed to load settings" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setMessage(null);

      // Save default year setting
      const yearResponse = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "default_year_id",
          value: defaultYearId,
          description:
            "Default year to display when users first visit the Hall of Fame tables page. Set to the current or most recent year for the most relevant statistics.",
          category: "hof",
        }),
      });

      // Save default HOF setting
      const hofResponse = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "default_hof_id",
          value: defaultHofId,
          description:
            "Default Hall of Fame to display when users first visit the Hall of Fame tables page. Provides a consistent starting point for viewing HOF statistics.",
          category: "hof",
        }),
      });

      // Save support clerk email
      const clerkEmailResponse = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "support_clerk_email",
          value: supportClerkEmail,
          description: `Email address for the HoF Clerk to receive general support requests about the ${SITE_NAME} community and events.`,
          category: "support",
        }),
      });

      // Save support admin email
      const adminEmailResponse = await fetch("/api/app-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "support_admin_email",
          value: supportAdminEmail,
          description:
            "Email address for HoF IT to receive technical support requests about website issues and bugs.",
          category: "support",
        }),
      });

      if (yearResponse.ok && hofResponse.ok && clerkEmailResponse.ok && adminEmailResponse.ok) {
        setMessage({
          type: "success",
          text: "Settings saved successfully!",
        });
        setEditingYearId(false);
        setEditingHofId(false);
        setEditingClerkEmail(false);
        setEditingAdminEmail(false);
        await fetchData(); // Refresh to show updated values
      } else {
        setMessage({ type: "error", text: "Failed to save some settings" });
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage({ type: "error", text: "Failed to save settings" });
    } finally {
      setSaving(false);
    }
  };

  const handleFundingSave = async () => {
    try {
      setSavingFunding(true);
      setMessage(null);

      const rows = [
        {
          key: "funding_total_spent",
          value: fundingTotalSpent,
          description:
            "Total platform costs incurred to date (EUR). Update whenever new invoices are paid.",
        },
        {
          key: "funding_total_collected",
          value: fundingTotalCollected,
          description: "Total contributions received from members to date (EUR).",
        },
        {
          key: "funding_monthly_est",
          value: fundingMonthlyEst,
          description: "Estimated ongoing monthly running cost (EUR) going forward.",
        },
      ];

      const responses = await Promise.all(
        rows.map((row) =>
          fetch("/api/app-settings", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...row, category: "funding" }),
          })
        )
      );

      if (responses.every((r) => r.ok)) {
        setMessage({ type: "success", text: "Funding settings saved!" });
        setEditingTotalSpent(false);
        setEditingTotalCollected(false);
        setEditingMonthlyEst(false);
        hasInitialized.current = false;
        await fetchData();
      } else {
        setMessage({ type: "error", text: "Failed to save funding settings" });
      }
    } catch (error) {
      console.error("Error saving funding settings:", error);
      setMessage({ type: "error", text: "Failed to save funding settings" });
    } finally {
      setSavingFunding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-primary-400">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary-400 flex items-center gap-2">
          <Settings className="h-8 w-8" />
          Application Settings
        </h1>
        <p className="text-gray-400 mt-1">Configure system-wide defaults and preferences</p>
      </div>

      {/* Messages */}
      {message && (
        <div
          className={`card ${
            message.type === "success"
              ? "bg-green-900/20 border-green-600/50"
              : "bg-red-900/20 border-red-600/50"
          }`}
        >
          <p className={message.type === "success" ? "text-green-400" : "text-red-400"}>
            {message.text}
          </p>
        </div>
      )}

      {/* Hall of Fame Table Defaults */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Hall of Fame & Support Settings</h2>
        <p className="text-gray-400 text-sm mb-6">
          Configure default Hall of Fame display settings and support contact email addresses.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Setting</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">
                  Current Value
                </th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">
                  Description
                </th>
                <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Default Year Setting */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">Default Year</span>
                </td>
                <td className="py-3 px-4">
                  {editingYearId ? (
                    <select
                      value={defaultYearId}
                      onChange={(e) => setDefaultYearId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    >
                      <option value="">-- Not Set --</option>
                      {years.map((year) => (
                        <option key={year.id} value={year.id}>
                          {year.code} - {year.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-300">
                      {defaultYearId
                        ? years.find((s) => s.id === defaultYearId)?.code || "Unknown"
                        : "Not set"}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    The year shown by default on HOF tables page
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingYearId ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingYearId(false);
                          fetchData(); // Reset to original value
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingYearId(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>

              {/* Default Hall of Fame Setting */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">Default Hall of Fame</span>
                </td>
                <td className="py-3 px-4">
                  {editingHofId ? (
                    <select
                      value={defaultHofId}
                      onChange={(e) => setDefaultHofId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    >
                      <option value="">-- Not Set --</option>
                      {hofs.map((hof) => (
                        <option key={hof.id} value={hof.id}>
                          {hof.code} - {hof.title}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <span className="text-gray-300">
                      {defaultHofId
                        ? hofs.find((h) => h.id === defaultHofId)?.code || "Unknown"
                        : "Not set"}
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    The Hall of Fame shown by default on HOF tables page
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingHofId ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingHofId(false);
                          fetchData(); // Reset to original value
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingHofId(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>

              {/* Support Clerk Email Setting */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">HoF Clerk Email</span>
                </td>
                <td className="py-3 px-4">
                  {editingClerkEmail ? (
                    <input
                      type="email"
                      value={supportClerkEmail}
                      onChange={(e) => setSupportClerkEmail(e.target.value)}
                      placeholder="clerk@example.com"
                      className="w-full px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    />
                  ) : (
                    <span className="text-gray-300">{supportClerkEmail || "Not set"}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    Email for general support requests ({SITE_NAME} community, events)
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingClerkEmail ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingClerkEmail(false);
                          fetchData();
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingClerkEmail(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>

              {/* Support Admin Email Setting */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">HoF IT Email</span>
                </td>
                <td className="py-3 px-4">
                  {editingAdminEmail ? (
                    <input
                      type="email"
                      value={supportAdminEmail}
                      onChange={(e) => setSupportAdminEmail(e.target.value)}
                      placeholder="admin@example.com"
                      className="w-full px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    />
                  ) : (
                    <span className="text-gray-300">{supportAdminEmail || "Not set"}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    Email for technical support requests (bugs, login issues)
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingAdminEmail ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingAdminEmail(false);
                          fetchData();
                        }}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingAdminEmail(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Funding Settings */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">Funding & Running Costs</h2>
        <p className="text-gray-400 text-sm mb-6">
          These numbers appear in the top bar and donation page. Update them whenever costs or
          contributions change — no code deployment needed.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Setting</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Value (€)</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">
                  Description
                </th>
                <th className="py-3 px-4 text-center text-sm font-medium text-gray-400 w-24">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Total Spent */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">Total costs to date</span>
                </td>
                <td className="py-3 px-4">
                  {editingTotalSpent ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="funding-total-spent"
                      value={fundingTotalSpent}
                      onChange={(e) => setFundingTotalSpent(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    />
                  ) : (
                    <span className="text-gray-300">€{fundingTotalSpent}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    All platform costs incurred since Sep 2025
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingTotalSpent ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleFundingSave}
                        disabled={savingFunding}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingTotalSpent(false)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingTotalSpent(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>

              {/* Total Collected */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">Total contributed</span>
                </td>
                <td className="py-3 px-4">
                  {editingTotalCollected ? (
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      id="funding-total-collected"
                      value={fundingTotalCollected}
                      onChange={(e) => setFundingTotalCollected(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    />
                  ) : (
                    <span className="text-gray-300">€{fundingTotalCollected}</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    Total received from member contributions
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingTotalCollected ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleFundingSave}
                        disabled={savingFunding}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingTotalCollected(false)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingTotalCollected(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>

              {/* Monthly Est */}
              <tr className="border-b border-dark-600 hover:bg-dark-700/50">
                <td className="py-3 px-4">
                  <span className="text-white font-medium">Est. monthly cost</span>
                </td>
                <td className="py-3 px-4">
                  {editingMonthlyEst ? (
                    <input
                      type="number"
                      step="1"
                      min="0"
                      id="funding-monthly-est"
                      value={fundingMonthlyEst}
                      onChange={(e) => setFundingMonthlyEst(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-dark-700 border border-dark-600 rounded text-white text-sm focus:outline-none focus:border-primary-600"
                    />
                  ) : (
                    <span className="text-gray-300">€{fundingMonthlyEst}/month</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="text-gray-400 text-sm">
                    Estimated ongoing running cost going forward
                  </span>
                </td>
                <td className="py-3 px-4 text-center">
                  {editingMonthlyEst ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={handleFundingSave}
                        disabled={savingFunding}
                        className="p-1.5 text-green-400 hover:text-green-300 hover:bg-green-900/20 rounded transition-colors"
                        title="Save"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => setEditingMonthlyEst(false)}
                        className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingMonthlyEst(true)}
                      className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-900/20 rounded transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* All Settings (Debug View) */}
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-4">All Settings (Debug)</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-dark-600">
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Key</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Value</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">Category</th>
                <th className="py-3 px-4 text-left text-sm font-medium text-gray-400">
                  Description
                </th>
              </tr>
            </thead>
            <tbody>
              {settings.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500">
                    No settings configured yet
                  </td>
                </tr>
              ) : (
                settings.map((setting) => (
                  <tr key={setting.id} className="border-b border-dark-600 hover:bg-dark-700/50">
                    <td className="py-3 px-4 text-white font-mono text-sm">{setting.key}</td>
                    <td className="py-3 px-4 text-gray-300 font-mono text-sm">
                      {setting.value || <span className="text-gray-600">null</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-sm">{setting.category}</td>
                    <td className="py-3 px-4 text-gray-400 text-sm">
                      {setting.description || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
