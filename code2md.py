import os
import sys
import argparse

EXTENSION_LANG_MAP = {
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    # ".json": "json",
}

def collect_and_write(directory, exclude_dirs, output_file):
    for root, dirs, files in os.walk(directory):
        # از وارد شدن به پوشه‌های استثنا جلوگیری می‌کنیم
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        for file in files:
            ext = os.path.splitext(file)[1]
            if ext in EXTENSION_LANG_MAP:
                file_path = os.path.join(root, file)
                print(f"Processing: {file_path}")
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        file_content = f.read()
                except Exception as e:
                    print(f"  ⚠️ خطا در خواندن {file_path}: {e}")
                    continue

                lang = EXTENSION_LANG_MAP[ext]
                output_file.write(f"# {file_path}\n```{lang}\n{file_content}\n```\n\n")

def main():
    parser = argparse.ArgumentParser(
        description="جمع‌آوری فایل‌های React/JSON و نوشتن به code.md (با امکان استثنا کردن پوشه‌ها)"
    )
    parser.add_argument("directory", help="مسیر دایرکتوری که باید جستجو بشه")
    parser.add_argument(
        "-e", "--exclude", nargs="+", default=[],
        help="یک یا چند نام پوشه برای استثنا (مثلاً node_modules build)"
    )
    args = parser.parse_args()

    if not os.path.isdir(args.directory):
        print(f"The directory {args.directory} does not exist.")
        sys.exit(1)

    output_path = os.path.join(args.directory, "code.md")
    print(f"Output will be written to: {output_path}")
    if args.exclude:
        print(f"Excluding directories: {', '.join(args.exclude)}")

    with open(output_path, 'w', encoding='utf-8') as out_f:
        collect_and_write(args.directory, set(args.exclude), out_f)

    print("\n✅ Done!")

if __name__ == "__main__":
    main()
