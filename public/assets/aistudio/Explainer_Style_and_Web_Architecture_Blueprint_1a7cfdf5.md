# Explainer Style and Web Architecture Blueprint

*One reference for building every future explainer page so they look and feel like the same family. Topic-agnostic.*

## 1. Design philosophy

- **Clear, simple, minimalist.** Light mode only. Lots of white space. Nothing decorative.
- **Colour means something.** The page is greyscale, plus two accent colours that always stand for the two things being compared. Never add colour for decoration.
- **Text first, visuals second.** A narrow reading column with figures dropped in between paragraphs.
- **Every figure is interactive** and has its own controls row and its own live readout.
- **Plain, friendly writing.** Short sentences, everyday words.

## 2. Page architecture

One self-contained HTML file. A single centred column, in this order:

1. **Title** (h1)
2. **Lead line:** one or two sentences in muted grey that say why the page exists
3. **How to use:** one short paragraph (drag to rotate, use the controls)
4. **Setup section:** explains the data or situation before any figure
5. **Numbered sections**, each: heading → 2 to 3 short paragraphs → Try-this box → figure → optional note
6. **Closing section:** an honest takeaway, including what is *not* solved
7. **Read more:** list of links with a one-line description each

**Figure card (every visualization uses this exact structure):**

1. Canvas or chart area
2. Controls row (sliders, toggles, buttons)
3. Readout row (live numbers)
4. Optional extra panel (for example a preview)

**Libraries:** load from a CDN, pin exact versions, and keep everything else inline. Page is `<meta name="viewport" content="width=device-width, initial-scale=1">`, with `box-sizing: border-box` everywhere.

## 3. Layout, width and spacing

| Item | Value |
| --- | --- |
| Content column | `max-width: 760px`, centred with `margin: 0 auto` |
| Page padding | `48px` top, `20px` left and right, `96px` bottom |
| Title margin | `0 0 8px` |
| Section heading margin | `56px 0 8px` (big gap above, small gap below) |
| Paragraph margin | `0 0 16px` |
| Figure card margin | `20px 0` |
| Figure canvas height | `360px`, full card width |
| Controls row | padding `14px 16px`, gap `14px 24px`, wraps on small screens |
| Readout row | padding `10px 16px` |
| Card corner radius | `12px` |
| Button and input radius | `8px` and `6px` |
| Border | `1px solid` the line colour |

Spacing scale in use: 4, 8, 12, 16, 20, 24, 48, 56, 96. Stick to these.

**Responsive:** there are no breakpoints. The single column, full-width canvases and wrapping controls row adapt on their own. Test at about 380px wide.

## 4. Typography

- **Font stack:** `system-ui, -apple-system, 'Segoe UI', sans-serif`. No web fonts, so pages load fast and feel native.
- **Body:** `16px`, line height `1.6`, colour `#333`.

| Element | Size | Notes |
| --- | --- | --- |
| Title (h1) | `2rem`, line height `1.2` | Colour `#1a1a1a` |
| Lead line | `1.1rem` | Muted grey |
| Section heading (h2) | `1.25rem` | Colour `#1a1a1a` |
| Try-this box | `.95rem` | Body colour |
| Controls and readouts | `.9rem` | Muted grey, key numbers in dark |
| Read-more list | `.92rem` | Descriptions in muted grey |
| Notes and small labels | `.85rem` | Muted grey |
| Tiny numbers beside bars | `.8rem` | Right-aligned |

**Numbers:** use `font-variant-numeric: tabular-nums` in readouts so digits do not jump as sliders move. Emphasise key values with bold in the dark text colour.

## 5. Colour palette

**UI colours**

| Role | Value |
| --- | --- |
| Page background | `#ffffff` |
| Figure and panel background | `#fafafa` |
| Border and divider | `#e8e8e8` |
| Main text, buttons, outlines | `#1a1a1a` |
| Paragraph text | `#333333` |
| Muted text (labels, notes) | `#6b6b6b` |
| Links | `#2563eb` |

**Data colours (inside figures)**

| Role | Value |
| --- | --- |
| Category A | blue `#2563eb` |
| Category B | orange `#e8590c` |
| Neutral / unselected / ghost | grey `#b5b5b5` |
| Emphasis (arrows, selected outcome) | near-black `#1a1a1a` |
| Translucent surface (plane, wall) | `#6aa6ff` at 20% opacity, or `#999999` at 15% |
| Floor grid | `#dddddd` and `#eeeeee` |

**Rules:** never use more than the two accent colours in one figure. Do not rely on colour alone: also change opacity, size or shape (for example faded means rejected). Keep the same colour meaning on every figure of a page.

## 6. Components

