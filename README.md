# g_walt.github.io

# The Year Wheel

An interactive wheel of 12,669 cultural moments in 2027: holidays, events, industry dates, observances, and famous births and deaths. The 365 days run clockwise as spokes, and ten lettered rings run from the rim to the hub, one per kind of moment. A coloured cell means something of that kind is happening that day.

The wheel layout is inspired by "Colours in Cultures" by David McCandless and AlwaysWithHonor for Information is Beautiful.

## Run it

The page loads `data.json` with `fetch`, so it has to be served over HTTP. Opening `index.html` straight from disk will not work.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`. There is no build step, framework or library.

## Using the wheel

| Action | Result |
|---|---|
| Open the page | Today's month and day are selected and marked in yellow on the wheel |
| Explore today's date | Returns to today's date from anywhere |
| Hover a spoke | The hub reads out that day |
| Click a spoke | Opens the day in the numbered list |
| Arrow keys (wheel focused) | Left and right move one day, up and down move one week |
| ← → buttons | Previous or next day; in a range, the previous or next month or block |
| Click a color in the key | Hides or shows that ring |
| Isolate, next to a ring in the key | Shows only that ring; "Show all" brings the rest back |
| See all, next to the Today marker | Lists every moment in the rings that are switched on, for the whole year, and hides the day heading |
| Keyword search | Filters the wheel and lists matches by name, category or location |
| Find a date or range | Jumps to a date, or lists everything that overlaps a range |

The date field accepts:

- a month: `January`, `sept`
- a date: `Mar 3`, `3/3`, `15 august`
- a quarter: `Q2`
- a range: `Jun 1 to Jun 14`, `Mar 3-9`, `jan to mar`

The two search fields combine, so `pizza` with `February` lists the pizza moments in February. Clicking a spoke, or pressing "Explore today's date", clears both and turns "See all" off.

Search results, date ranges and "See all" list the first 30 entries in each ring, with a "Show all" button for the rest.

The selected day is kept in the URL as `#d-MM-DD`, for example `#d-07-04`. A link with a day in it opens on that day; without one, the page opens on today.

## The rings

| Ring | Moments | Records |
|---|---|---|
| A | Holidays | 63 |
| B | Music events | 99 |
| C | Film events and releases | 121 |
| D | Sports events | 197 |
| E | Arts and culture events | 211 |
| F | Tech events | 52 |
| G | Industry events and awards | 302 |
| H | Observances | 7,381 |
| I | Famous births | 3,231 |
| J | Famous deaths | 1,012 |

A cell is filled when at least one moment of that kind falls on the day, including events still running; it does not show how many. Week- and month-long observances are counted on the day they start, and the day list shows them under "also running".

## Files

| File | What it is |
|---|---|
| `index.html` | The wheel: markup, styles and view logic in one file |
| `common.js` | Data loading, date math and the per-day index |
| `data.json` | The dataset, one positional 10-element array per record |
| `moments_2027.csv` | The same records as CSV with a header row |
| `Cultural_Moments_Encyclopedia_2027.xlsx` | The source workbook, one tab per content type |
| `REBUILD_SPEC.md` | Record format, status vocabulary and date math, plus the original three views |
| `common.css` | Shared styles from the original views; the wheel no longer uses it |

`REBUILD_SPEC.md` describes the first version of the wheel (five rings, light theme). Its sections on the dataset, statuses and date math still apply; its wheel geometry and styling do not.

## Data notes

- Each record has a status: Confirmed, Listed, Calculated, Estimated, TBD or Not held in 2027. Dates were checked on Nov 22, 2026.
- Estimated dates are projected from the 2025 pattern or depend on a moon sighting. Treat them as provisional.
- 270 records have no date. They appear in keyword search results and in "See all", but not on the wheel.
- 49 births had no field in the source. Their fields (for example "Hockey Player") were added by hand in `data.json`, the CSV and the workbook, and are not from the source. Three births still have none: Zen Shimada, Mark Johnson and Moses Hacmon.
- A few items start in late 2026 or end in early 2028. They are clamped to the edges of the wheel, and their labels show the true dates.
