import React, { useState, useEffect, useRef } from "react";
import "../styles/Landing.css";

/* ========================================================
   CLASS 1: ScrollEventEmitter (Custom Event Dispatcher)
======================================================== */
class ScrollEventEmitter {
  constructor() {
    this.handleScroll = this.handleScroll.bind(this);
    window.addEventListener("scroll", this.handleScroll);
  }

  handleScroll() {
    const scrollY = window.scrollY;
    const event = new CustomEvent("pageScroll", { detail: { scrollY } });
    window.dispatchEvent(event);
  }

  destroy() {
    window.removeEventListener("scroll", this.handleScroll);
  }
}

/* ========================================================
   CLASS 2: NavbarController
   - Handles menu toggling (via callback)
   - Handles scroll behavior on navbar
======================================================== */
class NavbarController {
  constructor(updateMenuState) {
    this.updateMenuState = updateMenuState;

    window.addEventListener("pageScroll", this.onScroll.bind(this));
  }

  toggleMenu(currentState) {
    this.updateMenuState(!currentState);
  }

  onScroll(event) {
    const scrollY = event.detail.scrollY;
    const navbar = document.querySelector(".navbar");

    if (!navbar) return;

    if (scrollY > 50) navbar.classList.add("scrolled");
    else navbar.classList.remove("scrolled");
  }
}

/* ========================================================
   MAIN REACT COMPONENT
======================================================== */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navControllerRef = useRef(null);

  useEffect(() => {
    const scrollEmitter = new ScrollEventEmitter();

    // Create controller only once
    navControllerRef.current = new NavbarController(setMenuOpen);

    return () => {
      scrollEmitter.destroy();
    };
  }, []);

  return (
    <>
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="logo">
          <span>Track&nbsp;It</span>
        </div>

        {/* Hamburger */}
        <div
          className="menu-toggle"
          onClick={() =>
            navControllerRef.current.toggleMenu(menuOpen)
          }
        >
          <span></span>
          <span></span>
          <span></span>
        </div>

        {/* Sidebar / Menu Links */}
        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
          <a href="#home">Home</a>
          <a href="#footer">Contact</a>
          <a href="/login" className="nav-btn">Login</a>
          <a href="/register" className="nav-btn signup">Register</a>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section id="home" className="hero">
        <div>
          <h1>
            Smart Attendance<br />
            <span className="grad">Management System</span>
          </h1>

          <p>
            A fast & intelligent system designed to help teachers record
            attendance effortlessly and generate automatic reports.
          </p>

          <div className="hero-buttons">
            <a href="/login">Login Securely</a>
            <a href="/register">Register</a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="footer">
        <p className="footer-contact">
          📩 Contact Us: <span>support@attendanceapp.com</span>
        </p>
        <p>© 2025 Smart Attendance System</p>
      </footer>
    </>
  );
}
