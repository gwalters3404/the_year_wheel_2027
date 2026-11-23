# The Year Wheel (web app)

The interactive, deployable version of the Year Wheel: 12,669 cultural moments in 2027 on one wheel, built with Next.js for Vercel. The original single-page version is in the repository root and is not changed by anything here.

## Deploy to Vercel

1. In Vercel, choose **Add New → Project** and import this repository.
2. Set **Root Directory** to `web`. Vercel detects Next.js and fills in the rest.
3. Press **Deploy**. No environment variables are needed.

Vercel builds the production site from the repository's default branch and makes a preview site for every other branch. To publish this work as the production site, merge its branch into the default branch, or change the production branch under **Settings → Environments → Production**.

## Run it locally

```bash
npm install
```

```bash
npm run dev
```

Then open `http://localhost:3000`. Use `npm run build` followed by `npm run start` to run the production build.

## What is new compared with the original page

| Feature | What it does |
|---|---|
| Month zoom | Click a month name on the wheel, or a month button under it, and the wheel opens out to show that month day by day. "Year" or Escape zooms back out. |
| Drag to scrub | Hold and drag around the wheel with a mouse to sweep through days. |
| Cell tooltips | Hovering a cell names the day, the ring and the first few moments in it. |
| Day slider | The slider under the wheel scrubs to any day of the year. |
| Surprise me | Jumps to a random day. |
| Coming up | Lists the next holidays and short events after the selected day, with a countdown in days. |
| My list | The star beside any moment saves it in this browser. The list can be downloaded as a calendar file. |
| A page for every day | Each day has its own address, such as `/day/07-04`, with its own title, description and link-preview image. "Copy link" copies it. |

Everything from the original page is kept: the ten rings (ordered from fewest moments at the rim, Tech, to most at the hub, Observances), hide/show and Isolate, keyword search, date and range search, See all, and Explore today's date.

## Addresses

| Address | Returns |
|---|---|
| `/` | The wheel, opened on today's month and day |
| `/day/MM-DD` | The wheel opened on that day (365 pages, built ahead of time) |
| `/day/MM-DD/opengraph-image` | The link-preview image for that day |
| `/api/day/MM-DD` | Everything on that day as JSON |
| `/api/ics?ids=35,558` | The chosen moments as an all-day calendar file (`.ics`) |
| `/data.json` | The full dataset the wheel loads |

## Where things are

| Path | What it is |
|---|---|
| `app/` | Pages, the link-preview image and the API routes |
| `components/YearWheel.tsx` | The page: filters, searches, lists, saved list |
| `components/WheelCanvas.tsx` | The wheel drawing, zoom animation and pointer handling |
| `lib/moments.ts` | Record format, ring definitions and 2027 date math |
| `data/moments.json` | The dataset, a copy of `data.json` in the repository root |

If the data changes, update `data/moments.json`. Saved lists store record positions, so reordering records will change what a saved list points to.
