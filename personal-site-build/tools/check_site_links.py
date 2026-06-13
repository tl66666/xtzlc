from html.parser import HTMLParser
from pathlib import Path


ROOT = Path(r"C:\Users\唐乐\Desktop\个人网站")


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []

    def handle_starttag(self, tag, attrs):
        attr = dict(attrs)
        for key in ("src", "href"):
            value = attr.get(key)
            if value and value.startswith("assets/"):
                self.refs.append(value)


parser = AssetParser()
parser.feed((ROOT / "index.html").read_text(encoding="utf-8"))
missing = []
for ref in sorted(set(parser.refs)):
    exists = (ROOT / ref).exists()
    print(ref, exists)
    if not exists:
        missing.append(ref)

if missing:
    raise SystemExit("missing assets: " + ", ".join(missing))
