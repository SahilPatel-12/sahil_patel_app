import os

search_dir = '/Users/sahilpatel/Desktop/New_Mantra_puja.nosync/'
terms = ['holmes', 'scientific']

print(f"Searching under {search_dir} for terms {terms}...")

matches = []
for root, dirs, files in os.walk(search_dir):
    # Skip large directories to prevent slowness
    if any(p in root for p in ['.git', '.next', 'node_modules', '.gemini', '.planning']):
        continue
    for file in files:
        if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.json', '.sql', '.md', '.html')):
            file_path = os.path.join(root, file)
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    content = f.read().lower()
                    for term in terms:
                        if term in content:
                            matches.append((file_path, term))
            except Exception as e:
                pass

print(f"\nFound {len(matches)} occurrences:")
for path, term in matches:
    print(f"- File: {path} (matches term: '{term}')")
