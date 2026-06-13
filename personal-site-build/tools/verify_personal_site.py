from pathlib import Path


ROOT = Path(r"C:\Users\唐乐\Desktop\个人网站")


def main():
    html = (ROOT / "index.html").read_text(encoding="utf-8")
    print("html_has_tangle=", "唐乐" in html)
    print("html_has_project=", "星途自律舱" in html)
    try:
        from pypdf import PdfReader

        pages = len(PdfReader(str(ROOT / "assets" / "tangle-resume.pdf")).pages)
        print("pdf_pages=", pages)
    except Exception as exc:
        print("pdf_page_check_failed=", repr(exc))
    for path in [
        ROOT / "index.html",
        ROOT / "assets" / "styles.css",
        ROOT / "assets" / "planet.png",
        ROOT / "assets" / "ecology-sport.jpg",
        ROOT / "assets" / "ecology-study.jpg",
        ROOT / "assets" / "ecology-diet.jpg",
        ROOT / "assets" / "tangle-resume.docx",
        ROOT / "assets" / "tangle-resume.pdf",
    ]:
        print(path.name, path.exists(), path.stat().st_size if path.exists() else 0)


if __name__ == "__main__":
    main()
