"use client";
import { preload as preloadResource } from "react-dom";
import type { ImageProps } from "next/image";
import assets from "@/lib/pages/media-index.json";
import { imageWidths } from "@/lib/pages/image-policy";
export default function StaticImage({
  src,
  alt,
  fill,
  preload,
  priority,
  quality,
  unoptimized,
  sizes,
  style,
  loading,
  width,
  height,
  ...rest
}: ImageProps) {
  void quality;
  void unoptimized;
  const original =
    typeof src === "string"
      ? src
      : "default" in src
        ? src.default.src
        : src.src;
  const record = (assets as Record<string, { hash: string; width: number }>)[
    original.split(/[?#]/)[0]
  ];
  const widths = record ? imageWidths(original, record.width) : [];
  const url = (w: number) => `/media/${record.hash}-${w}.webp`;
  const selected = record ? url(widths.at(-1)!) : original;
  const srcSet = record
    ? widths.map((w) => `${url(w)} ${w}w`).join(", ")
    : undefined;
  const slot = sizes || (width ? `${Number(width)}px` : "100vw");
  if (preload || priority)
    preloadResource(selected, {
      as: "image",
      imageSrcSet: srcSet,
      imageSizes: slot,
      fetchPriority: "high",
    });
  // All sources are prebuilt; there is no runtime image optimizer.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={selected}
      srcSet={srcSet}
      sizes={slot}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fetchPriority={preload || priority ? "high" : rest.fetchPriority}
      loading={preload || priority ? "eager" : loading || "lazy"}
      style={
        fill
          ? {
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              ...style,
            }
          : style
      }
    />
  );
}
