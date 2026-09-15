import re

with open('frontend/src/app/dashboard/context/page.tsx', 'r') as f:
    content = f.read()

# Add states for theme and layoutType
states_update = """
  const [theme, setTheme] = useState("dark");
  const [layoutType, setLayoutType] = useState("radial");

  // Fetch preferences on load
  const fetchPreferences = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/preferences/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.theme) setTheme(data.theme);
        if (data.layout_type) setLayoutType(data.layout_type);
      }
    } catch (err) {
      console.error("Failed to load preferences", err);
    }
  }, []);

  const updatePreference = async (newTheme?: string, newLayout?: string) => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) return;
      
      const payload: any = {};
      if (newTheme) payload.theme = newTheme;
      if (newLayout) payload.layout_type = newLayout;
      
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/preferences/`, {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        if (newTheme) setTheme(newTheme);
        if (newLayout) setLayoutType(newLayout);
      }
    } catch (err) {
      console.error("Failed to update preferences", err);
    }
  };

  useEffect(() => {
    fetchContexts();
    fetchPreferences();
  }, [fetchContexts, fetchPreferences]);
"""
# Replace the existing useEffect
content = re.sub(r'  useEffect\(\(\) => \{\n    fetchContexts\(\);\n  \}, \[fetchContexts\]\);', states_update.replace('\\', '\\\\'), content)


# Add UI controls and pass props to NetworkGraph
ui_update = """
        {/* Network Graph Visualization */}
        <div className={`sticky top-8 z-10 ${theme === 'light' ? 'bg-white/90' : 'bg-slate-900/90'} backdrop-blur-md p-4 rounded-2xl border ${theme === 'light' ? 'border-slate-200' : 'border-slate-700/50'} shadow-2xl`}>
          <div className="flex justify-between items-center mb-4 px-2">
            <h3 className={`${theme === 'light' ? 'text-slate-800' : 'text-slate-300'} font-medium`}>Context Network Visualization</h3>
            <div className="flex gap-2">
              <select 
                value={theme}
                onChange={(e) => updatePreference(e.target.value, undefined)}
                className={`text-xs px-2 py-1 rounded-md border ${theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'} outline-none focus:ring-1 focus:ring-teal-500`}
              >
                <option value="dark">Dark Theme</option>
                <option value="light">Light Theme</option>
                <option value="colorful">Colorful Theme</option>
              </select>
              <select 
                value={layoutType}
                onChange={(e) => updatePreference(undefined, e.target.value)}
                className={`text-xs px-2 py-1 rounded-md border ${theme === 'light' ? 'bg-white border-slate-300 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-300'} outline-none focus:ring-1 focus:ring-teal-500`}
              >
                <option value="radial">Radial (Chronological)</option>
                <option value="force">Force Directed</option>
                <option value="hierarchical">Hierarchical (Tree)</option>
              </select>
            </div>
          </div>
          <NetworkGraph 
            contexts={contexts} 
            onNodeSelect={handleNodeSelect}
            activeNodeName={selectedEntity}
            theme={theme}
            layoutType={layoutType}
          />
        </div>
"""
content = re.sub(r'        \{\/\* Network Graph Visualization \*\/.*?/>\n        </div>', ui_update.replace('\\', '\\\\'), content, flags=re.DOTALL)


with open('frontend/src/app/dashboard/context/page.tsx', 'w') as f:
    f.write(content)
