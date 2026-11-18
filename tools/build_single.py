#!/usr/bin/env python3
"""Bundle index.html + css/*.css + js/**/*.js into one self-contained file.

Usage:  python3 tools/build_single.py [output.html]
Default output: dist/dwelio.single.html

Useful for hosting on platforms that accept a single HTML file.
Three.js and the web fonts are still loaded from their CDNs.
"""
import re, sys, pathlib

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / "dist" / "dwelio.single.html"
html = (root / "index.html").read_text(encoding="utf-8")

def inline_css(m):
    return "<style>\n" + (root / m.group(1)).read_text(encoding="utf-8") + "\n</style>"

def inline_js(m):
    return "<script>\n" + (root / m.group(1)).read_text(encoding="utf-8") + "\n</script>"

# local stylesheets and scripts only (CDN links stay as they are)
html = re.sub(r'<link rel="stylesheet" href="(css/[^"]+)">', inline_css, html)
html = re.sub(r'<script src="(js/[^"]+)"></script>', inline_js, html)

# the favicon and manifest are optional extras in single-file mode
html = re.sub(r'<link rel="manifest"[^>]*>\n?', "", html)
html = re.sub(r'<link rel="icon"[^>]*>\n?', "", html)

out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(html, encoding="utf-8")
print(f"wrote {out.relative_to(root) if out.is_relative_to(root) else out} ({len(html)//1024} KB)")
