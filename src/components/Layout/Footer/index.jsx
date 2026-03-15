import Link from "next/link";
import Logo from "../Header/Logo";
import { Icon } from "@iconify/react";
import { headerData } from "../Header/Navigation/menuData";

const SOCIAL = [
  { icon: "tabler:brand-facebook",  href: "#", label: "Facebook"  },
  { icon: "tabler:brand-instagram", href: "#", label: "Instagram" },
  { icon: "tabler:brand-youtube",   href: "#", label: "YouTube"   },
  { icon: "tabler:brand-whatsapp",  href: "#", label: "WhatsApp"  },
];

const OTHER_LINKS = [
  { label: "About Us",    href: "#" },
  { label: "Our Team",    href: "#" },
  { label: "Career",      href: "#" },
  { label: "Contact",     href: "#" },
];

const CONTACT = [
  { icon: "tabler:brand-google-maps", text: "Indore (M.P.) 452010"           },
  { icon: "tabler:phone",             text: "+91 88713 09015"                 },
  { icon: "tabler:mail",              text: "classroomeducation@gmail.com"    },
];

const Footer = () => {
  return (
    <footer className="bg-deepSlate pt-14 pb-6">
      <div className="container mx-auto lg:max-w-screen-xl px-4">

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 mb-10">

          {/* Brand col */}
          <div className="col-span-2 lg:col-span-4 flex flex-col gap-5">
            <Logo />
            <p className="text-slate-500 text-sm leading-relaxed max-w-xs">
              Empowering CA aspirants with expert-led courses, structured content,
              and smart tools to help you clear your exams.
            </p>
            {/* Social */}
            <div className="flex items-center gap-3">
              {SOCIAL.map(({ icon, href, label }) => (
                <Link key={label} href={href} aria-label={label}
                  className="w-9 h-9 bg-white rounded-full flex items-center justify-center
                             text-slate-500 hover:text-primary hover:shadow-md
                             transition-all duration-200 border border-slate-200">
                  <Icon icon={icon} className="text-lg" />
                </Link>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Quick Links
            </h3>
            <ul className="flex flex-col gap-2.5">
              {headerData.map((item, i) => (
                <li key={i}>
                  <Link href={item.href}
                    className="text-sm text-slate-500 hover:text-primary transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Other links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Company
            </h3>
            <ul className="flex flex-col gap-2.5">
              {OTHER_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href}
                    className="text-sm text-slate-500 hover:text-primary transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="col-span-2 lg:col-span-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">
              Contact Us
            </h3>
            <ul className="flex flex-col gap-3">
              {CONTACT.map(({ icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center
                                  flex-shrink-0 mt-0.5">
                    <Icon icon={icon} className="text-primary text-base" />
                  </div>
                  <span className="text-sm text-slate-500 leading-relaxed">{text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-slate-400 text-center sm:text-left">
              © 2025 All Rights Reserved by{" "}
              <Link href="/" className="hover:text-primary transition-colors font-medium">
                Classroom Education
              </Link>
            </p>
            <div className="flex items-center gap-4">
              <Link href="/" className="text-xs text-slate-400 hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/" className="text-xs text-slate-400 hover:text-primary transition-colors">
                Terms & Conditions
              </Link>
            </div>
            <p className="text-xs text-slate-400 text-center sm:text-left">
              Developed by{" "}
              <Link href="https://github.com/PintuAhirwar" target="_blank"
                className="hover:text-primary transition-colors font-medium">
                PintuAhirwar
              </Link>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;