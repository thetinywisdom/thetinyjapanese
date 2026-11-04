import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { absoluteUrl, metaForPath } from "@/lib/route-meta";

function setMeta(attr: "name" | "property", key: string, content: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

/** Keep the tab title, description, and canonical URL in step with the route. */
export function DocumentMeta() {
  const { pathname } = useLocation();
  const meta = metaForPath(pathname);
  const base = import.meta.env.BASE_URL;

  useEffect(() => {
    const routePath = meta.path.includes(":") || meta.path === "*" ? pathname : meta.path;
    const canonical = absoluteUrl(base, routePath);
    const image = absoluteUrl(base, "/og.png");
    document.title = meta.title;
    setMeta("name", "description", meta.description);
    setMeta("property", "og:title", meta.title);
    setMeta("property", "og:description", meta.description);
    setMeta("property", "og:url", canonical);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:title", meta.title);
    setMeta("name", "twitter:description", meta.description);
    setMeta("name", "twitter:image", image);
    let link = document.head.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement("link");
      link.setAttribute("rel", "canonical");
      document.head.appendChild(link);
    }
    link.setAttribute("href", canonical);
  }, [base, meta, pathname]);

  return null;
}