- **Controls row:** white background, top border, labels in muted grey with the control beside them, wrapping flex layout.
- **Slider:** `130px` wide, `accent-color` set to the dark text colour.
- **Button:** `1px` dark border, white background, dark text, `8px` radius; on hover it inverts (dark background, white text).
- **Dropdown and text input:** inherit the page font, `1px` light border, `6px` radius.
- **Readout row:** muted grey text with bold dark numbers, a small `9px` coloured dot as a legend key.
- **Try-this box:** `3px` dark left border, `14px` left padding, bold label, short bullet list.
- **Note:** one muted `.85rem` line for caveats and simplifications.
- **Bars (comparison previews):** `6px` tall, `3px` radius, original in grey and changed in blue, with the numbers on the right.
- **File or settings box:** same card look as a figure: light border, `12px` radius, panel background.
- **Links:** blue, no extra styling, open in a new tab with `rel="noopener"`.

## 7. 3D and chart conventions

- **Renderer:** transparent background so the card colour shows through; pixel ratio capped at 2.
- **Camera:** perspective, field of view 45, placed about 8 units back.
- **Lights:** soft ambient plus one gentle directional light. No heavy shadows.
- **Floor:** a faint grid under the scene.
- **Shapes:** simple primitives only (spheres, cubes, planes, arrows). Cubes with sizes around `0.2`, spheres around `0.14`.
- **Interaction:** drag to rotate; optional auto-rotate checkbox; touch-friendly (`touch-action: none` on the canvas).
- **Scale:** centre the data and scale it to fit a radius of about 2.2 units so every scene looks balanced.
- **Rebuild pattern:** a `build()` function creates the shapes when data changes, and a `paint()` function updates colours and positions when controls change.

## 8. Writing pattern

- Short sentences and everyday words; explain any jargon in one line.
- Each section: 2 to 3 short paragraphs, then a **Try this** box with 2 to 3 actions.
- Add a **note** whenever the picture simplifies reality.
- Show a cost for every fix.
- Link sources (papers, Wikipedia) inline, and list them in **Read more**. Check every link before publishing.
- Only state facts the data supports, and word predictions as 'check whether…'.

## 9. Starter CSS (copy into any new explainer)

```css
:root{color-scheme:light;--fg:#1a1a1a;--mut:#6b6b6b;--line:#e8e8e8;--bg:#fff;--panel:#fafafa;--a:#2563eb;--b:#e8590c}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--fg);font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif}
main{max-width:760px;margin:0 auto;padding:48px 20px 96px}
h1{font-size:2rem;line-height:1.2;margin:0 0 8px}
h2{font-size:1.25rem;margin:56px 0 8px}
p{color:#333;margin:0 0 16px}
.lead{color:var(--mut);font-size:1.1rem}
a{color:var(--a)}
.fig{border:1px solid var(--line);border-radius:12px;background:var(--panel);overflow:hidden;margin:20px 0}
canvas{display:block;width:100%;height:360px;cursor:grab;touch-action:none}
.ctl{display:flex;flex-wrap:wrap;gap:14px 24px;padding:14px 16px;border-top:1px solid var(--line);background:var(--bg);font-size:.9rem;align-items:center}
.ctl label{display:flex;gap:8px;align-items:center;color:var(--mut)}
.ctl input[type=range]{width:130px;accent-color:var(--fg)}
button{font:inherit;font-size:.9rem;border:1px solid var(--fg);background:var(--bg);color:var(--fg);border-radius:8px;padding:5px 12px;cursor:pointer}
button:hover{background:var(--fg);color:var(--bg)}
.stats{padding:10px 16px;font-size:.9rem;color:var(--mut);border-top:1px solid var(--line);font-variant-numeric:tabular-nums}
.stats b{color:var(--fg)}
.dot{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:4px}
.note{font-size:.85rem;color:var(--mut)}
.try{border-left:3px solid var(--fg);padding:2px 0 2px 14px;margin:0 0 16px;font-size:.95rem;color:#333}
.try ul{margin:4px 0 0;padding-left:18px}
.refs{font-size:.92rem;color:#333;padding-left:18px}
.refs li{margin-bottom:6px}
.refs span{color:var(--mut)}
```

## 10. Consistency checklist

- [ ] Single column, 760px max, centred, with the standard padding.
- [ ] System font stack, 16px body, heading sizes as listed.
- [ ] Only the palette above; two accent colours at most, each with one meaning.
- [ ] Every figure uses the card structure: canvas, controls, readouts.
- [ ] Every section has the same shape: paragraphs, Try-this, figure, note.
- [ ] Spacing values come from the scale; no one-off numbers.
- [ ] Works at 380px wide with no sideways scrolling.
- [ ] Libraries pinned, links checked, claims match the data.

## 11. Master prompt for new explainers

```
Build a new single-file explainer web page about [TOPIC] using the Explainer Style
and Web Architecture Blueprint exactly: light mode, system font stack, 760px centred
column, the listed spacing, type sizes and colour palette, and the figure card
structure (canvas, controls row, readout row). Use two accent colours with fixed
meanings: [A = ...] and [B = ...]. Every visualization needs its own controls and a
live readout. Follow the section pattern (paragraphs, Try-this box, figure, note),
plain friendly writing, cited sources in a Read-more list, and an honest closing
section. Start from the starter CSS and change nothing in it unless I ask.
```
