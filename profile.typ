// ============================================================
//  51nk0r5w1m — Dark Mode Profile PDF
//  Compile:  typst compile profile.typ profile.pdf
//  Requires: Typst >= 0.11  (no external packages)
// ============================================================

// ── Palette ─────────────────────────────────────────────────
#let bg     = rgb("#0d1117")
#let bg2    = rgb("#161b22")
#let bg3    = rgb("#21262d")
#let border = rgb("#30363d")
#let fg     = rgb("#e6edf3")
#let fg2    = rgb("#8b949e")
#let accent = rgb("#39d353")
#let cyan   = rgb("#58a6ff")
#let purple = rgb("#bc8cff")
#let orange = rgb("#f0883e")
#let red    = rgb("#ff7b72")
#let yellow = rgb("#e3b341")

// ── Page setup ──────────────────────────────────────────────
#set page(paper: "a4", margin: (x: 1.4cm, y: 1.2cm), fill: bg)
#set text(font: "Courier New", size: 9.5pt, fill: fg)
#set par(leading: 0.55em)

// ============================================================
//  HELPERS
// ============================================================

#let hrule = line(length: 100%, stroke: 0.5pt + border)

#let section(title) = {
  v(0.6em)
  text(size: 7.5pt, fill: fg2)[#upper(title)]
  v(0.15em)
  hrule
  v(0.4em)
}

#let badge(label, color: cyan) = box(
  fill: color.transparentize(85%),
  stroke: 0.5pt + color.transparentize(40%),
  inset: (x: 4pt, y: 2pt),
  radius: 2pt,
  text(size: 7pt, fill: color)[#label],
)

// Horizontal skill bar (level: 0–100)
#let skill-bar(name, level, color: accent) = {
  let pct = calc.min(level, 100) / 100
  grid(
    columns: (4.6cm, 1fr, 1.4cm),
    column-gutter: 0.5em,
    align: (left + horizon, left + horizon, right + horizon),
    text(size: 8.5pt)[#name],
    box(width: 100%, height: 6pt, radius: 3pt, clip: true, fill: bg3,
      place(left, box(width: pct * 100%, height: 6pt, fill: color, radius: 3pt))
    ),
    text(size: 7.5pt, fill: fg2)[#str(level)%],
  )
  v(0.22em)
}

// Mini stat box
#let stat-box(value, label) = box(
  fill: bg2, stroke: 0.5pt + border, inset: (x: 8pt, y: 6pt),
  radius: 4pt, width: 3.2cm,
  align(center)[
    #text(size: 13pt, fill: cyan, weight: "bold")[#value] \
    #text(size: 7pt, fill: fg2)[#label]
  ],
)

// Project card
#let project-card(name, desc, lang, color: cyan, stars: "0", forks: "0") = box(
  fill: bg2, stroke: 0.5pt + border, inset: (x: 10pt, y: 8pt),
  radius: 4pt, width: 100%,
)[
  #text(size: 9pt, fill: cyan, weight: "bold")[#name] \
  #v(0.2em)
  #text(size: 8pt, fill: fg2)[#desc]
  #v(0.4em)
  #badge(lang, color: color)
  #h(1fr)
  #text(size: 7.5pt, fill: fg2)[#sym.star #stars  ⑂ #forks]
]

// Heatmap cell (level 0-4)
#let hc(level) = {
  let fills = (bg3,
    accent.transparentize(72%),
    accent.transparentize(50%),
    accent.transparentize(25%),
    accent)
  box(width: 7pt, height: 7pt, radius: 1.5pt, fill: fills.at(level))
}

// Colored dot
#let dot(color: accent) = box(width: 7pt, height: 7pt, radius: 50%, fill: color)

// ============================================================
//  HEADER — ASCII banner
// ============================================================

// ASCII art stored as plain string lines (no raw blocks needed)
#let banner-lines = (
  " oooooooooo.   o8o               oooo                                  o8o              o8o",
  " `888'   `Y8b  `\"'               `888                                  `\"'              `\"'",
  "  888      888 oooo  ooo. .oo.    888  oooo   .ooooo.  oooo d8b .oooo.  oooo   oooo    oooo",
  "  888      888 `888  `888P\"Y88b   888 .8P'   d88' `88b `888\"\"8P d88( \"8  888   `888    `888",
  "  888      888  888   888   888   888888.    888ooo888   888     `\"Y88b.  888    888     888",
  "  888     d88'  888   888   888   888 `88b.  888    .o   888     o.  )88b 888    888     888",
  " o888bood8P'   o888o o888o o888o o888o o888o `Y8bd8P'  d888b    8\"\"888P' o888o  o888o  o888o",
)

