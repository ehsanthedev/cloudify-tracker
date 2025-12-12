"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

export default function Navbar() {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Check if we're on mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const navLinks = [
    { href: "/", label: "Sales Tracker", icon: "💰" },
    { href: "/expenses", label: "Expenses", icon: "📊" },
    { href: "/creditors", label: "Creditors", icon: "📝" },
    { href: "/totals", label: "Dashboard", icon: "📈" },
  ];

  return (
    <>
      <style jsx global>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 0.7;
          }
          50% {
            opacity: 1;
          }
          100% {
            opacity: 0.7;
          }
        }

        .animate-slide-down {
          animation: slideDown 0.4s ease-out forwards;
        }

        .animate-fade-in {
          animation: fadeIn 0.4s ease-out forwards;
        }

        .animate-pulse {
          animation: pulse 2s infinite;
        }

        .nav-link {
          position: relative;
          transition: all 0.3s ease;
        }

        .nav-link:hover {
          transform: translateY(-1px);
        }

        .nav-link-active {
          position: relative;
        }

        .nav-link-active::after {
          content: "";
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 100%;
          height: 2px;
          background: white;
        }

        .nav-link-active span {
          animation: pulse 2s infinite;
        }

        .hover-grow {
          transition: transform 0.3s ease;
        }

        .hover-grow:hover {
          transform: scale(1.1);
        }

        .transition-all {
          transition: all 0.3s ease;
        }

        /* Responsive styles */
        @media (max-width: 768px) {
          .desktop-nav {
            display: none !important;
          }
          .hamburger {
            display: flex !important;
          }
        }

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

      <nav
        style={{
          ...navbarStyles,
          backgroundColor: isScrolled ? "rgba(74, 111, 165, 0.95)" : "#4a6fa5",
          backdropFilter: isScrolled ? "blur(10px)" : "none",
          boxShadow: isScrolled ? "0 4px 20px rgba(0, 0, 0, 0.1)" : "none",
          transition: "all 0.3s ease",
        }}
        className="animate-slide-down"
      >
        <div style={navContainerStyles}>
          <h1
            style={{
              ...logoStyles,
              opacity: isMenuOpen ? 0 : 1,
              transition: "all 0.3s ease",
            }}
          >
            CLOUDIFY
          </h1>

          {/* Desktop Navigation - Hidden on Mobile */}
          <div
            style={{
              ...navLinksStyles,
              display: isMobile ? "none" : "flex",
            }}
            className="animate-fade-in desktop-nav"
          >
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...(pathname === link.href ? activeLinkStyles : linkStyles),
                  animationDelay: `${index * 0.1}s`,
                }}
                className={`nav-link transition-all ${
                  pathname === link.href ? "nav-link-active" : ""
                }`}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginRight: "8px",
                    fontSize: "1.1rem",
                    transition: "transform 0.3s ease",
                  }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </div>

          {/* Hamburger Button - Only show on mobile */}
          {isMobile && (
            <button
              style={{
                ...hamburgerButtonStyles,
                transform: isMenuOpen ? "rotate(90deg)" : "rotate(0)",
                transition: "transform 0.3s ease",
              }}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              className="hover-grow hamburger"
            >
              <span
                style={{
                  ...hamburgerLine,
                  transform: isMenuOpen
                    ? "rotate(45deg) translate(4px, 4px)"
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
                    ? "rotate(-45deg) translate(6px, -5px)"
                    : "none",
                }}
              ></span>
            </button>
          )}
        </div>

        {/* Mobile Menu - Only show when open on mobile */}
        {isMobile && isMenuOpen && (
          <div
            style={{
              ...mobileMenuStyles,
              opacity: isMenuOpen ? 1 : 0,
              transform: isMenuOpen ? "translateY(0)" : "translateY(-10px)",
              transition: "all 0.3s ease",
            }}
            className="mobile-menu"
          >
            {navLinks.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  ...(pathname === link.href
                    ? activeMobileLinkStyles
                    : mobileLinkStyles),
                  animationDelay: `${index * 0.1}s`,
                  opacity: 0,
                  animation: `fadeIn 0.3s ease-out ${index * 0.1}s forwards`,
                }}
                className={`nav-link ${
                  pathname === link.href ? "nav-link-active" : ""
                }`}
                onClick={closeMenu}
              >
                <span
                  style={{
                    display: "inline-block",
                    marginRight: "15px",
                    fontSize: "1.2rem",
                  }}
                >
                  {link.icon}
                </span>
                {link.label}
              </Link>
            ))}
          </div>
        )}
      </nav>
    </>
  );
}

// Base Styles
const navbarStyles: React.CSSProperties = {
  padding: "1rem 0",
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
  letterSpacing: "1px",
};

// Desktop Navigation
const navLinksStyles: React.CSSProperties = {
  display: "flex",
  gap: "2rem",
};

const linkStyles: React.CSSProperties = {
  color: "white",
  textDecoration: "none",
  fontSize: "1rem",
  fontWeight: "500",
  display: "flex",
  alignItems: "center",
  padding: "0.5rem 0",
  opacity: 0.9,
};

const activeLinkStyles: React.CSSProperties = {
  ...linkStyles,
  fontWeight: "600",
  opacity: 1,
};

// Hamburger Menu
const hamburgerButtonStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  width: "32px",
  height: "32px",
  background: "transparent",
  border: "none",
  cursor: "pointer",
  padding: 0,
};

const hamburgerLine: React.CSSProperties = {
  width: "20px",
  height: "2px",
  backgroundColor: "white",
  margin: "3px 0",
  transition: "all 0.3s ease",
};

// Mobile Navigation
const mobileMenuStyles: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: 0,
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
  fontSize: "1rem",
  borderBottom: "1px solid rgba(255,255,255,0.1)",
  display: "flex",
  alignItems: "center",
  fontWeight: "500",
  opacity: 0.9,
};

const activeMobileLinkStyles: React.CSSProperties = {
  ...mobileLinkStyles,
  fontWeight: "600",
  opacity: 1,
  backgroundColor: "rgba(255, 255, 255, 0.1)",
};
