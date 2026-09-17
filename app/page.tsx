import Link from "next/link";
import { Logo, Button, Card } from "./components/ui";
import { Metadata } from "next";
import { prisma } from "@/src/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/src/lib/auth";
import {
  EXTERNAL_LINKS,
  OPERATOR_NAME,
  SITE_NAME,
  SOFTWARE_COPYRIGHT,
  SOURCE_URL,
} from "@/src/config/site";

export const metadata: Metadata = {
  // No `title` here: the root layout's template supplies the site name, and setting
  // it in both places renders the name twice and makes React warn that the
  // <title> element's children are an array.
  description:
    "An online community of international peak-baggers and mountain experts. Track your climbing journey, qualify for Hall of Fame recognition, and connect with climbers worldwide.",
  keywords:
    "peak bagging, climbing, hiking, mountains, topographic prominence, peak-baggers, mountaineering",
};

export default async function LandingPage() {
  // Check if user is authenticated
  const session = await getServerSession(authOptions);

  // Fetch active HoFs for footer
  const activeHofs = await prisma.hallOfFame.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    select: { id: true, code: true, title: true },
  });

  return (
    <main className="min-h-screen bg-linear-to-b from-dark-900 via-dark-950 to-dark-900 text-gray-100">
      {/* Hero Section */}
      <section
        className="relative min-h-[60vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center justify-center bg-cover bg-center bg-fixed"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0, 0, 0, 0.3), rgba(0, 0, 0, 0.4)), url("/images/hero-mountain.jpg")',
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center opacity-0 animate-fade-in">
          <div className="mb-8 flex justify-center" style={{ animationDelay: "100ms" }}>
            <div className="p-4 bg-dark-900/40 backdrop-blur-sm rounded-2xl shadow-2xl border border-primary-500/20">
              <Logo size="xxl" className="opacity-0 animate-fade-in drop-shadow-2xl" />
            </div>
          </div>

          <h1
            className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-8 opacity-0 animate-fade-in"
            style={{ animationDelay: "200ms" }}
          >
            {SITE_NAME}
          </h1>

          <p
            className="text-lg sm:text-xl lg:text-2xl font-light mb-12 max-w-3xl mx-auto opacity-0 animate-fade-in"
            style={{ animationDelay: "500ms" }}
          >
            An online community
            <br />
            of international peak-baggers
            <br />
            and mountain experts
          </p>

          <div
            className="flex flex-col sm:flex-row gap-4 justify-center items-center opacity-0 animate-fade-in"
            style={{ animationDelay: "600ms" }}
          >
            {session ? (
              <Link href="/home">
                <Button variant="primary" className="min-h-11 min-w-40">
                  Go to Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="primary" className="min-h-11 min-w-40">
                    Sign In
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="secondary" className="min-h-11 min-w-40">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>
          <div className="mt-6 opacity-0 animate-fade-in" style={{ animationDelay: "700ms" }}>
            <Link
              href="/contact"
              className="text-sm text-gray-300 hover:text-primary-400 transition-colors underline"
            >
              Need help? Contact us
            </Link>
          </div>
        </div>
      </section>

      {/* News Headlines Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-24">
        <h2 className="text-3xl sm:text-4xl font-bold mb-8 text-center">
          News headlines
          {EXTERNAL_LINKS.news && (
            <>
              {" - for the story, see "}
              <a
                href={EXTERNAL_LINKS.news}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors underline"
              >
                here
              </a>
            </>
          )}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {newsHeadlines
            .filter((item) => item.link)
            .map((item, index) => (
              <Card
                key={index}
                className="p-6 hover:scale-[1.01] transition-transform duration-200 opacity-0 animate-fade-in"
                style={{ animationDelay: `${700 + index * 50}ms` }}
              >
                <h3 className="text-lg font-semibold mb-3 text-gray-100">{item.title}</h3>
                {item.isExternal ? (
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 transition-colors text-sm inline-flex items-center gap-1"
                  >
                    Read more →
                  </a>
                ) : (
                  <Link
                    href={item.link}
                    className="text-primary-400 hover:text-primary-300 transition-colors text-sm inline-flex items-center gap-1"
                  >
                    Read more →
                  </Link>
                )}
              </Card>
            ))}
        </div>
      </section>

      {/* Welcome Section */}
      <section className="bg-linear-to-br from-dark-800/80 via-dark-900/90 to-dark-950 py-12 sm:py-16 lg:py-24 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="prose prose-invert max-w-none">
            <h2 className="text-3xl sm:text-4xl font-bold mb-8">Welcome to {SITE_NAME}</h2>

            <div className="text-base sm:text-lg leading-relaxed space-y-4">
              <img
                src="/images/welcome-climbing.jpg"
                alt="Mountain climbing scene"
                className="float-none md:float-right md:ml-6 mb-4 w-full md:w-96 rounded-lg shadow-lg transition-opacity duration-300 hover:opacity-90"
              />

              <p>
                This is the website of a growing online community mostly of{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Peak_bagging"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors underline"
                >
                  peak-baggers
                </a>
                , whose pastime is to hike and climb to the summits of hills and mountains across
                the world. As the name of our community implies, we are not always constrained by
                the borders of our home countries. We also have a focus on peak-bagging mainly by{" "}
                <a
                  href="https://en.wikipedia.org/wiki/Topographic_prominence"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 transition-colors underline"
                >
                  topographic prominence
                </a>
                .
              </p>

              <p>
                We also welcome those who rarely, or never, venture beyond the uplands of their own
                country, but enjoy sharing their love and knowledge of their home peaks with others
                across the world.
              </p>

              <p>
                Our members across the continents include skilled mountaineers, those who just hike
                hills and mountains on a regular or occasional basis, and people who devote their
                time mainly to research, peak-listing and writing about the uplands of this planet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer className="bg-linear-to-t from-dark-950 via-dark-900 to-dark-900/50 border-t border-dark-700/50 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Shown only when the operator configures a second site of their own. */}
          {EXTERNAL_LINKS.home && (
            <div className="mb-10 p-4 bg-primary-500/10 border border-primary-500/30 rounded-lg text-center">
              <p className="text-sm text-primary-300">
                <strong>Note:</strong> the community also publishes some content on its{" "}
                <a
                  href={EXTERNAL_LINKS.home}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 underline font-semibold"
                >
                  other site
                </a>
                .
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-400">
                Tables & Annual Reports
              </h3>
              <div className="text-sm grid grid-cols-3 gap-x-4 gap-y-2">
                {activeHofs.map((hof) => (
                  <Link
                    key={hof.code}
                    href={`/hof-tables?hof=${hof.id}`}
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    {hof.title.replace(" Table", "").replace(" League", "")}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-400">Resources</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/p-index"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    P-Index League
                  </Link>
                </li>
                <ExternalLink href={EXTERNAL_LINKS.hallOfFame} label="Polybaggers' Register" />
                <ExternalLink href={EXTERNAL_LINKS.manual} label="Manual" />
                <ExternalLink href={EXTERNAL_LINKS.news} label="News" />
                <li>
                  <Link
                    href="/journal"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    Journal (new)
                  </Link>
                </li>
                <ExternalLink href={EXTERNAL_LINKS.journalArchive} label="Journal (archive)" />
                <ExternalLink href={EXTERNAL_LINKS.resources} label="Peak-bagging resources" />
                <ExternalLink href={EXTERNAL_LINKS.socialMedia} label="Social media & forum" />
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-primary-400">Community</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/login"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    Member Login
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    Join {SITE_NAME}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/awards"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    Annual Awards
                  </Link>
                </li>
                <li>
                  <Link
                    href="/donate?returnTo=/"
                    className="text-gray-300 hover:text-primary-400 transition-colors"
                  >
                    Donate {SITE_NAME}
                  </Link>
                </li>
                <ExternalLink href={EXTERNAL_LINKS.eTalks} label="e-Talks & e-Meets" />
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-dark-700 text-center text-sm text-gray-400">
            <p>{SOFTWARE_COPYRIGHT}</p>
            {OPERATOR_NAME && <p className="mt-2">Operated by {OPERATOR_NAME}</p>}
            <p className="mt-2">
              An independent, unofficial project for the Baggers Without Borders community. Not
              affiliated with, authorised by, or endorsed by the organisation; its names and visual
              identity belong to it.
            </p>
            {(EXTERNAL_LINKS.terms || EXTERNAL_LINKS.privacy || SOURCE_URL) && (
              <p className="mt-2 space-x-4">
                {EXTERNAL_LINKS.terms && (
                  <a
                    href={EXTERNAL_LINKS.terms}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Terms of service
                  </a>
                )}
                {EXTERNAL_LINKS.privacy && (
                  <a
                    href={EXTERNAL_LINKS.privacy}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Privacy
                  </a>
                )}
                {SOURCE_URL && (
                  <a
                    href={SOURCE_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-400 hover:text-primary-300 underline"
                  >
                    Source code
                  </a>
                )}
              </p>
            )}
            <p className="mt-4">
              Hero photo: Mount Everest North Face - Luca Galuzzi
              <br />
              <span className="text-xs">
                (CC BY-SA 2.5 via{" "}
                <a
                  href="https://commons.wikimedia.org/wiki/File:Everest_North_Face_toward_Base_Camp_Tibet_Luca_Galuzzi_2006.jpg"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-400 hover:text-primary-300 underline"
                >
                  Wikimedia Commons
                </a>
                )
              </span>
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}

/**
 * External link in the footer navigation. Renders nothing when the URL is empty,
 * so a deployment that has not configured a link never points at someone else's
 * site.
 */
function ExternalLink({ href, label }: { href: string; label: string }) {
  if (!href) return null;
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-300 hover:text-primary-400 transition-colors"
      >
        {label}
      </a>
    </li>
  );
}

const newsHeadlines = [
  {
    title: "Hall of Fame Tables",
    link: "/hof-tables",
    isExternal: false,
  },
  {
    title: "Annual Awards",
    link: "/awards",
    isExternal: false,
  },
  {
    title: `${SITE_NAME} journal`,
    link: "/journal",
    isExternal: false,
  },
  {
    title: "P-Index League Rankings",
    link: "/p-index",
    isExternal: false,
  },
  {
    title: "Members' survey 2025",
    link: EXTERNAL_LINKS.membersSurvey,
    isExternal: true,
  },
  {
    title: "Annual Reports & Achievements",
    link: "/awards",
    isExternal: false,
  },
];
