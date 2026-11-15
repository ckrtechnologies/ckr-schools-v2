# School Karma seed data — runbook for scheduled runs

Goal: 100 schools per state/UT (36 regions, 3,600 total), saved as JSON batches of 10 in this folder.
State of play lives in `progress.json`. Read it first, update it after every batch.

## Parallel workers
Several scheduled tasks (workers) run at once. Each worker's prompt names the states it owns, in order. A worker only ever creates batch files for its own states, so workers never write the same file.
`progress.json` and `dashboard/*.json` are generated — never edit them by hand. Run `python3 update_progress.py` (from this folder, via device_bash) to rebuild them from the batch files.

## Each run
1. Run `python3 update_progress.py`. If it reports all_done=True and the file ALL_DONE_NOTIFIED exists, stop.
2. Pick the work: the first of YOUR states (from your prompt) whose status in progress.json is not Done/Exhausted. Read `notes/<code>.md` for that state if present.
3. Collect existing slugs from every `*-schools-batch-*.json` file here, so no school is repeated (other workers' files included).
4. Build up to 3 batches this run (stop earlier if the run has used about 50 minutes). When a state reaches 100, move on to your next state. For each batch:
   a. Choose 10 private/independent schools in the state's `focus_cities` (spread across cities and school groups; at most 3 from one group per batch). Sources: CBSE SARAS (saras.cbse.gov.in AffiliatedList/AfflicationDetails/<no>), CISCE, school websites, Wikipedia/Wikimedia Commons. Tip: amityschools.in/<campus>/infrastructure-facilities pages are cleanly labelled (campuses incl. gurugram-46, gurugram-43, navi-mumbai, mohali, raipur, gwalior, mayur-vihar-phase-1, pushp-vihar).
   b. For each school confirm the official website (and, for CBSE, the affiliation number on SARAS when findable).
   c. Images, using Claude in Chrome:
      - `logo_url`: official crest/logo (school site or Wikimedia/Wikipedia). Direct image URL.
      - `hero_image_url`: campus/building photo.
      - `gallery_images`: 3–5 `{title, category, url}` where `category` is one of Campus, Sports, Academics, Infrastructure, Arts, Transport. Titles must describe what the photo really shows (use labelled infrastructure pages, alt text/captions, file names, or a contact-sheet screenshot to identify unlabelled photos).
      - Never use event photos centred on children's faces, stock photos, award banners or marketing posters. Never guess or construct a URL you have not seen load.
      - If a school has no usable facility photos, leave `gallery_images: []` and note it; if it has no logo or hero, replace the school.
   d. Load-test every image URL in Chrome on https://example.com/ (new Image() onload, naturalWidth > 0). Drop or replace any that fail.
   e. Text fields: write from what the school's own pages say. `about` 50–100 words, `tagline` 15–20 words. NO ESTIMATES: min_fee, max_fee, student_count_badge, teacher_count_badge and student_teacher_ratio stay null unless taken from the school's own published document (CBSE mandatory public disclosure, fee structure PDF, prospectus, or state fee-regulator filing). When filled, record the source URL per school in notes/<file>-schools-batch-NN.md. Fee rule: min_fee = lowest class annual tuition, max_fee = highest class annual tuition (tuition only, excluding admission/transport). established_year only if stated by the school or SARAS, else null. `avg_rating: null`, `review_count: 0` (no invented ratings). Unknown contact fields stay `null`.
   f. Save as `<file_prefix>-schools-batch-NN.json` (file_prefix from states_config.json; NN = next free two-digit number for that state). Same schema/field order as `delhi-schools-batch-01.json`. Optional one-line batch note in `notes/<file_prefix>-schools-batch-NN.md`.
   g. Run `python3 update_progress.py`.
5. A state is exhausted when two full passes over its cities and SARAS lists yield no more schools that meet the bar: write a line starting `EXHAUSTED:` with the reason into `notes/<code>.md`, then run the script.
6. Update the dashboard (see below).
7. Run `python3 update_progress.py --claim-notify`. Only if it prints CLAIMED: send the completion summary message.

## Schema (field order)
slug, name, affiliation_board (CBSE|ICSE|IB|CAMBRIDGE|STATE_BOARD), board_affiliation_number, school_code, official_email, official_phone, website, address, city, state, pincode, logo_url, hero_image_url, gallery_images, theme_color, accent_color, motto, tagline, about, established_year, min_fee, max_fee, fee_period ("ANNUAL"), grades_offered, facilities (6–10), admission_status ("Admissions Open 2026-27"), student_count_badge, teacher_count_badge, student_teacher_ratio, avg_rating, review_count.
`slug`: lowercase, URL-safe, unique, includes locality + city (e.g. `dps-noida-sector-30`).

## Dashboard
URL in `states_config.json` → `dashboard_url` (Claude "Data" artifact). After `update_progress.py`, the files to upload are `dashboard/states.json` and `dashboard/batches.json`.
1. Upload both with the Artifact tool (publish, `asset: true`, `url` = dashboard_url, `file_path` = the file's absolute path on this computer, staged into the cloud workspace first if the tool needs a local file).
2. ArtifactData: `get` datasets/states and datasets/batches for their versions and current `source.url`, then `update` each with `source.url` = the new `/_blob/<id>`, `updated: {at, by: "Claude"}`, `edit: {via: "claude", at}` (pin `if_version`; on a version conflict re-read and retry — another worker may have just updated it).
3. Delete the blob that was replaced (Artifact delete with `path` = old blob id) — only the one you replaced.

## Verified-only fields (strict, 15 Nov 2026)
- admission_status: always null (we cannot confirm a school's admission status).
- motto: only the school's real motto as printed on its own site, crest or Wikipedia; else null. Never write one.
- grades_offered: only as stated by the school or SARAS (e.g. "Nursery to XII"); else null.
- tagline is our marketing copy and may be written; about must only restate what the school's pages say (no reputation claims).
