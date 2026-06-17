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


def write_text(path, text, encoding="utf-8"):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding=encoding)


def replace_regex(path, pattern, repl, flags=0):
    text, enc = read_text(path)
    new_text, count = re.subn(pattern, repl, text, flags=flags)
    if count == 0:
        print(f"MISS regex: {path.relative_to(ROOT)}")
    else:
        write_text(path, new_text, enc)
        print(f"updated: {path.relative_to(ROOT)} ({count})")


def add_require_once(path, require_line, after_line):
    text, enc = read_text(path)
    if require_line in text:
        return
    if after_line not in text:
        print(f"MISS require anchor: {path.relative_to(ROOT)}")
        return
    text = text.replace(after_line, after_line + "\n" + require_line, 1)
    write_text(path, text, enc)
    print(f"require added: {path.relative_to(ROOT)}")


def main():
    cloud_image_js = """var cache = {};

function isCloudFile(fileID) {
  return typeof fileID === 'string' && fileID.indexOf('cloud://') === 0;
}

function done(callback, value) {
  if (typeof callback === 'function') {
    callback(value || '');
  }
}

function resolve(fileID, callback) {
  if (!isCloudFile(fileID)) {
    done(callback, fileID);
    return;
  }

  if (cache[fileID]) {
    done(callback, cache[fileID]);
    return;
  }

  wx.cloud.getTempFileURL({
    fileList: [fileID],
    success: function(res) {
      var item = res.fileList && res.fileList[0];
      if (item && item.status === 0 && item.tempFileURL) {
        cache[fileID] = item.tempFileURL;
        done(callback, item.tempFileURL);
        return;
      }
      resolveByFunction(fileID, callback);
    },
    fail: function() {
      resolveByFunction(fileID, callback);
    }
  });
}

function resolveByFunction(fileID, callback) {
  wx.cloud.callFunction({
    name: 'getAssetUrl',
    data: { fileID: fileID },
    success: function(res) {
      var result = res.result || {};
      if (result.success && result.url) {
        cache[fileID] = result.url;
        done(callback, result.url);
      } else {
        console.error('getAssetUrl failed:', fileID, result);
        done(callback, '');
      }
    },
    fail: function(err) {
      console.error('getAssetUrl call failed:', fileID, err);
      done(callback, '');
    }
  });
}

function resolveMany(fileIDs, callback) {
  var result = {};
  var pending = fileIDs.length;
  if (!pending) {
    callback(result);
    return;
  }

  for (var i = 0; i < fileIDs.length; i++) {
    (function(fileID) {
      resolve(fileID, function(url) {
        result[fileID] = url;
        pending--;
        if (pending === 0) {
          callback(result);
        }
      });
    })(fileIDs[i]);
  }
}

module.exports = {
  resolve: resolve,
  resolveMany: resolveMany
};
"""
    write_text(ROOT / "utils" / "cloudImage.js", cloud_image_js)
    print("written: utils/cloudImage.js")

    get_asset_index = """const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const fileID = event.fileID;

  if (!fileID || typeof fileID !== 'string') {
    return { success: false, error: 'fileID is required' };
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: [fileID]
    });
    const item = result.fileList && result.fileList[0];

    if (item && item.status === 0 && item.tempFileURL) {
      return {
        success: true,
        fileID,
        url: item.tempFileURL
      };
    }

    return {
      success: false,
      fileID,
      error: item ? item.errMsg || ('status ' + item.status) : 'empty fileList',
      raw: result
    };
  } catch (error) {
    return {
      success: false,
      fileID,
      error: error.message || String(error)
    };
  }
};
"""
    write_text(ROOT / "cloudfunctions" / "getAssetUrl" / "index.js", get_asset_index)
    write_text(
        ROOT / "cloudfunctions" / "getAssetUrl" / "package.json",
        """{
  "name": "getAssetUrl",
  "version": "1.0.0",
  "description": "Resolve cloud storage file id to a temporary URL",
  "main": "index.js",
  "dependencies": {
    "wx-server-sdk": "latest"
  }
}
""",
    )
    print("written: cloudfunctions/getAssetUrl")

    list_cloud_files = """const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

exports.main = async (event) => {
  const fileList = event.fileList || [];

  if (!Array.isArray(fileList) || fileList.length === 0) {
    return {
      success: false,
      error: 'fileList is required. Pass cloud file IDs to inspect access.'
    };
  }

  try {
    const result = await cloud.getTempFileURL({
      fileList: fileList.slice(0, 50)
    });
    return {
      success: true,
      data: result.fileList || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message || String(error)
    };
  }
};
"""
    write_text(ROOT / "cloudfunctions" / "listCloudFiles" / "index.js", list_cloud_files)
    print("updated: cloudfunctions/listCloudFiles/index.js")

    for rel, anchor, req in [
        ("pages/city-detail/city-detail.js", "var provinces = provincesData.provinces;", "var cloudImage = require('../../utils/cloudImage.js');"),
        ("pages/cards/cards.js", "var provinces = provincesData.provinces;", "var cloudImage = require('../../utils/cloudImage.js');"),
        ("package-cards/pages/cards/cards.js", "var provinces = provincesData.provinces;", "var cloudImage = require('../../../utils/cloudImage.js');"),
        ("pages/card-detail/card-detail.js", "var charactersData = require('../../utils/characters.js');", "var cloudImage = require('../../utils/cloudImage.js');"),
        ("package-cards/pages/card-detail/card-detail.js", "var charactersData = require('../../../utils/characters.js');", "var cloudImage = require('../../../utils/cloudImage.js');"),
        ("pages/unlock-card/unlock-card.js", "var charactersData = require('../../utils/characters.js');", "var cloudImage = require('../../utils/cloudImage.js');"),
        ("package-cards/pages/unlock-card/unlock-card.js", "var charactersData = require('../../../utils/characters.js');", "var cloudImage = require('../../../utils/cloudImage.js');"),
    ]:
        add_require_once(ROOT / rel, req, anchor)

    # City detail has a local helper; replace it with the shared resolver.
    replace_regex(
        ROOT / "pages/city-detail/city-detail.js",
        r"function getCloudImageUrl\(cloudPath, callback\) \{.*?\n\}\n\nPage\(",
        "function getCloudImageUrl(cloudPath, callback) {\n  cloudImage.resolve(cloudPath, callback);\n}\n\nPage(",
        flags=re.S,
    )

    # Cards list pages: replace per-file download loops / batch temp-url logic with shared resolver.
    load_repl = """loadCloudImages: function(cards, cloudPaths) {
    var self = this;
    cloudImage.resolveMany(cloudPaths, function(urlMap) {
      var newCards = self.data.cards.slice();
      for (var i = 0; i < newCards.length; i++) {
        var resolvedUrl = urlMap[newCards[i].imagePath];
        if (resolvedUrl) {
          newCards[i].imagePath = resolvedUrl;
        }
      }
      self.setData({
        cards: newCards
      });
    });
  },

  getCitiesInProvince:"""
    for rel in ("pages/cards/cards.js", "package-cards/pages/cards/cards.js"):
      replace_regex(
          ROOT / rel,
          r"loadCloudImages: function\(cards, cloudPaths\) \{.*?\n  \},\n\n  getCitiesInProvince:",
          load_repl,
          flags=re.S,
      )

    # Detail/unlock pages have local helper functions with the same name.
    for rel in (
        "pages/unlock-card/unlock-card.js",
        "package-cards/pages/unlock-card/unlock-card.js",
    ):
        replace_regex(
            ROOT / rel,
            r"getCloudImageUrl: function\(cloudPath, callback\) \{.*?\n  \},\n\n  onShareAppMessage:",
            "getCloudImageUrl: function(cloudPath, callback) {\n    cloudImage.resolve(cloudPath, callback);\n  },\n\n  onShareAppMessage:",
            flags=re.S,
        )

    for rel in (
        "pages/card-detail/card-detail.js",
        "package-cards/pages/card-detail/card-detail.js",
    ):
        replace_regex(
            ROOT / rel,
            r"wx\.cloud\.(?:downloadFile|getTempFileURL)\(\{[\s\S]*?\n      \}\);",
            "cloudImage.resolve(cloudPath, function(imageUrl) {\n        if (imageUrl) {\n          self.setData({ imageUrl: imageUrl });\n        }\n      });",
            flags=0,
        )


if __name__ == "__main__":
    main()
