from pathlib import Path
import json

ROOT = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")


def replace_text(rel, pairs):
    path = ROOT / rel
    if not path.exists():
        return
    text = path.read_text(encoding="utf-8")
    for old, new in pairs:
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8", newline="\n")


def main():
    sitemap = ROOT / "sitemap.json"
    data = json.loads(sitemap.read_text(encoding="utf-8"))
    data["desc"] = "城会玩2.0 - 点亮城市，收集旅行角色卡"
    for rule in data.get("rules", []):
        rule["desc"] = "城会玩2.0 - 点亮城市，收集旅行角色卡"
    sitemap.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8", newline="\n")

    for rel in ["pages/group/group.wxml", "package-others/pages/group/group.wxml"]:
        replace_text(rel, [
            ("创建或加入一个群组，和朋友一起记录旅行足迹吧", "创建或加入一个群组，和朋友一起点亮城市吧")
        ])

    for rel in ["pages/group/group.js", "package-others/pages/group/group.js"]:
        replace_text(rel, [
            ("'「' + groupInfo.name + '」的旅行足迹'", "'「' + groupInfo.name + '」的城市图鉴'")
        ])

    replace_text("pages/city-detail/city-detail.wxml", [
        ("<text class=\"tab-text\">旅行足迹</text>", "<text class=\"tab-text\">城市记录</text>")
    ])
    replace_text("pages/profile/profile.wxml", [
        ("<view class=\"stats-title\">旅行足迹</view>", "<view class=\"stats-title\">城市图鉴</view>")
    ])
    replace_text("pages/launch/launch.js", [
        ("用于同步旅行足迹和角色卡", "用于同步城市足迹和角色卡")
    ])


if __name__ == "__main__":
    main()
