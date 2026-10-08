'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Flower2 } from 'lucide-react';
export default function ProductImage({
  src,
  alt,
  priority = false,
}: {
  src: string;
  alt: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  return failed || !src ? (
    <div className="image-fallback">
      <Flower2 size={40} />
      <span>Фото недоступно</span>
    </div>
  ) : (
    <Image
      unoptimized
      src={src}
      alt={alt}
      width={800}
      height={1000}
      loading={priority ? 'eager' : 'lazy'}
      onError={() => setFailed(true)}
    />
  );
}
