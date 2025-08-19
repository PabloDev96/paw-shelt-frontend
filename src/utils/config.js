const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";

if (!API_URL) {
  console.warn(
    "⚠️ No se encontró la variable VITE_API_URL. Configúrala en tu .env.local (para local) o en Vercel → Settings → Environment Variables."
  );
}

export { API_URL };