import re
from pathlib import Path


ROOT = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")
CLOUD_PREFIX = "cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269"


def read_text(path):
    for encoding in ("utf-8", "utf-8-sig", "gbk"):
        try:
            return path.read_text(encoding=encoding), encoding
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"Unable to decode {path}")


def write_text(path, text, encoding):
    path.write_text(text, encoding=encoding)


def replace_load_cards(rel, cities_require):
    path = ROOT / rel
    text, enc = read_text(path)
    new_func = f"""loadCards: function() {{
    var visitedProvinces = this.deriveVisitedProvinces();
    var cards = [];
    var collectedCount = 0;
    var cloudPaths = [];

    for (var i = 0; i < provinces.length; i++) {{
      var province = provinces[i];
      var character = charactersData.getCharacter(province.id);
      var rarityColor = charactersData.getRarityColor(character.rarity);
      var isCollected = visitedProvinces.indexOf(province.id) !== -1;
      var cloudPath = '{CLOUD_PREFIX}/cards/' + province.id + '.png';

      if (isCollected) {{
        collectedCount++;
      }}

      cloudPaths.push(cloudPath);
      cards.push({{
        provinceId: province.id,
        provinceName: province.name,
        name: character.name,
        title: character.title,
        rarity: character.rarity,
        skill: character.skill,
        description: character.description,
        quote: character.quote,
        attributes: character.attributes,
        rarityColor: rarityColor,
        isCollected: isCollected,
        imagePath: cloudPath
      }});
    }}

    this.setData({{
      cards: cards,
      collectedCount: collectedCount
    }});

    this.loadCloudImages(cards, cloudPaths);
  }},"""
    text2, count = re.subn(
        r"loadCards: function\(\) \{.*?\n  \},\n\n  //",
        new_func + "\n\n  //",
        text,
        flags=re.S,
    )
    if count != 1:
        raise RuntimeError(f"loadCards replace failed for {rel}: {count}")
    write_text(path, text2, enc)
    print("fixed loadCards:", rel)


def improve_unlock_js(rel):
    path = ROOT / rel
    text, enc = read_text(path)
    # Ensure the result stage actually reaches phase 5, so attributes, skill and quote become visible.
    old = """      // 妫€鏌ユ槸鍚︽湁鏂版垚灏?
      self.checkNewAchievements();
    }, 4000);"""
    if old in text:
        text = text.replace(old, """      setTimeout(function() {
        self.setData({ phase: 5 });
      }, 600);

      self.checkNewAchievements();
    }, 4000);""")
    else:
        text = text.replace(
            "      self.checkNewAchievements();\n    }, 4000);",
            "      setTimeout(function() {\n        self.setData({ phase: 5 });\n      }, 600);\n\n      self.checkNewAchievements();\n    }, 4000);",
        )

    # Remove the dizzy shake effect while keeping glow/particle feedback.
    text = text.replace(
        """      // UR绋€鏈夊害瑙﹀彂灞忓箷闇囧姩
      if (rarity === 'UR') {
        self.setData({ screenShake: true });
        setTimeout(function() {
          self.setData({ screenShake: false });
        }, 500);
      }
""",
        "",
    )
    write_text(path, text, enc)
    print("improved unlock js:", rel)


def patch_wxml_text_bindings(rel):
    path = ROOT / rel
    text, enc = read_text(path)
    text = text.replace("銆寋{character.title}}銆?/view>", "《{{character.title}}》</view>")
    text = text.replace("銆寋{character.title}}銆?/text>", "《{{character.title}}》</text>")
    text = text.replace("銆寋{character.skill}}銆?/text>", "《{{character.skill}}》</text>")
    text = text.replace("绋€鏈夊害锛歿{character.rarity}}</text>", "稀有度：{{character.rarity}}</text>")
    text = text.replace("鏌ョ湅瑙掕壊鍗?/view>", "查看角色卡</view>")
    write_text(path, text, enc)
    print("patched wxml:", rel)


def main():
    replace_load_cards("pages/cards/cards.js", "../../utils/cities.js")
    replace_load_cards("package-cards/pages/cards/cards.js", "../../../utils/cities.js")
    improve_unlock_js("pages/unlock-card/unlock-card.js")
    improve_unlock_js("package-cards/pages/unlock-card/unlock-card.js")
    patch_wxml_text_bindings("pages/card-detail/card-detail.wxml")
    patch_wxml_text_bindings("package-cards/pages/card-detail/card-detail.wxml")
    patch_wxml_text_bindings("pages/unlock-card/unlock-card.wxml")
    patch_wxml_text_bindings("package-cards/pages/unlock-card/unlock-card.wxml")


if __name__ == "__main__":
    main()
