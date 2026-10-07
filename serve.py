#!/usr/bin/env python3
"""
serve.py
One-click local server and browser launcher for Cyber Maze: Nemesis AI Chaser.
Requires zero external pip dependencies - uses Python's standard library.
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def run():
    port = PORT
    for p in range(PORT, PORT + 20):
        try:
            with socketserver.TCPServer(("", p), Handler) as httpd:
                url = f"http://localhost:{p}"
                print("=" * 60)
                print("  CYBER MAZE: NEMESIS AI CHASER")
                print("  Theme: Midnight Navy, Cobalt Blue, Bright Red")
                print(f"  Serving locally at: {url}")
                print("=" * 60)
                print("Opening game in default web browser...")
                webbrowser.open(url + "/index.html")
                print("Press Ctrl+C to stop the server.")
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == "__main__":
    try:
        run()
    except KeyboardInterrupt:
        print("\nServer stopped. Thanks for playing Cyber Maze!")
        sys.exit(0)
