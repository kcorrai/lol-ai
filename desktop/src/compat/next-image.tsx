import type { ImgHTMLAttributes } from "react";

/**
 * `next/image`, for the 69 website components this window renders (ADR-043).
 *
 * A plain `<img>`. Everything Next's component actually does — resizing at the edge,
 * generating a srcset, serving AVIF — needs the Next server that is not in this process,
 * and the images these screens show come from Data Dragon at a fixed size anyway.
 *
 * The hosts are named in the app's content policy (`tauri.conf.json`), the same four the
 * website's own policy trusts. An image from anywhere else does not load, which is the
 * intended behaviour and not a bug to work around.
 */
interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  src: string | { src: string };
  alt: string;
  width?: number | string;
  height?: number | string;
  fill?: boolean;
  priority?: boolean;
  quality?: number;
  unoptimized?: boolean;
  sizes?: string;
  placeholder?: string;
  blurDataURL?: string;
}

export default function Image({
  src,
  alt,
  fill,
  style,
  // Next-only props. Spreading them onto an `<img>` makes React warn once per render.
  priority: _priority,
  quality: _quality,
  unoptimized: _unoptimized,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  ...rest
}: ImageProps): React.ReactElement {
  return (
    <img
      src={typeof src === "string" ? src : src.src}
      alt={alt}
      // `fill` means "cover the positioned ancestor", which is a stylesheet instruction
      // rather than an attribute. Callers already position that ancestor, so reproducing
      // the rule is all that is missing.
      style={fill ? { position: "absolute", inset: 0, width: "100%", height: "100%", ...style } : style}
      {...rest}
    />
  );
}
