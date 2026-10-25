from huggingface_hub import try_to_load_from_cache
from pathlib import Path
import subprocess

models = [
    ("ggml-org/gemma-4-12B-it-GGUF", "gemma-4-12B-it-Q4_0.gguf"),
]

for repo, filename in models:
    cached = try_to_load_from_cache(repo, filename, cache_dir="/models")
    if isinstance(cached, str) and Path(cached).is_file():
        print(f"Already downloaded: {filename}", flush=True)
        continue
    subprocess.run(
        ["hf", "download", repo, filename, "--cache-dir", "/models"],
        check=True,
    )
