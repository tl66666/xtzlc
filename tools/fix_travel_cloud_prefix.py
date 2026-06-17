from pathlib import Path


ROOT = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")
OLD_PREFIX = "cloud://travel-footprint-7g4vk7liff6e66af-1351495195"
NEW_PREFIX = "cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269"


def read_text(path):
    for encoding in ("utf-8", "utf-8-sig", "gbk"):
        try:
            return path.read_text(encoding=encoding), encoding
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("unknown", b"", 0, 1, "Unable to decode file")


def main():
    if not ROOT.exists():
        raise SystemExit(f"Project not found: {ROOT}")

    changed = []
    for path in ROOT.rglob("*"):
        if "node_modules" in path.parts:
            continue
        if path.suffix.lower() not in {".js", ".json", ".wxml", ".wxss", ".md"}:
            continue

        text, encoding = read_text(path)
        if OLD_PREFIX not in text:
            continue

        path.write_text(text.replace(OLD_PREFIX, NEW_PREFIX), encoding=encoding)
        changed.append(path.relative_to(ROOT).as_posix())

    print("changed files:")
    for item in changed:
        print("-", item)
    print(f"total: {len(changed)}")


if __name__ == "__main__":
    main()
