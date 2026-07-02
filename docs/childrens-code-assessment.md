# ICO Children's Code (AADC) self-assessment — Kindled child wishes

Drafted 2026-07-02 by the engineering side, acting on founder delegation.
Status: SELF-ASSESSMENT — to be ratified by DPO/counsel before launch (see
docs/legal-brief.md §5). Scope: the "child wish" and star-chart features.

## Product facts the assessment rests on
- A child wish is created, owned and managed by a parent/guardian who
  affirms that role at creation ("I'm a parent or guardian…" toggle).
- The only child-related datum is a FIRST NAME, entered by the parent.
  Children have no accounts, no logins, and no data is collected from them.
- The child-facing surface (catalogue "circling", star chart) is a view
  rendered on the parent's wish; interactions are approved by the parent
  (child-circled items enter a parent approval queue before going live).
- No advertising, no profiling, no geolocation, no messaging to children.

## The 15 standards
| # | Standard | Position |
|---|---|---|
| 1 | Best interests of the child | The feature's purpose is a coordinated, well-chosen gift; no engagement-maximising mechanics aimed at children; star chart rewards effort set by the parent, capped by the parent. |
| 2 | Data protection impact assessment | This document seeds the DPIA; formal DPIA to be completed at launch with counsel. |
| 3 | Age appropriate application | Children never hold accounts; all data flows are parent-mediated. |
| 4 | Transparency | /privacy explains child data (first name only, parent-supplied) in plain language. |
| 5 | Detrimental use of data | Child first name is used solely for display on the family's wish; never for marketing, never shared. |
| 6 | Policies and community standards | Terms prohibit unlawful content; message/video moderation policy in legal-brief §6. |
| 7 | Default settings | Child wishes default to surprise-off visibility for the child view and amounts hidden; the highest-privacy state is the default. |
| 8 | Data minimisation | First name only. No surname, DOB, school, photo or contact data is requested for a child. |
| 9 | Data sharing | None. Child first name never leaves the platform (not sent to processors beyond hosting/DB). |
| 10 | Geolocation | Not collected, feature-wide. |
| 11 | Parental controls | The parent IS the account; the child view exists only when the parent shares their device/screen. |
| 12 | Profiling | None. No behavioural profiling of any user; explicitly none of children. |
| 13 | Nudge techniques | Star chart contains no purchase-pressure mechanics (guardrail since v4.1); no streaks, no loss-aversion, no countdown pressure on children. |
| 14 | Connected toys and devices | Not applicable. |
| 15 | Online tools | Reporting/takedown route via /contact; organiser can remove any message on their wish. |

## Residual actions
1. Formal DPIA at launch (standard 2).
2. DPO/counsel ratification and sign-off log.
3. Re-assess if any child-facing interaction gains its own input surface
   (e.g. the deferred P3.1 "circle it" build must route every child action
   through the parent approval queue, as scoped).
