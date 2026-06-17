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


def replace_derive(rel, cities_require):
    path = ROOT / rel
    text, enc = read_text(path)
    new_func = f"""deriveVisitedProvinces: function() {{
    var visitedCities = app.globalData.visitedCities || [];
    var storedProvinces = app.globalData.visitedProvinces || [];
    var visitedProvinces = storedProvinces.slice();
    var citiesData = require('{cities_require}');
    var cities = citiesData.cities;

    try {{
      var cached = wx.getStorageSync('visitedProvinces');
      if (cached) {{
        var cachedList = JSON.parse(cached);
        if (Array.isArray(cachedList)) {{
          for (var c = 0; c < cachedList.length; c++) {{
            if (visitedProvinces.indexOf(cachedList[c]) === -1) {{
              visitedProvinces.push(cachedList[c]);
            }}
          }}
        }}
      }}
    }} catch (e) {{
      console.warn('read visitedProvinces cache failed:', e);
    }}

    for (var i = 0; i < visitedCities.length; i++) {{
      var cityId = visitedCities[i];
      for (var j = 0; j < cities.length; j++) {{
        if (cities[j].id === cityId) {{
          var provinceId = cities[j].provinceId;
          if (visitedProvinces.indexOf(provinceId) === -1) {{
            visitedProvinces.push(provinceId);
          }}
          break;
        }}
      }}
    }}

    app.globalData.visitedProvinces = visitedProvinces;
    try {{
      wx.setStorageSync('visitedProvinces', JSON.stringify(visitedProvinces));
    }} catch (e) {{
      console.error('save visitedProvinces failed:', e);
    }}

    return visitedProvinces;
  }},"""
    text2, count = re.subn(
        r"deriveVisitedProvinces: function\(\) \{.*?\n  \},\n\n  loadCards:",
        new_func + "\n\n  loadCards:",
        text,
        flags=re.S,
    )
    if count != 1:
        raise RuntimeError(f"derive replace failed for {rel}: {count}")
    write_text(path, text2, enc)
    print("fixed derive:", rel)


def main():
    replace_derive("pages/cards/cards.js", "../../utils/cities.js")
    replace_derive("package-cards/pages/cards/cards.js", "../../../utils/cities.js")


if __name__ == "__main__":
    main()
