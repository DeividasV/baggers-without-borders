# Handover statement

**Date:** 17 September 2026
**Author:** Deividas Valaitis
**Status:** Historical record. This statement describes the project as it was on the date above and will not be updated. For current instructions, see the [Taking this on](README.md#taking-this-on) section of `README.md`, and [`SETUP.md`](SETUP.md). If they differ from this statement, they take precedence.

---

I'm handing over the climbing and hill-bagging platform I built for the Baggers Without Borders community. I'm releasing the whole project as open source, so that anyone can pick it up and continue it.

This statement explains why I chose open source, what the release includes, what still needs work, and what to do next.

## Why open source

Open source means the project's code is publicly available, and anyone may use it, study it, change it and share it.

As I see it, this is the only way the project can go forward. It no longer depends on any one person: anyone willing to carry it on can pick it up.

It is extremely important to me that the project stays open source in the future. That is why I chose a licence that requires it. Anyone who shares a version of the project, or runs a changed version as a website or online service, must make their source code available under the same licence. This way, improvements that are shared or put online stay open to the whole community and to everyone who comes after. The licence section below explains this in more detail.

## What's included

The whole project, ready for someone to set up and continue:

- The full source code of the platform
- The database structure, and the files that create and update it
- Reference data and test account data
- Written guides covering setup, how the platform is built, and everything it does
- Configuration for putting it online, plus automated tests and code checks
- The licence and its additional terms, which set out how the project may be used

## What's not included

This release contains the project's code and guides only. It does not include:

- Any original website, domain name, hosting or accounts
- Any member data
- Any right to use the Baggers Without Borders name, which belongs to the Baggers Without Borders organisation

The project is not being handed to any particular person or group. It is open to everyone, on the same terms.

## Private and sensitive information: removed

Protecting people's privacy was a top priority in preparing this release. Before making the project public, I removed all private and sensitive information from it. The published project contains none of the following:

- Real member data, such as names, email addresses, climbing records, consent documents or any other personal details
- Passwords or login secrets
- Access keys for outside services, such as donation payments, email or spam protection
- Details of the servers or hosting accounts the platform ran on

The only accounts in the project are made-up test accounts. None of them belong to real people.

All passwords and access keys used by the original platform have also been cancelled, so they no longer work. As a result, the project gives no access to any of the original accounts, services or member information. Anyone who continues the project starts fresh, with their own accounts and keys. [`SETUP.md`](SETUP.md) explains step by step how to create and add them.

If you ever come across anything in the project that looks like real personal information, or a working password or key, please don't use or share it. Report it privately using the "Report a vulnerability" button on the repository's Security tab, and never in a public issue or post. See [`SECURITY.md`](SECURITY.md).

## Checked before release

Before the release, I took a fresh copy of the published code and set it up from scratch by following [`SETUP.md`](SETUP.md). The platform installed, built and ran successfully.

This confirmed that the release was complete: apart from your own keys and accounts, everything needed to get the platform running is included and documented.

This check does not mean the platform is ready for real users. The remaining work is described under [What still needs work](#what-still-needs-work) below. The project is provided without any warranty.

## The guides

If you're not technical, start with the opening sections of [`README.md`](README.md). They explain what the project does, and the peak-bagging terms it uses, in plain language. Then read [`FEATURES.md`](FEATURES.md) for an overview of everything the platform can do. You may enjoy seeing just how much it covers. The other guides are quite technical and are mainly for whoever does the technical work.

To get the platform running, follow [`SETUP.md`](SETUP.md) step by step. It covers installation, adding your own keys and settings, putting the site online, and fixing common problems.

Suggested reading order:

1. [`README.md`](README.md): start here. An overview of the project, what it does and how it is built. Its "Taking this on" section summarises everything someone continuing the project needs to know.
2. [`SETUP.md`](SETUP.md): the complete guide to getting the platform running. Read this next if you're doing the technical work.
3. [`FEATURES.md`](FEATURES.md): everything the platform does. It covers every screen and function, grouped by who uses them.
4. [`IMPLEMENTATION.md`](IMPLEMENTATION.md): how the platform is built, and its known issues. Section 16 lists the remaining known defects.
5. [`CONTRIBUTING.md`](CONTRIBUTING.md): how to work on the code, and the current state of the automated tests.
6. [`SECURITY.md`](SECURITY.md): known security defects, and a checklist to work through before putting the site online.
7. [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md): the behaviour expected from everyone taking part in the project.
8. [`LICENSE`](LICENSE) and [`NOTICE`](NOTICE): the licence, its additional terms, and credits for third-party software and media.

## Who can continue it

Anyone with sufficient technical skills can get the project running again and continue developing it. So can anyone with the budget for a capable AI coding agent, and the time to work through the guides with it. The agent can be powered by Claude, OpenAI's GPT or Codex models, Gemini, DeepSeek, Kimi, Qwen, Grok, Mistral or Codestral, or another large language model (LLM). You don't need to be a professional developer. The guides cover the project from start to finish, so whoever picks it up has a clear starting point.

To continue the project, make your own copy of it. On GitHub, this is called a "fork". I'm not reviewing or accepting changes to this repository. If several people want to continue the project, I'd encourage you to get in touch with each other and work together.

## Running your own version

Anyone who sets up the platform runs it independently. Your version is not connected to me or endorsed by me, and I'm not responsible for it. You are responsible for your own site, its data and content, and any terms you show your users.

The software itself is an independent, unofficial project. It is not affiliated with, authorised by or endorsed by the Baggers Without Borders organisation.

The names "Baggers Without Borders" and "BWB", and the associated logos and visual identity, belong to the Baggers Without Borders organisation, not to me. Releasing the software does not give anyone the right to use them. To use them for your version, you need the organisation's permission. Without that permission, please give your version its own name, and make clear to your users that you run it independently.

## The licence: please read

The software is released under the GNU Affero General Public License, version 3 only (AGPL-3.0-only). This is an open-source licence designed to keep the project open source. I keep the copyright in the software, and the licence gives everyone the rights described below. The [`NOTICE`](NOTICE) file adds a small number of additional terms that the licence allows. In plain terms:

- Anyone may use, copy, change and build on the software.
- If you share it with others, or run a changed version as a website or online service that other people use, you must make the source code available to those people under the same licence.
- You must keep the `LICENSE` file, the `NOTICE` file and all copyright and attribution notices, including the credit to Deividas Valaitis as the original author of the software.
- If you change the software, you must clearly mark it as changed, give the date of the changes, and state that it is released under the same licence.
- You must not present your version as the original, or suggest that the original author endorses it.
- The licence gives no right to use the names "Baggers Without Borders" or "BWB", or the associated logos and visual identity. Without the organisation's permission, you may mention them only to describe where your version came from.
- If the website shows a copyright and licence notice, any changed version must show one too.
- One photograph in the project is under a different licence (CC BY-SA 2.5). Its terms and credit are set out in `NOTICE`.

This is only a summary. The `LICENSE` and `NOTICE` files are the legal texts and take precedence. As the licence states, the software is provided "as is", without any warranty.

## What still needs work

At the time of this release, the platform runs, but it is not yet ready for real users. The main points are:

- **Security:** [`SECURITY.md`](SECURITY.md) lists known security defects, including gaps in who is allowed to see and change what. These must be fixed before any real users sign up.
- **Known defects and gaps:** section 16 of [`IMPLEMENTATION.md`](IMPLEMENTATION.md) and section 9 of [`FEATURES.md`](FEATURES.md) list the parts that still need improvement.
- **Automated tests:** at the time of this release, the project included 4,312 automated tests, which check that the code behaves as expected. 74 of them failed. My review found that these failures come from tests that were not updated after design changes, not from faults in the platform itself. Section 7 of [`CONTRIBUTING.md`](CONTRIBUTING.md) explains them and suggests where to start.

## Next steps

If you're doing the technical work:

1. Make your own copy (fork) of this repository.
2. Follow [`SETUP.md`](SETUP.md) to get it running on your own computer.
3. Read [`FEATURES.md`](FEATURES.md), then section 16 of [`IMPLEMENTATION.md`](IMPLEMENTATION.md), to see what the platform does and what still needs work.
4. Fix the known security defects described in [`SECURITY.md`](SECURITY.md), and work through its hardening checklist and the pre-deployment checklist in section 6.1 of [`SETUP.md`](SETUP.md).
5. Choose a name for your version, unless the Baggers Without Borders organisation has given you permission to use its name. `SETUP.md` lists every place where the name, operator details and contact details need to be changed.
6. Put the site online by following `SETUP.md`.

If you're not technical, read `README.md` and `FEATURES.md` to see what the platform does. If you know someone who might want to take the project on, please point them to this repository.

## My involvement from now on

I would really like to see someone pick this project up and carry it forward. However, from now on I can give it only very limited time, and I can't promise to be available. Please plan on working from the guides, which are written so that you can continue without my help.

## Thank you to everyone who contributed

This project was never the work of one person, and I want to thank everyone who helped make it happen.

To the donors and sponsors: thank you for believing in the project and supporting it financially. I know the platform isn't currently running, and I understand that this is disappointing. I truly regret that it has turned out this way. Your support helped build everything that is now being released. Making the whole project open source is the best way I can see to make sure that support isn't lost, and that anyone willing can bring the platform back.

To everyone who gave their knowledge and time: thank you. That includes the Hall of Fame Meisters and table maintainers, who compiled, checked and explained the results season after season. It includes the testers, translators, list-writers and researchers, who improved the data and the documentation. And it includes every member who recorded their climbing history, answered questions and helped correct the records. You shaped what the platform does and how it works, and much of what is in this release exists because of you.

A great deal of hard work has also gone into building the platform and preparing this release, so that someone new can get it running and carry it forward.

## Looking ahead

This project started as an idea for recognising the climbing achievements of the Baggers Without Borders community, and grew into a real platform. I sincerely hope this isn't the end of the story.

My hope is that someone picks the project up, brings it back online and keeps developing it, adding new features and making it better. I also hope it attracts more and more climbers and hill-baggers who join and record their achievements. And whatever direction it takes, I hope it always stays open source, free and open for everyone.

It's over to you now. You're free to build on it under the licence, and I'd be glad to see it continue in good hands. 🏔️

Happy peakbagging! :)

Deividas Valaitis
17 September 2026