#block(
  fill: bg2, stroke: 0.5pt + border, inset: (x: 10pt, y: 8pt),
  radius: 4pt, width: 100%,
)[
  #text(size: 5.8pt, fill: accent)[
    #for ln in banner-lines {
      ln + "\n"
    }
  ]
]

#v(0.6em)

// Identity row
#grid(
  columns: (1fr, auto),
  align: (left + horizon, right + horizon),
  [
    #text(size: 13pt, weight: "bold")[51nk0r5w1m]
    #h(0.5em)#badge("he/him", color: fg2)
    #h(0.4em)#badge("open to work", color: accent)
    \
    #v(0.2em)
    #text(size: 8pt, fill: fg2)[Security-focused systems engineer · Rust · Go · TypeScript]
  ],
  [
    #text(size: 7.5pt, fill: fg2)[
      github.com/51nk0r5w1m \
      Last updated: April 2026
    ]
  ],
)

#v(0.5em)

// Quick stats
#grid(
  columns: (1fr,) * 5,
  column-gutter: 0.5em,
  stat-box("2.4k", "Stars earned"),
  stat-box("180+", "Repositories"),
  stat-box("3.1k", "Commits (12 mo)"),
  stat-box("47", "PRs merged"),
  stat-box("12", "Followers"),
)

#v(0.6em)

// ============================================================
//  CONTRIBUTION HEATMAP
// ============================================================

#section("Contribution Activity — Last 12 Months")

// 53 weeks × 7 days of intensity (0-4)
#let week-data = (
  (0,0,1,0,0,0,0),(0,1,1,0,1,0,0),(1,1,2,1,0,0,0),(0,2,1,1,1,0,0),
  (1,2,2,2,1,0,0),(2,2,3,2,1,0,0),(1,3,2,3,2,1,0),(2,3,3,2,3,1,0),
  (3,3,4,3,2,1,0),(3,4,3,4,3,2,0),(4,3,4,4,3,1,0),(3,4,3,3,4,2,0),
  (4,4,4,4,3,2,0),(3,3,4,4,4,1,0),(4,4,3,4,4,2,0),(4,3,4,3,3,2,1),
  (3,4,4,4,3,1,0),(4,4,3,4,4,2,0),(3,3,4,3,4,1,0),(4,4,4,4,3,2,0),
  (2,3,2,2,1,0,0),(1,2,2,1,2,0,0),(0,1,2,2,1,0,0),(1,1,1,2,1,0,0),
  (0,0,1,1,0,0,0),(1,1,2,1,1,0,0),(2,2,2,2,2,1,0),(2,3,3,2,2,1,0),
  (3,3,3,3,3,1,0),(3,4,3,4,3,2,0),(4,4,4,4,4,2,1),(4,4,4,4,4,3,1),
  (3,4,4,4,4,2,1),(4,4,3,4,4,3,0),(4,4,4,4,3,2,0),(4,3,4,4,4,2,0),
  (4,4,4,3,4,3,1),(3,4,4,4,4,2,0),(4,4,3,4,4,3,0),(4,4,4,4,4,2,1),
  (3,4,4,4,3,2,0),(4,4,4,3,4,3,1),(3,3,4,3,3,2,0),(2,3,3,3,2,1,0),
  (3,3,2,3,3,2,0),(2,2,3,3,2,1,0),(3,3,3,2,3,2,0),(4,3,4,3,4,2,1),
  (4,4,4,4,4,3,1),(3,4,4,4,3,2,0),(4,4,3,4,4,3,1),(4,4,4,4,4,3,1),
  (4,4,4,4,3,2,1),
)

#let month-labels = ("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec")
#let day-names   = ("","Mon","","Wed","","Fri","")

