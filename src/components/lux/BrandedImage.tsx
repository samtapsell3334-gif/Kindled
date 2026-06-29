"use client";

import { useState } from "react";

/**
 * BrandedImage — high-res product photography with a graceful, *branded* fallback.
 * If the image is missing or fails to load, we never show an AI/stock placeholder;
 * instead we render a minimalist charcoal card with the product name set in the
 * editorial serif. Sharp corners inherited from the parent.
 */
export function BrandedImage({
  src,
  alt,
  name,
  className = "",
  imgClassName = "",
}: { src?: string; alt: string; name: string; className?: string; imgClassName?: string }) {
  const [failed, setFailed] = useState(!src);

  if (failed) {
    return (
      <div className={`flex items-center justify-center bg-[#0a0a0a] ${className}`}>
        <div className="px-4 text-center">
          <p className="text-[8px] font-semibold uppercase tracking-[0.3em] text-[#ffb800]">Kindled</p>
          <p className="font-editorial mt-1 text-[15px] font-medium leading-tight text-[#f5f5f5]">{name}</p>
        </div>
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={`${className} ${imgClassName}`}
    />
  );
}
