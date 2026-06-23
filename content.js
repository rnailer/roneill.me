/* ============================================================
   roneill.me, portfolio content (placeholder where noted).
   Real Fidelity / 333 Games copy + metrics + covers slot in later.
   ============================================================ */
window.RON_CONTENT = {
  name: "Richard O'Neill",
  domain: "roneill.me",
  positioning: "Product designer bridging design, code and AI.",
  location: "Dublin, Ireland",
  coords: "53.3638° N · 6.2631° W",
  email: "hi@roneill.me",
  linkedin: "linkedin.com/in/roneill",

  skills: [
    { group: "Product Design", items: ["Product Strategy","UX Research","Interaction Design","Design Systems","Prototyping"] },
    { group: "AI",             items: ["AI Workflows","Prompt Design","Agent UX","AI Product Design","AI-Assisted Development"] },
    { group: "Build",          items: ["Figma","React","TypeScript","Next.js","Tailwind","Framer Motion"] },
  ],

  work: [
    {
      index: "01",
      client: "Fidelity",
      year: "2026",
      lead: true,
      headline: "Turned a FinOps chatbot into a dashboard that shows what needs attention",
      tags: ["AI product", "Data viz", "Dashboard"],
      metrics: [
        { value: "3", unit: "", caption: "ID entry points, App, Product, Product Line" },
        { value: "5", unit: "", caption: "At-a-glance utilisation states" },
      ],
      summary: "Shaped the UX for an AI/ML FinOps chatbot, then independently designed and built a VM Utilisation Dashboard, a visual layer that turns dense cloud-utilisation data into a scannable, colour-coded view of what needs attention and what to do next. Research-led, with an interactive prototype.",
      cover: "Fidelity · FinOps Dashboard",
      motif: "grid",
      shot: { kind: "mark", src: "assets/shots/vm-dashboard.svg", big: true },
      href: "case-studies/fidelity-finops/index.html",
      link: { label: "View case study", kind: "case", gated: false },
    },
    {
      index: "02",
      client: "Fidelity",
      year: "2023 — 24",
      lead: false,
      headline: "Helping people exercise stock options with clarity and confidence",
      tags: ["Design sprint", "Equity-comp UX", "Research-led"],
      metrics: [
        { value: "25", unit: "", caption: "Participants across three research studies" },
        { value: "3", unit: "", caption: "Steps in the FDS-ready redesigned flow" },
      ],
      summary: "Led the redesign of Fidelity's stock-option exercise flow, co-facilitating a four-week design sprint, then owning it through to an FDS-ready prototype. Built on a deep research base: the flow opens with a plain-language goal, pulls the most-valued calculator into the transaction, and answers the one question that stopped people submitting, what you'll actually receive.",
      cover: "Fidelity · Exercise flow",
      motif: "target",
      shot: { kind: "mark", src: "assets/marks/fidelity.png" },
      href: "case-studies/fidelity-exercise-flow/index.html",
      link: { label: "View case study", kind: "case", gated: false },
    },
    {
      index: "03",
      client: "333 Games",
      year: "2026 — Now",
      lead: false,
      headline: "An R&D lab that ships real games",
      tags: ["AI product", "End-to-end build", "Studio"],
      metrics: [
        { value: "2", unit: "", caption: "Products shipped under the studio" },
        { value: "100", unit: "%", caption: "Solo-built, design to ship" },
      ],
      summary: "An independent Dublin studio where I build AI-made games and apps end to end, design and code, idea to shipped. The place to keep my hands on the newest tools. jam → prototype → build → ship.",
      cover: "333 Games · studio",
      motif: "network",
      shot: { kind: "mark", src: "assets/marks/333-games.svg" },
      href: "case-studies/333-games/333 Games Studio - Case Study.html",
      link: { label: "View case study", kind: "case", gated: false },
    },
    {
      index: "04",
      client: "Sonarchy",
      year: "2026 — Now",
      lead: false,
      headline: "A music party game on one phone",
      tags: ["Mobile game", "Realtime", "AI build"],
      metrics: [
        { value: "1", unit: "", caption: "Phone runs the whole arcade" },
        { value: "7", unit: "", caption: "Live game phases, realtime-synced" },
      ],
      summary: "A mobile music party game that runs on a single host phone, jukebox, screen, referee and source of truth at once. A locked-down Supabase Realtime state machine keeps the room fair and in sync.",
      cover: "Sonarchy · music game",
      motif: "orbit",
      shot: { kind: "mark", src: "assets/marks/sonarchy.svg" },
      href: "case-studies/sonarchy/Sonarchy Case Study.html",
      link: { label: "View case study", kind: "case", gated: false },
    },
    {
      index: "05",
      client: "3 Letter Daily",
      year: "2026",
      lead: false,
      headline: "A daily word puzzle shipped in a weekend",
      tags: ["Daily game", "0 → 1", "Next.js"],
      metrics: [
        { value: "1", unit: "", caption: "Weekend, idea to live" },
        { value: "100", unit: "%", caption: "Designed and built solo" },
      ],
      summary: "A daily three-letter word puzzle designed, built and shipped solo with an AI-paired workflow, server-side guess evaluation, anonymous-first auth and a curated word pipeline. Next.js 15, Supabase, Vercel.",
      cover: "3 Letter Daily · word game",
      motif: "target",
      shot: { kind: "mark", src: "assets/marks/three-letter-daily.svg" },
      href: "case-studies/3-letter-daily/3 Letter Daily Case Study.html",
      link: { label: "View case study", kind: "case", gated: false },
    },
  ],

  about: {
    lead: [
      "I help teams turn ambiguous problems into shipped products. I work across discovery, design, prototyping and implementation, using AI to move faster and test ideas earlier.",
      "My background is product design, but I also build interactive prototypes and production-ready frontends using modern AI-assisted workflows.",
    ],
    // Experience timeline, from LinkedIn (roneill.me).
    timeline: [
      { role: "Founder & AI Product Designer", org: "333 Games", years: "2026 — Now" },
      { role: "Principal Product Designer", org: "Fidelity Investments", years: "2023 — Now" },
      { role: "Senior Product Designer", org: "Fidelity Investments", years: "2021 — 2023" },
      { role: "Product Designer", org: "Workhuman", years: "2017 — 2021" },
      { role: "Client Branding Design Manager", org: "Workhuman", years: "2013 — 2017" },
    ],
    tools: ["Product Strategy","User Research","Interaction Design","Design Systems","AI Product Design","Agent UX","Figma","Rapid Prototyping","React","TypeScript","Next.js","Tailwind","Framer Motion"],
  },
};