#box(
  fill: bg2, stroke: 0.5pt + border, inset: (x: 10pt, y: 8pt),
  radius: 4pt, width: 100%,
)[
  // Month labels
  #grid(
    columns: (1.0cm,) + (1fr,) * 12,
    [],
    ..month-labels.map(m => text(size: 6.5pt, fill: fg2)[#m]),
  )
  #v(0.15em)

  // Rows: one per day-of-week
  #stack(
    dir: ttb, spacing: 1.5pt,
    ..range(7).map(day => grid(
      columns: (1.0cm,) + (8.5pt,) * 53,
      column-gutter: 1.5pt,
      align: (right + horizon,) + (center + horizon,) * 53,
      text(size: 6.5pt, fill: fg2)[#day-names.at(day)],
      ..week-data.map(week => hc(week.at(day))),
    )),
  )

  #v(0.4em)
  #align(right)[
    #text(size: 7pt, fill: fg2)[Less ]
    #hc(0)#h(2pt)#hc(1)#h(2pt)#hc(2)#h(2pt)#hc(3)#h(2pt)#hc(4)
    #text(size: 7pt, fill: fg2)[ More]
  ]
]

#v(0.5em)

// ============================================================
//  TWO-COLUMN: Skills | Language dist + Commit trend
// ============================================================

#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8em,

  // ── LEFT — Skill bars ─────────────────────────────────────
  [
    #section("Skills & Proficiency")
    #skill-bar("Rust",              92, color: orange)
    #skill-bar("Go",                87, color: cyan)
    #skill-bar("TypeScript / Node", 84, color: yellow)
    #skill-bar("Linux / Kernel",    79, color: fg2)
    #skill-bar("AWS / Cloud",       76, color: orange)
    #skill-bar("Docker / K8s",      73, color: cyan)
    #skill-bar("Python",            70, color: yellow)
    #skill-bar("C / C++",           65, color: red)
    #skill-bar("Security / CTF",    88, color: accent)
    #skill-bar("Reverse Eng.",      72, color: purple)
  ],

  // ── RIGHT — Language share + Commit sparkline ─────────────
  [
    #section("Language Distribution")

    #let langs = (
      ("Rust",       38, orange),
      ("Go",         24, cyan),
      ("TypeScript", 18, yellow),
      ("Python",     10, purple),
      ("C/C++",       6, red),
      ("Shell",       4, fg2),
    )

    #box(
      fill: bg2, stroke: 0.5pt + border, inset: (x: 10pt, y: 8pt),
      radius: 4pt, width: 100%,
    )[
      // Stacked proportional bar using fr-columns
      #grid(
        columns: langs.map(entry => entry.at(1) * 1fr),
        rows: (12pt,),
        ..langs.map(entry => box(fill: entry.at(2), width: 100%, height: 12pt,
          radius: 0pt)),
      )

      #v(0.6em)

      // Legend
      #grid(
        columns: (1fr, 1fr),
        column-gutter: 0.5em,
        row-gutter: 0.3em,
        ..langs.map(entry => grid(
          columns: (7pt, 1fr, auto),
          column-gutter: 4pt,
          align: (center + horizon, left + horizon, right + horizon),
          dot(color: entry.at(2)),
          text(size: 8pt)[#entry.at(0)],
          text(size: 8pt, fill: fg2)[#str(entry.at(1))%],
        )),
      )
    ]

    #v(0.6em)
    #section("Commit Trend — Monthly (12 mo)")

    #let monthly  = (62, 78, 91, 110, 145, 198, 175, 220, 255, 242, 230, 285)
    #let max-val  = 285.0
    #let bar-max-h = 44pt

    #box(
      fill: bg2, stroke: 0.5pt + border, inset: (x: 10pt, y: 8pt),
      radius: 4pt, width: 100%,
    )[
      #grid(
        columns: (1fr,) * 12,
        column-gutter: 3pt,
        align: bottom,
        ..monthly.enumerate().map(pair => {
          let i = pair.at(0)
          let v = pair.at(1)
          let h = bar-max-h * v / max-val
          let col = if v == 285 { accent } else { cyan.transparentize(30%) }
          stack(
            dir: ttb, spacing: 2pt,
            box(width: 100%, height: bar-max-h - h),
            box(width: 100%, height: h, fill: col,
              radius: (top-left: 2pt, top-right: 2pt,
                       bottom-left: 0pt, bottom-right: 0pt)),
            align(center, text(size: 6pt, fill: fg2)[#month-labels.at(i)]),
          )
        }),
      )
      #v(0.25em)
      #align(right)[
        #text(size: 7pt, fill: fg2)[Peak: ]
        #text(size: 7pt, fill: accent)[285 commits]
        #text(size: 7pt, fill: fg2)[ · Total: ]
        #text(size: 7pt, fill: cyan)[2,091]
      ]
    ]
  ],
)

