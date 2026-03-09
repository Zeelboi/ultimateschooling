import os
import glob
from PIL import Image

# Folders ka rasta
ARTICLES_DIR = "articles"
JSON_FILE = os.path.join(ARTICLES_DIR, "data.json")

# Articles folder mein saari JPG/PNG images dhoondo
images = glob.glob(os.path.join(ARTICLES_DIR, "*.jpg")) + \
         glob.glob(os.path.join(ARTICLES_DIR, "*.jpeg")) + \
         glob.glob(os.path.join(ARTICLES_DIR, "*.png"))

if not images:
    print("⚠️ Koi JPG/PNG image nahi mili. Shayad sab already WebP hain!")
else:
    print(f"🚀 {len(images)} heavy images ko VIP WebP format mein convert kiya ja raha hai...\n")

    for img_path in images:
        try:
            img = Image.open(img_path)
            webp_path = img_path.rsplit(".", 1)[0] + ".webp"
            img.save(webp_path, "webp", quality=80)
            os.remove(img_path)
            print(f"✅ Converted: {os.path.basename(img_path)} -> {os.path.basename(webp_path)}")
        except Exception as e:
            print(f"❌ Error in {img_path}: {e}")

html_files = glob.glob("*.html") + glob.glob(os.path.join(ARTICLES_DIR, "*.html"))
for html_file in html_files:
    try:
        with open(html_file, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = content.replace(".jpg", ".webp").replace(".jpeg", ".webp").replace(".png", ".webp")
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(new_content)
    except Exception as e:
        pass

if os.path.exists(JSON_FILE):
    try:
        with open(JSON_FILE, "r", encoding="utf-8") as f:
            content = f.read()
        new_content = content.replace(".jpg", ".webp").replace(".jpeg", ".webp").replace(".png", ".webp")
        with open(JSON_FILE, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("\n✅ data.json aur saari HTML files automatic update ho gayin!")
    except Exception as e:
        print("❌ JSON update error:", e)

print("\n🎉 BOOM! Saari images compress ho gayin aur code update ho gaya!")
print("🚀 Ab GitHub Desktop se commit aur push karein!")