import re
from pathlib import Path


ROOT = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")


def read_text(path):
    for encoding in ("utf-8", "utf-8-sig", "gbk"):
        try:
            return path.read_text(encoding=encoding), encoding
        except UnicodeDecodeError:
            continue
    raise RuntimeError(f"Unable to decode {path}")


def write_text(path, text, encoding):
    path.write_text(text, encoding=encoding)


def replace_card_detail(rel):
    path = ROOT / rel
    text, enc = read_text(path)
    new_onload = """onLoad: function(options) {
    var provinceId = options.provinceId || '';
    var province = provincesData.getProvinceById(provinceId);
    
    if (province) {
      var character = charactersData.getCharacter(provinceId);
      var rarityColor = charactersData.getRarityColor(character.rarity);
      var app = getApp();
      var visited = app.globalData.visitedProvinces || [];
      
      var attrs = character.attributes;
      var totalScore = Math.round((attrs.culture + attrs.fashion + attrs.food + attrs.history) / 4);
      
      var self = this;
      var cloudPath = 'cloud://cloud1-d9gshoz5s40d02b42.636c-cloud1-d9gshoz5s40d02b42-1442414269/cards/' + provinceId + '.png';

      self.setData({
        provinceId: provinceId,
        province: province,
        character: character,
        rarityColor: rarityColor,
        totalScore: totalScore,
        isUnlocked: visited.indexOf(provinceId) !== -1,
        cardImage: ''
      });
      
      cloudImage.resolve(cloudPath, function(imageUrl) {
        if (imageUrl) {
          self.setData({ cardImage: imageUrl });
        }
      });
    }
  },"""
    text2, count = re.subn(
        r"onLoad: function\(options\) \{.*?\n  \},\n\n  //",
        new_onload + "\n\n  //",
        text,
        flags=re.S,
    )
    if count != 1:
        raise RuntimeError(f"card detail onLoad replace failed for {rel}: {count}")
    write_text(path, text2, enc)
    print("fixed card detail:", rel)


def replace_unlock_helper(rel):
    path = ROOT / rel
    text, enc = read_text(path)
    helper = """getCloudImageUrl: function(cloudPath, callback) {
    cloudImage.resolve(cloudPath, callback);
  },"""
    text2, count = re.subn(
        r"getCloudImageUrl: function\(cloudPath, callback\) \{.*?\n  \},\n\n  //",
        helper + "\n\n  //",
        text,
        flags=re.S,
    )
    if count != 1:
        raise RuntimeError(f"unlock helper replace failed for {rel}: {count}")
    write_text(path, text2, enc)
    print("fixed unlock helper:", rel)


def main():
    replace_card_detail("pages/card-detail/card-detail.js")
    replace_card_detail("package-cards/pages/card-detail/card-detail.js")
    replace_unlock_helper("pages/unlock-card/unlock-card.js")
    replace_unlock_helper("package-cards/pages/unlock-card/unlock-card.js")


if __name__ == "__main__":
    main()
