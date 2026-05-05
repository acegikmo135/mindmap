"""
send_test_notification.py
─────────────────────────
Sends a test push notification to ALL subscribed users via OneSignal REST API.
Fetches actual delivery stats after 3 seconds (recipients count is async in OneSignal).

Usage:
    python send_test_notification.py
    python send_test_notification.py --title "Hi" --message "Custom message"
    python send_test_notification.py --user-id <supabase-uuid>
"""

import argparse
import json
import os
import sys
import time
import urllib.request
import urllib.error
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

APP_ID  = os.getenv("VITE_ONESIGNAL_APP_ID",  "e2143e70-45e8-4b33-b361-77664a1b3f21")
API_KEY = os.getenv("ONESIGNAL_API_KEY",       "os_v2_app_4ikd44cf5bfthm3bo5teugz7efyybgbnt2su2ufrpj73irf246l4neyttycwtw5cdzn2n2tdbqfdl2xato52dicap5d2xlzszryk4ba")

HEADERS = {
    "Content-Type":  "application/json",
    "Authorization": f"Key {API_KEY}",
}


def _request(method: str, url: str, payload: dict | None = None) -> dict:
    data = json.dumps(payload).encode() if payload else None
    req  = urllib.request.Request(url, data=data, method=method, headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def get_notification_stats(notif_id: str) -> dict:
    url = f"https://api.onesignal.com/notifications/{notif_id}?app_id={APP_ID}"
    req = urllib.request.Request(url, method="GET", headers=HEADERS)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def send(title: str, message: str, user_id: str | None = None) -> None:
    if not APP_ID or not API_KEY:
        print("❌  VITE_ONESIGNAL_APP_ID or ONESIGNAL_API_KEY not set.")
        sys.exit(1)

    if user_id:
        target      = {"include_aliases": {"external_id": [user_id]}, "target_channel": "push"}
        target_desc = f"user {user_id[:8]}..."
    else:
        # Use include_aliases with all known players instead of segment,
        # because OneSignal v16 SDK sets notification_types=null in the legacy
        # players API which excludes them from "Total Subscriptions" segment.
        # Fetching all players and sending by external_id bypasses this.
        players_resp = _request("GET", f"https://api.onesignal.com/players?app_id={APP_ID}&limit=50")
        players = players_resp.get("players", [])
        ext_ids = list({p["external_user_id"] for p in players
                        if p.get("external_user_id") and not p.get("invalid_identifier")})
        if ext_ids:
            target      = {"include_aliases": {"external_id": ext_ids}, "target_channel": "push"}
            target_desc = f"ALL players by external_id ({len(ext_ids)} users)"
        else:
            target      = {"included_segments": ["Total Subscriptions"]}
            target_desc = "ALL subscribed users (segment fallback)"

    payload = {
        "app_id":   APP_ID,
        "headings": {"en": title},
        "contents": {"en": message},
        "url":      "https://mindmap-chi-jade.vercel.app",
        **target,
    }

    print(f"\n{'='*58}")
    print(f"  OneSignal Test Notification")
    print(f"{'='*58}")
    print(f"  Target  : {target_desc}")
    print(f"  Title   : {title}")
    print(f"  Message : {message}")
    print(f"  Sent at : {datetime.now().strftime('%H:%M:%S')}")
    print(f"{'='*58}")

    try:
        body     = _request("POST", "https://api.onesignal.com/notifications", payload)
        notif_id = body.get("id", "")

        if not notif_id:
            errors = body.get("errors", [body])
            print(f"  ✗ Send failed:")
            for e in errors:
                print(f"    → {e}")
            print(f"{'='*58}\n")
            sys.exit(1)

        print(f"  ✅ Queued  | ID: {notif_id}")
        print(f"  ⏳ Fetching delivery stats in 3 seconds...")

        time.sleep(3)

        stats      = get_notification_stats(notif_id)
        sent       = stats.get("successful",  0)
        failed     = stats.get("failed",      0)
        errored    = stats.get("errored",     0)
        remaining  = stats.get("remaining",   0)
        converted  = stats.get("converted",   0)

        print(f"{'='*58}")
        print(f"  Delivery Report")
        print(f"{'='*58}")
        print(f"  ✅ Delivered  : {sent}")
        print(f"  ❌ Failed     : {failed + errored}")
        print(f"  ⏳ Pending    : {remaining}")
        print(f"  🎯 Clicked    : {converted}")

        if sent == 0 and failed > 0:
            print()
            print("  ⚠  Push endpoint is dead (FCM rejected it).")
            print("     Clear site data in Chrome DevTools → Application → Storage")
            print("     → Subscribe again in the app → run this script again.")
        elif sent == 0 and remaining == 0:
            print()
            print("  ⚠  0 subscribers. Open the app and allow notifications first.")
        elif sent > 0:
            print()
            print(f"  🔔 Notification delivered to {sent} device(s)!")

        print(f"{'='*58}\n")

    except urllib.error.HTTPError as e:
        err = json.loads(e.read())
        print(f"  ✗ HTTP {e.code}: {err}")
        print(f"{'='*58}\n")
        sys.exit(1)


def main():
    parser = argparse.ArgumentParser(description="Send OneSignal test push notification")
    parser.add_argument("--title",   default="CogniStruct 🔔",
                        help="Notification title")
    parser.add_argument("--message", default=f"Test at {datetime.now().strftime('%H:%M:%S')} — notifications are working!",
                        help="Notification body")
    parser.add_argument("--user-id", default=None, dest="user_id",
                        help="Target a specific user by Supabase UUID (default: all subscribers)")
    args = parser.parse_args()
    send(args.title, args.message, args.user_id)


if __name__ == "__main__":
    main()
