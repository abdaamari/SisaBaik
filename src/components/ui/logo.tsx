import Image from 'next/image';

export function Logo() {
  return (
    <Image
      src="/logo.svg"
      alt="SisaBaik"
      width={32}
      height={32}
      className="h-8 w-auto"
    />
  );
}