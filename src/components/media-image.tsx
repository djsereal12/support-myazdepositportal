import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const cache = new Map<string, string>();

export function useSignedUrl(path: string | null | undefined) {
  const [url, setUrl] = useState<string | null>(path ? (cache.get(path) ?? null) : null);

  useEffect(() => {
    let active = true;
    if (!path) {
      setUrl(null);
      return;
    }
    const cached = cache.get(path);
    if (cached) {
      setUrl(cached);
      return;
    }
    supabase.storage
      .from("media")
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!active || !data?.signedUrl) return;
        cache.set(path, data.signedUrl);
        setUrl(data.signedUrl);
      });
    return () => {
      active = false;
    };
  }, [path]);

  return url;
}

export function MediaThumb({
  path,
  alt,
  className = "",
}: {
  path: string | null | undefined;
  alt: string;
  className?: string;
}) {
  const url = useSignedUrl(path);
  const isVideo = !!path && /\.(mp4|mov|webm|m4v)$/i.test(path);

  if (!url) {
    return <div className={`animate-pulse rounded-xl bg-muted ${className}`} aria-hidden />;
  }
  if (isVideo) {
    return <video src={url} controls className={`rounded-xl bg-black object-cover ${className}`} />;
  }
  return <img src={url} alt={alt} loading="lazy" className={`rounded-xl object-cover ${className}`} />;
}
