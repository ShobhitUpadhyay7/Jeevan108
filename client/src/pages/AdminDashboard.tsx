import { useEffect, useState } from "react";
import { API_URLS } from "../utils/api";

export default function AdminDashboard() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    fetch(API_URLS.auth.me(), {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json().then((j) => ({ ok: r.ok, body: j })))
      .then(({ ok, body }) => {
        if (ok && body?.username) setName(body.username as string);
      })
      .catch(() => {});
  }, []);

  return <>{name || "Admin"}</>;
}


