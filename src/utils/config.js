const API_URL = import.meta.env.VITE_API_URL?.replace(/\/+$/, "") || "";
console.log("VITE_API_URL =", import.meta.env.VITE_API_URL);
console.log("API_URL (normalizado) =", API_URL);
export { API_URL };