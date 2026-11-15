#!/usr/bin/env python3
"""Recompute progress.json and dashboard/*.json from the batch files. Safe to run any time, by any worker.
Usage: python3 update_progress.py              -> rebuild
       python3 update_progress.py --claim-notify -> prints CLAIMED once (first caller) when all_done, else NO"""
import json, glob, os, re, sys, datetime
os.chdir(os.path.dirname(os.path.abspath(__file__)))
cfg = json.load(open("states_config.json"))
by_prefix = {s["file_prefix"]: s for s in cfg["states"]}
def note(path):
    try: return open(path).read().strip()
    except FileNotFoundError: return ""
log, counts = [], {s["code"]: dict(collected=0, gallery=0, batches=0) for s in cfg["states"]}
for f in sorted(glob.glob("*-schools-batch-*.json")):
    m = re.match(r"(.+)-schools-batch-(\d+)\.json$", f)
    if not m or m.group(1) not in by_prefix: continue
    st = by_prefix[m.group(1)]
    try: rows = json.load(open(f))
    except Exception: continue
    n = len(rows); g = sum(1 for r in rows if len(r.get("gallery_images") or []) >= 3)
    c = counts[st["code"]]; c["collected"] += n; c["gallery"] += g; c["batches"] += 1
    date = datetime.datetime.fromtimestamp(os.path.getmtime(f)).strftime("%Y-%m-%d")
    log.append({"batch": f"{st['code'].upper()}-{m.group(2)}", "state": st["state"], "file": f, "schools": n,
                "urls_verified": n, "gallery_complete": g, "date": date, "status": "Delivered",
                "notes": note(f"notes/{f[:-5]}.md")})
states = []
for s in cfg["states"]:
    c = counts[s["code"]]; n_ = note(f"notes/{s['code']}.md")
    exhausted = "EXHAUSTED" in n_
    status = "Done" if c["collected"] >= s["target"] else "Exhausted" if exhausted else "In progress" if c["collected"] else "Not started"
    states.append(dict(s, collected=c["collected"], urls_verified=c["collected"], gallery_complete=c["gallery"],
                       imported=0, batches_done=c["batches"], status=status, notes=n_))
all_done = all(s["status"] in ("Done", "Exhausted") for s in states)
prog = {"goal": "100 verified schools per state/UT, 3,600 total", "dashboard_url": cfg["dashboard_url"],
        "total_collected": sum(s["collected"] for s in states), "all_done": all_done,
        "all_done_notified": os.path.exists("ALL_DONE_NOTIFIED"), "batch_log": log, "states": states}
json.dump(prog, open("progress.json", "w"), indent=1, ensure_ascii=False)
keys = ["order","state","type","wave","focus_cities","feasibility","target","collected","urls_verified","gallery_complete","imported","batches_done","status"]
json.dump([{k: s[k] for k in keys} for s in states], open("dashboard/states.json", "w"), indent=1, ensure_ascii=False)
json.dump([{k: v for k, v in b.items() if k != "file"} for b in log], open("dashboard/batches.json", "w"), indent=1, ensure_ascii=False)
if "--claim-notify" in sys.argv:
    if not all_done: print("NO"); sys.exit()
    try:
        fd = os.open("ALL_DONE_NOTIFIED", os.O_CREAT | os.O_EXCL | os.O_WRONLY); os.write(fd, datetime.datetime.now().isoformat().encode()); os.close(fd); print("CLAIMED")
    except FileExistsError: print("NO")
else:
    print(f"total={prog['total_collected']} all_done={all_done}")
