import re

with open('frontend/src/app/dashboard/context/page.tsx', 'r') as f:
    content = f.read()

use_effect_block = """  useEffect(() => {
    fetchContexts();
    fetchPreferences();
  }, [fetchContexts, fetchPreferences]);
"""

# Remove it from where it is
content = content.replace(use_effect_block, '')

# Insert it after fetchContexts
fetch_contexts_block_end = "  }, [router]);"
content = content.replace(fetch_contexts_block_end, fetch_contexts_block_end + "\n\n" + use_effect_block)

with open('frontend/src/app/dashboard/context/page.tsx', 'w') as f:
    f.write(content)

