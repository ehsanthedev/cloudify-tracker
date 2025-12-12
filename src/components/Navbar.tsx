"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Sales Tracker" },
    { href: "/expenses", label: "Expenses" },
    { href: "/creditors", label: "Creditors" },
    { href: "/totals", label: "Dashboard" },
  ];

  return (
    <nav style={navbarStyles}>
      <div style={navContainerStyles}>
        <h1 style={logoStyles}>CLOUDIFY</h1>

        {/* Desktop Navigation - Hidden on Mobile */}
        <div
          style={{
            ...navLinksStyles,
            display: isMobile ? "none" : "flex",
          }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={pathname === link.href ? activeLinkStyles : linkStyles}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Hamburger Button - Only show on mobile */}
        {isMobile && (
          <button
            style={hamburgerButtonStyles}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span
              style={{
                ...hamburgerLine,
                transform: isMenuOpen
                  ? "rotate(45deg) translate(5px, 5px)"
                  : "none",
              }}
            ></span>
            <span
              style={{
                ...hamburgerLine,
                opacity: isMenuOpen ? 0 : 1,
              }}
            ></span>
            <span
              style={{
                ...hamburgerLine,
                transform: isMenuOpen
                  ? "rotate(-45deg) translate(7px, -6px)"
                  : "none",
              }}
            ></span>
          </button>
        )}
      </div>

      {/* Mobile Menu - Only show when open on mobile */}
      {isMobile && isMenuOpen && (
        <div style={mobileMenuStyles}>
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              style={
                pathname === link.href
                  ? activeMobileLinkStyles
                  : mobileLinkStyles
              }
              onClick={closeMenu}
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}

      {/* Add CSS for responsive behavior */}
      <style jsx>{`
        /* Hide desktop nav on mobile, show hamburger */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger {
            display: flex !important;
          }
        }

        /* Show desktop nav on larger screens */
        @media (min-width: 769px) {
          .desktop-nav {
            display: flex !important;
          }
          .hamburger {
            display: none !important;
          }
          .mobile-menu {
            display: none !important;
          }
        }
      `}</style>
    </nav>
  );
}

// Base Styles
const navbarStyles: React.CSSProperties = {
  backgroundColor: "#4a6fa5",
  padding: "1rem 0",
  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
  position: "sticky",
  top: 0,
  zIndex: 1000,
  width: "100%",
};

const navContainerStyles: React.CSSProperties = {
  maxWidth: "1200px",
  margin: "0 auto",
  padding: "0 20px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  position: "relative",
};

const logoStyles: React.CSSProperties = {
  color: "white",
  margin: 0,
  fontSize: "1.5rem",
  fontWeight: "bold",
};

// Desktop Navigation
const navLinksStyles: React.CSSProperties = {
  display: "flex",
  gap: "2rem",
};

const linkStyles: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  padding: "0.5rem 1rem",
  borderRadius: "5px",
  transition: "background-color 0.3s",
  fontSize: "1rem",
};

const activeLinkStyles: React.CSSProperties = {
  ...linkStyles,
  backgroundColor: "rgba(255,255,255,0.2)",
};

// Hamburger Menu
const hamburgerButtonStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "30px",
  height: "30px",
  background: "none",
  border: "none",
  cursor: "pointer",
  padding: "0",
};

const hamburgerLine: React.CSSProperties = {
  width: "25px",
  height: "3px",
  backgroundColor: "white",
  margin: "3px 0",
  transition: "all 0.3s ease",
};

// Mobile Navigation
const mobileMenuStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "0",
  backgroundColor: "#4a6fa5",
  padding: "1rem 0",
  borderTop: "1px solid rgba(255,255,255,0.1)",
  position: "absolute",
  top: "100%",
  left: 0,
  right: 0,
  zIndex: 1000,
};

const mobileLinkStyles: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  padding: "1rem 2rem",
  width: "100%",
  textAlign: "center",
  transition: "background-color 0.3s",
  fontSize: "1.1rem",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
};

const activeMobileLinkStyles: React.CSSProperties = {
  ...mobileLinkStyles,
  backgroundColor: "rgba(255,255,255,0.2)",
};
