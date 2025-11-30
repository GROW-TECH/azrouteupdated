// components/Footer.jsx
import Link from 'next/link';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  FacebookIcon,
  TwitterIcon,
  LinkedinIcon,
  InstagramIcon,
  Mail,
} from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    platform: [
      { name: 'About Us', href: '/about' },
      { name: 'How It Works', href: '/how-it-works' },
      // { name: 'Testimonials', href: '/testimonials' },
      { name: 'Contact Us', href: '/contact' },
    ],
    teach: [
      { name: 'Become a Teacher', href: '/auth/teacher/signup' },
      { name: 'Teacher Guidelines', href: '/guidelines' },
      { name: 'CPD Accreditation', href: '/accreditation' },
      // { name: 'Success Stories', href: '/success-stories' },
    ],
    learn: [
      { name: 'All Courses', href: '/courses' },
      { name: 'All Events', href: '/events' },
      // { name: 'Student Support', href: '/support' },
      { name: 'Request a Course', href: '/request-category' },
    ],
    resources: [
      { name: 'Help Center', href: '/help' },
      { name: 'Terms of Service', href: '/terms' },
      { name: 'Privacy Policy', href: '/privacy-policy' },
      // { name: 'CPD Information', href: '/cpd-info' },
    ],
  };

  const socialLinks = [
    { icon: FacebookIcon, href: 'https://facebook.com', label: 'Facebook' },
    { icon: TwitterIcon, href: 'https://twitter.com', label: 'Twitter' },
    { icon: LinkedinIcon, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: InstagramIcon, href: 'https://instagram.com', label: 'Instagram' },
  ];

  return (
    <footer className="bg-background border-t">
      <div className="container px-4 py-12 mx-auto">
        {/* Newsletter Section */}
        {/* <div className="grid gap-8 lg:grid-cols-2 mb-12 pb-12 border-b">
          <div>
            <h3 className="text-2xl font-bold mb-2">
              Join our dental learning community
            </h3>
            <p className="text-muted-foreground">
              Get updates on new courses and CPD opportunities
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              className="max-w-sm"
            />
            <Button>
              <Mail className="h-4 w-4 mr-2" />
              Subscribe
            </Button>
          </div>
        </div> */}

        {/* Main Footer Links */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Teach</h4>
            <ul className="space-y-2">
              {footerLinks.teach.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Learn</h4>
            <ul className="space-y-2">
              {footerLinks.learn.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Resources</h4>
            <ul className="space-y-2">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4"><img 
            src="/Azroute.jpeg" 
            alt="Azroute Logo" 
            className="h-20 w-20 object-contain"
          />
              {/* <Link href="/" className="font-bold text-xl">
                Azroute
              </Link> */}
              <span className="text-sm text-muted-foreground">
                
                © {currentYear} AzrouteChessInstitue. All rights reserved.
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {socialLinks.map((social) => {
                const Icon = social.icon;
                return (
                  <a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={social.label}
                  >
                    <Icon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