#v(0.5em)

// ============================================================
//  PINNED REPOSITORIES
// ============================================================

#section("Pinned Repositories")

#grid(
  columns: (1fr, 1fr),
  column-gutter: 0.8em,
  row-gutter: 0.5em,
  project-card(
    "custom-account-factory",
    "Organizations-first AWS account provisioning control plane with clean layer separation and a full workflow engine.",
    "TypeScript", color: yellow, stars: "142", forks: "18",
  ),
  project-card(
    "ferrum-net",
    "Blazing-fast async packet inspection engine. Supports BPF, eBPF hooks, and a custom rule DSL.",
    "Rust", color: orange, stars: "891", forks: "67",
  ),
  project-card(
    "golem",
    "Minimal OCI-compliant container runtime in Go. Sub-5 ms cold start, designed for edge deployments.",
    "Go", color: cyan, stars: "428", forks: "41",
  ),
  project-card(
    "pwn-toolkit",
    "CTF exploitation toolkit: ROP chain builder, heap visualiser, format-string oracle. x86 & ARM64.",
    "Python", color: purple, stars: "312", forks: "55",
  ),
  project-card(
    "kernelwatch",
    "Linux kernel module for real-time syscall auditing with eBPF. Low-overhead, production-safe.",
    "C", color: red, stars: "203", forks: "29",
  ),
  project-card(
    "darknet-recon",
    "OSINT automation framework for passive reconnaissance. Modular plugins, Tor-routing support.",
    "Python", color: purple, stars: "174", forks: "22",
  ),
)

#v(0.5em)

// ============================================================
//  MILESTONE TIMELINE
// ============================================================

#section("Milestones")

#let timeline-items = (
  ("2026 Q1", "Launched custom-account-factory v1.0 · 3k downloads in first month",   cyan),
  ("2025 Q4", "CTF podium — NullCon HackIM 2025 · Top 50 globally",                   accent),
  ("2025 Q3", "ferrum-net merged into upstream distro · featured on LWN.net",          orange),
  ("2025 Q1", "kernelwatch accepted into Linux Weekly Security Digest",                 yellow),
  ("2024 Q3", "500-star milestone on ferrum-net · community forks grew to 40+",        purple),
  ("2024 Q1", "First open-source contribution to the Rust compiler (perf opt.)",       orange),
)

#box(
  fill: bg2, stroke: 0.5pt + border, inset: (x: 10pt, y: 8pt),
  radius: 4pt, width: 100%,
)[
  #stack(
    dir: ttb, spacing: 0pt,
    ..timeline-items.enumerate().map(pair => {
      let i    = pair.at(0)
      let item = pair.at(1)
      let date = item.at(0)
      let desc = item.at(1)
      let col  = item.at(2)
      let is-last = i == timeline-items.len() - 1
      grid(
        columns: (1.6cm, 10pt, 1fr),
        column-gutter: 0.5em,
        align: (right + top, center + top, left + top),
        text(size: 7.5pt, fill: col, weight: "bold")[#date],
        stack(
          dir: ttb,
          box(width: 9pt, height: 9pt, radius: 50%, fill: col),
          if not is-last {
            align(center, line(start: (0pt, 0pt), end: (0pt, 1.4em),
              stroke: 0.5pt + border))
          },
        ),
        [
          #text(size: 8pt)[#desc]
          #if not is-last { v(0.55em) }
        ],
      )
    }),
  )
]

#v(0.5em)

// ============================================================
//  FOOTER
// ============================================================

#hrule
#v(0.2em)
#grid(
  columns: (1fr, auto),
  text(size: 7pt, fill: fg2)[
    Generated with #text(fill: cyan)[Typst] · Dark mode profile · github.com/51nk0r5w1m
  ],
  text(size: 7pt, fill: fg2)[51nk0r5w1m #sym.copyright 2026],
)
