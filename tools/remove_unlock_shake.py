from pathlib import Path
root = Path(r"C:\Users\唐乐\Desktop\项目2\travel-footprint-miniapp")
for rel in ["pages/unlock-card/unlock-card.js", "package-cards/pages/unlock-card/unlock-card.js"]:
    p = root / rel
    text = p.read_text(encoding="utf-8")
    start = text.find("      // UR")
    if start != -1:
        end = text.find("    }, 2000);", start)
        if end != -1:
            text = text[:start] + text[end:]
            p.write_text(text, encoding="utf-8")
            print("removed shake", rel)
        else:
            print("end not found", rel)
    else:
        print("start not found", rel)
