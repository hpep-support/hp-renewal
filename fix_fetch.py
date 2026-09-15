import re

with open('frontend/src/app/dashboard/context/page.tsx', 'r') as f:
    content = f.read()

replacement = """
  const fetchContexts = useCallback(async () => {
    try {
      const token = localStorage.getItem("access_token");
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api"}/contexts`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) {
          localStorage.removeItem("access_token");
          router.push("/login");
          return;
        }
        throw new Error("Failed to fetch contexts");
      }

      const data = await res.json();
      setContexts(data);
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [router]);
"""

content = re.sub(r'  const fetchContexts = async \(\) => \{.*?\n  \};\n', replacement.lstrip('\n').replace('\\', '\\\\'), content, flags=re.DOTALL)

with open('frontend/src/app/dashboard/context/page.tsx', 'w') as f:
    f.write(content)

