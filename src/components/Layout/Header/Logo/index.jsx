import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="flex-shrink-0">
      <Image
        src="/images/logo/logo.svg"
        alt="logo"
        width={140}
        height={44}
        style={{ width: "auto", height: "44px" }}
        priority
      />
    </Link>
  );
};

export default Logo;