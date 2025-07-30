Understood. I’ll generate a fully detailed `README.md` that:

* Clearly documents the dual-app structure (Neo and Retro) and shared layout.
* Embeds your current 'Personal Website Games' section unchanged.
* Explicitly instructs agents not to overwrite `/retro/` or `/shared/` without explicit approval.

This will help ensure nothing gets overridden by accident and your project structure is well protected and documented.


# Personal Website – Dual‐App Static Portfolio Architecture

**Overview:** This repository contains a personal portfolio website implemented as two parallel static web apps – a legacy **Retro** site and a modern **Neo** site. The **Retro** site is the original multi-page portfolio (with an RPG/game theme), while the **Neo** site is a redesigned cinematic single-page experience. Both versions coexist in the codebase, sharing only a common layout template for consistency. This document explains the project structure, how to switch between Retro and Neo modes, and guidelines for maintaining both sites.

## Table of Contents

* [Directory Structure](#directory-structure)
* [Neo vs. Retro Sites](#neo-vs-retro-sites)
* [Switching Between Modes](#switching-between-modes)

  * [Retro Mode Easter Egg (Neo → Retro)](#retro-mode-easter-egg-neo-→-retro)
  * [“New School” Button (Retro → Neo)](#new-school-button-retro-→-neo)
* [Shared Layout and Asset Isolation](#shared-layout-and-asset-isolation)
* [Maintaining Layout Parity](#maintaining-layout-parity)
* [Development Guidelines](#development-guidelines)
* [Personal Website Games](#personal-website-games) *(original section preserved)*

## Directory Structure

The repository is organized into three top-level directories representing the two apps and their shared resources:

```plaintext
/
├── neo/                # New "Neo" site – modern cinematic single-page app
│   ├── index.html      # Entry point for Neo site (single-page portfolio)
│   ├── assets/         # Assets (CSS, JS, images, etc.) used exclusively by Neo
│   └── ...             # Other Neo-specific files (sections, scripts, media)
├── retro/              # Legacy "Retro" site – classic multi-page RPG-themed site
│   ├── index.html      # Home page for Retro site (legacy homepage)
│   ├── about.html      # Additional pages (About, Skills, Projects, etc.)
│   ├── assets/         # Assets (CSS, JS, images, etc.) used exclusively by Retro
│   └── ...             # Other Retro-specific files (game scripts, styles, media)
└── shared/             # Shared resources between the two sites
    └── layout.html     # **Common layout template** (header, nav, footer) used by both
```

**Responsibilities of each directory:**

* **`neo/`** – Contains the **Neo** app, a **single-page** portfolio with cinematic styling and animations. All content, scripts, and styles for the new design live here. The Neo site is intended to be the primary, up-to-date portfolio experience with immersive UX. It typically loads at the root of the live site (e.g. the main homepage) and presents all sections in one continuous page (with dynamic scrolling or transitions).

* **`retro/`** – Contains the **Retro** app, which is the **legacy multi-page** website (the original portfolio). It retains the classic RPG-inspired theme, including pages like About, Skills, Projects, etc., and features such as the retro game carousel on the home page. The Retro site is mostly kept unchanged as an archive or Easter egg, accessible alongside the new site. All files here are self-contained; **do not modify the Retro site’s code or assets unless explicitly instructed** (it should remain a stable reference of the old design).

* **`shared/`** – Contains resources **shared by both** versions. Currently, **`layout.html`** is the **only shared asset** – a common HTML layout template that defines the page structure (including the `<head>`, navigation bar, main container, and footer). Both the Neo and Retro pages are wrapped with this same layout to maintain a consistent structure and navigation across versions. Aside from this layout template, **all other content, styles, and scripts are isolated to their respective apps** (Neo or Retro). *Do not restructure or replace the shared layout file unless absolutely necessary,* as it impacts both sites.

## Neo vs. Retro Sites

**Neo (New School):** The Neo site is a **single-page application** that delivers an interactive, cinematic experience. All portfolio sections (skills, projects, experience, etc.) are presented on one page, using smooth scrolling and animation effects. It leverages modern front-end techniques (for example, animated backgrounds, scroll-triggered animations via GSAP, sound effects via Howler, etc.) to create an immersive “cinematic” feel. The Neo site is intended to be the default/main version of the portfolio that visitors see.

**Retro (Old School):** The Retro site is the **legacy version** of the portfolio, featuring a classic multi-page layout and an RPG/game theme. It includes separate pages (Home, About, Skills, Projects, Experience, Contact, etc.) and a nostalgic **carousel of mini-games** on the homepage. The Retro design uses an older aesthetic but is fully functional. This site is preserved as an Easter egg and for nostalgia — it’s not linked prominently in the Neo UI, but can be accessed via a secret code or direct link. A visitor who discovers the Retro site will find a “New School” switch to return to the Neo site.

Despite sharing the overall content (your personal information and projects), **Neo and Retro have completely separate implementations**. They do, however, use the same base layout structure for consistency in navigation and footer. This ensures that core navigation (links to Home/About/etc.) and meta tags remain consistent between the two versions.

## Switching Between Modes

One of the goals of this dual-app setup is to allow users (and developers) to switch between the **Neo** and **Retro** versions seamlessly, while keeping each version mostly hidden unless intentionally accessed. There are two mechanisms for toggling:

### Retro Mode Easter Egg (Neo → Retro)

On the Neo site, there is a hidden **“Retro Mode”** trigger implemented as an Easter egg using the classic **Konami Code**. If a user enters the sequence **Up, Up, Down, Down, Left, Right, Left, Right, B, A** on their keyboard while on the Neo page, the site will activate Retro Mode. In practice, the Neo app’s script listens for this specific key sequence and, once detected, automatically redirects or switches the user to the Retro site (likely by navigating to the `retro/index.html` page).

This fun Easter egg allows curious users to discover the old-school version of the site. It’s a nod to classic games and fits the theme. (The Konami Code was chosen for its iconic status among gamers.) From a developer perspective, the implementation involves capturing keydown events and matching them against the code sequence. When triggered, the code simply loads the Retro site – for example, by setting `window.location` to the Retro page. **Note:** This feature should remain unobtrusive on the Neo site (no visible Retro link) except for the secret code. If you modify the Neo site’s scripts, be careful not to break the sequence detection for Retro Mode.

### “New School” Button (Retro → Neo)

On the Retro site, there is a visible **“New School”** button or link in the UI that allows users to easily switch to the modern Neo site. This is typically placed in a prominent location (for example, in the navigation bar, header, or as a banner) so that anyone who lands on the Retro site can find their way to the new design. Clicking the “New School” button will navigate the browser to the Neo site’s homepage (e.g., to the root or `/neo/index.html` depending on deployment).

The presence of this button ensures that the Retro site isn’t a dead-end. It invites users to check out the redesigned portfolio. From a maintenance standpoint, this is a simple HTML link in the Retro pages. If the Neo site’s URL or structure changes, make sure to update the “New School” link accordingly. By design, the Retro site does **not** automatically redirect to Neo (so that the Easter egg experience is preserved), but the button provides a manual way out of Retro mode.

## Shared Layout and Asset Isolation

Both the Neo and Retro pages make use of a common layout template located at **`/shared/layout.html`**, which contains the HTML scaffolding for all pages. This layout includes the `<head>` section (meta tags, stylesheet and script includes, etc.), the site-wide navigation bar, a footer, and a content container. Within `layout.html`, the content of each page is inserted in the appropriate spot (for example, via a templating include like Jekyll’s `{{ content }}` tag or similar). By sharing the same layout file, both sites maintain the **same page structure and navigation menus**, ensuring a consistent look for the header/footer between Retro and Neo.

Important details about the shared layout:

* **Navigation & Branding:** The layout defines the navigation menu (links to Home, About, Skills, etc., and site branding). This menu is used by both sites. This means any change to nav links or branding in `layout.html` will reflect in **both** the Neo and Retro versions. For example, if you add a new section or page link in the nav, it will appear on both sites’ navbars. (Conversely, if a page only exists in one version, you wouldn’t want it in the global nav without a conditional, so generally the nav only lists sections common to both or anchors that both can handle.)

* **Shared Head Elements:** Common CSS/JS libraries are included here (for instance, Bootstrap, icons, GSAP, Howler, etc.). Both sites rely on these includes. The layout may also link a main CSS file and main JS file. In the dual setup, those links are typically written **relative to the page** so that each site loads its own assets. For example, the layout might include a line to load `assets/css/style.css` (without a leading slash), which will resolve to `neo/assets/css/style.css` when a Neo page uses the layout, or to `retro/assets/css/style.css` when a Retro page uses it. This way, each site can have differently styled **`style.css`** files in their own assets folder, both referenced by the same relative path in the layout.

* **Isolation of Assets:** Aside from the HTML layout structure, **no other files are shared between Neo and Retro.** All images, scripts, CSS, and page content are duplicated or separated per app. The Neo site has its own `assets` folder and unique filenames for its resources, and the Retro site has its own. This is intentional to avoid any conflicts. Each site can be developed and modified independently (in terms of styling and functionality) as long as the contract of the layout (like having certain element IDs or classes that the layout or nav expects) is maintained. For instance, both sites might have a file named `main.js` or `style.css`, but they reside in different folders (`neo/assets/js/main.js` vs `retro/assets/js/main.js`) and can evolve differently.

In summary, **the `shared/layout.html` is the only coupling point between the two apps.** Everything else is siloed. If you open a page from either site in a browser, it should function on its own with its respective assets. This separation ensures that work on the Neo site (e.g., overhauling styles or scripts for the new design) won’t unexpectedly break the Retro site, and vice versa.

## Maintaining Layout Parity

Because both versions use a common layout template for critical structure, it’s important to maintain **parity** in shared elements so that the user experience remains coherent. Here are some best practices and guidelines for keeping the layout and overall design consistent:

* **Make changes deliberately in the shared layout:** If you need to update a global element (like adding a new nav link, changing the site title, or modifying the footer text), do it in `shared/layout.html` so both Neo and Retro reflect the change. Always verify the update in **both** versions, since a change might look good in Neo but could have subtle effects in Retro (or vice versa). For example, adding a new nav menu item might overflow a single-page layout or be redundant on one version if that section doesn’t exist there.

* **Keep layout structure uniform:** Avoid adding markup to the layout that only one site needs. The layout should remain a neutral container. If one site requires an extra UI element that the other doesn’t (for example, a special banner or script), consider implementing it within that site’s pages or assets, not in the shared layout (or guard it with a condition). The goal is to minimize conditional logic in the shared file; it should be as universal as possible.

* **Duplicate small differences if needed:** It’s acceptable to have some duplication between the two sites in order to keep them independent. For instance, if Neo and Retro require slightly different implementations of a component, it’s better to handle that separately in each site’s code rather than complicating the shared layout. *In other words, don’t over-DRY beyond the layout.* Sharing the layout is meant to reduce maintenance of core structure, but trying to share more (like combining styles or scripts) could introduce brittle coupling. Embrace a bit of copy-paste for the sake of clarity and stability between the two versions.

* **Manually sync visual updates:** If you change a design aspect (e.g., update a logo image or tweak a color scheme) in one site, decide if the other site should get a similar update for consistency. Since the stylesheets are separate, you’ll need to manually apply such changes to both sets of files if desired. For example, if the company/portfolio logo is updated, replace it in both `neo/assets/images/` and `retro/assets/images/` (assuming both use a logo). Consistent branding elements (like logos, favicon, contact info) should usually be kept in sync across Retro and Neo.

* **Test both versions regularly:** When making changes to any part of the system (especially the shared layout or anything that could be shared implicitly like asset file names), always test both the Neo and Retro sites. It’s easy to inadvertently break one while working on the other if, say, you rename a script that the layout expects or remove a nav link that Retro pages still assume exists. A quick smoke test of both modes can catch these issues early.

By following these practices, you ensure that the Retro and Neo sites remain **visually and functionally parallel** in the areas they are meant to be (navigation, structure, core content) even as the Neo site continues to evolve with new features or design changes.

## Development Guidelines

If you are a developer contributing to this project, please keep the following guidelines in mind to avoid conflicts between the two site versions and to maintain the integrity of the portfolio:

1. **Focus on the Neo site for new features:** The **Neo** app is the primary, actively developed site. All new content, design improvements, and interactive features should generally be added to `neo/`. The **Retro** app is meant to remain as a historical snapshot (aside from minor content updates or bug fixes). When adding something new, ask whether it’s needed in Retro at all – often it will be exclusive to Neo.

2. **Do *not* modify files in `retro/` unless necessary:** Treat the `retro/` directory as read-only in practice. **Do NOT override or refactor anything in `/retro/`** unless you have a specific directive to do so. This ensures the legacy experience remains intact. If you discover a critical bug in the Retro site or need to update a personal detail (like contact info) for consistency, you can fix that – but avoid any sweeping changes or redesigns there.

3. **Do *not* restructure the shared layout without approval:** The file `shared/layout.html` is used by both sites; changing it can have wide-ranging effects. **Do NOT override or heavily redesign `/shared/layout.html`** unless it’s been discussed and agreed upon. Small tweaks (like adding a nav item or script include) are okay with caution. If a major layout overhaul is needed for Neo, consider whether Retro should also get it. In general, keep the shared layout as simple and universal as possible.

4. **Maintain separation of assets:** When adding new assets (images, scripts, styles), put them in the appropriate site folder, not in some new shared location. For example, if Neo gets a new library or image, add it under `neo/assets/` (and reference it relatively in Neo pages or the layout). If Retro coincidentally needs the same asset, you should add a copy under `retro/assets/` rather than trying to have them reference one file. This prevents any cross-dependency that could tangle the build or deployment. The slight duplication is intentional for clear boundaries.

5. **Coordinate content updates across versions:** If you update information that appears on both sites (such as your bio, project descriptions, or contact details), update it in **both** the Neo and Retro implementations. This might mean editing text in two places (e.g., the Neo single-page content and the corresponding Retro page). This way, the Retro site, when accessed, will still reflect accurate information even if its design is outdated.

6. **Testing and QA:** Always test your changes in both modes. If you add a section to the Neo page, ensure that the Retro site still loads and that the shared layout didn’t introduce an issue. If you modify the layout or a common script, double-check that it doesn’t break anything in either version (e.g., the Konami code script for Retro Mode still works, the “New School” link still points correctly, etc.). It’s best to open `neo/index.html` and `retro/index.html` in a browser (or use a local static server) to verify everything.

By adhering to these guidelines, you’ll help keep the dual-site system stable and easy to work with. The guiding principle is **isolation with minimal sharing** – Neo and Retro each have their own sandbox, with just a thin shared layer for structure. When in doubt, keep changes limited to one site’s domain, and avoid touching the legacy code.

*Happy coding, and enjoy the Easter eggs!* \:video\_game:

## Personal Website Games

*(The following section is preserved from the original README, documenting the mini-games on the site.)*

# Personal Website Games

This site contains small canvas games used on the homepage carousel.

## Controls

* **Tetris** – Arrow keys to move, `Q`/`W` to rotate pieces.
* **Snake** – Arrow keys to move the snake.
* **Breakout** – Use left and right arrows to move the paddle.

Click the **Start** button on any slide to play and **Stop** to halt. Switching slides automatically stops the current game. On small screens, touch arrows appear below each canvas for control.

## 3D Models

Several pages can display lightweight GLB models. Copy your files into `assets/models/` using the exact names listed in that folder's README. The loader scripts will pick them up automatically.
