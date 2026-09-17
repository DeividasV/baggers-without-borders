/**
 * Site identity and external links.
 *
 * This release is a template. It ships with a generic name, no operator and no
 * external links, because the project it came from no longer runs and its names
 * belong to the Baggers Without Borders organisation rather than to this
 * software. An operator sets their own values through the `NEXT_PUBLIC_*`
 * variables documented in `.env.example` and `SETUP.md`.
 *
 * Only `NEXT_PUBLIC_*` variables may be referenced here: this module is imported
 * by server components (layouts, pages, email templates) and its values are
 * inlined into client bundles at build time.
 */

/** Shown in page titles, the app manifest, email headers and the footer. */
export const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || "Peak-bagging Community";

/** Shown beside the copyright notice when set. Empty means "do not render". */
export const OPERATOR_NAME = process.env.NEXT_PUBLIC_OPERATOR_NAME?.trim() || "";

/**
 * The Corresponding Source for this deployment, which AGPL-3.0 section 13
 * requires a network service to offer to its users. `NEXT_PUBLIC_SOURCE_URL` is
 * used when set; `NEXT_PUBLIC_GITHUB_REPO` ("owner/name") is still accepted as a
 * convenience. Empty means "do not render the link".
 */
export const SOURCE_URL =
  process.env.NEXT_PUBLIC_SOURCE_URL?.trim() ||
  (process.env.NEXT_PUBLIC_GITHUB_REPO?.trim()
    ? `https://github.com/${process.env.NEXT_PUBLIC_GITHUB_REPO.trim()}`
    : "");

/**
 * The software's own copyright notice. It must be preserved: AGPL-3.0 section
 * 7(b) requires the attribution notices in `NOTICE` to be kept, and a modified
 * version has to offer its own source (section 13).
 */
export const SOFTWARE_COPYRIGHT =
  "Software © 2025–2026 Deividas Valaitis, licensed under AGPL-3.0-only";

/**
 * Links to the community's own site and pages. Every value is empty by default
 * and a link is rendered only when its value is set, so a deployment never sends
 * visitors to somebody else's site. `terms` and `privacy` point at the
 * operator's own terms and privacy statement; `SETUP.md` explains the templates
 * in `data/legal/`.
 */
export const EXTERNAL_LINKS = {
  /** The community's home page, if it has one. */
  home: "",
  /** News or newsboard. */
  news: "",
  /** Hall of Fame / Polybaggers' Register page. */
  hallOfFame: "",
  /** The community manual or rulebook. */
  manual: "",
  /** An archived journal. */
  journalArchive: "",
  /** General resources. */
  resources: "",
  /** Social media, forum or mailing-list landing page. */
  socialMedia: "",
  /** Talks and online meetings. */
  eTalks: "",
  /** A members' survey. */
  membersSurvey: "",
  /** An "about us" page. */
  about: "",
  /** A contact page. */
  contact: "",
  /** Terms of service. */
  terms: "",
  /** Privacy statement. */
  privacy: "",
};
