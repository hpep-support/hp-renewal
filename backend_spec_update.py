import re

with open('specs.md', 'r') as f:
    content = f.read()

# Add to section 8 (Tech stack / frontend)
readability = """- フロントエンド：Next.js (App Router), React, TailwindCSS, react-force-graph-2d
- 可読性の向上：
  - 力学モデル（d3-force）の衝突判定（collide）を調整し、ノードのラベル（フォント）同士が重ならないように適切な間隔を空けること。特に階層型（Tree）レイアウト時などの横並びでの文字被りを防ぐ。
"""

content = content.replace("- フロントエンド：Next.js (App Router), React, TailwindCSS, react-force-graph-2d", readability)

with open('specs.md', 'w') as f:
    f.write(content)

