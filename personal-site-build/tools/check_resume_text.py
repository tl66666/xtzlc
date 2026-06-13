from pathlib import Path

from pypdf import PdfReader


pdf = Path(r"C:\Users\唐乐\Desktop\个人网站\assets\tangle-resume.pdf")
text = "\n".join(page.extract_text() or "" for page in PdfReader(str(pdf)).pages)

checks = {
    "has_star_project": "星途自律舱" in text,
    "removed_library_project": "图书管理" not in text,
    "removed_toy_project": "玩具市场" not in text,
    "has_next_placeholder": "下一项目经历预留" in text,
}

for key, value in checks.items():
    print(key, value)
