from pathlib import Path
import json

ROOT = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")


def replace_if_exists(rel, pairs):
    path = ROOT / rel
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8", newline="\n")


def main():
    sitemap = ROOT / "sitemap.json"
    if sitemap.exists():
        data = json.loads(sitemap.read_text(encoding="utf-8"))
        if isinstance(data.get("rules"), list) and data["rules"]:
            data["rules"][0]["desc"] = "城会玩2.0 - 点亮城市，收集旅行角色卡"
        sitemap.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")

    for rel in ["pages/settings/settings.js", "package-others/pages/settings/settings.js"]:
        replace_if_exists(rel, [
            ("title: '关于旅行足迹'", "title: '关于城会玩2.0'"),
            (
                "content: '版本：v1.0.0\\n\\n用脚步丈量世界，用照片记录美好。\\n\\n旅行足迹是一款记录旅行足迹的小程序，支持点亮中国地图、收集角色卡、与好友共享探索之旅。'",
                "content: '版本：v2.0.0\\n\\n点亮城市，收集旅行角色卡。\\n\\n城会玩2.0是一款城市探索小程序，支持点亮中国地图、解锁地域角色卡、管理旅行相册，并和朋友共享探索进度。'"
            )
        ])

    for rel in ["pages/settings/settings.wxml", "package-others/pages/settings/settings.wxml"]:
        replace_if_exists(rel, [
            ("旅行足迹 v{{version}}", "城会玩2.0 v{{version}}")
        ])

    replace_if_exists("pages/index/index.wxml", [
        ("记录你的旅行足迹", "点亮城市，收集旅行角色卡")
    ])


if __name__ == "__main__":
    main()
