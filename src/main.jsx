import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "../style.css";
import { getCurrentUser } from "../storage.js";
import { logout } from "../auth.js";
import {
  landingPage,
  signupPage,
  signupPageInit,
  loginPage,
  loginPageInit,
  dashboardPage,
  dashboardPageInit,
  entityPage,
  entityPageInit,
  componentPage,
  componentPageInit,
  myFeedbackPage,
} from "../userPages.js";
import {
  adminLoginPage,
  adminLoginPageInit,
  adminDashboardPage,
  adminDashboardPageInit,
  adminManagePage,
  adminManagePageInit,
  adminFeedbackPage,
  adminFeedbackPageInit,
  adminRequestsPage,
  adminRequestsPageInit,
} from "../adminPages.js";

function setRoute(route) {
  window.location.hash = route ? `#${route}` : "";
}

function Navbar({ route, user, onLogout }) {
  const navItem = (hash, label) => (
    <a
      href={`#${hash}`}
      data-nav={hash}
      className={route === hash || (hash === "admin" && route === "admin") ? "active" : ""}
    >
      {label}
    </a>
  );

  let links = null;
  let right = null;

  if (!user) {
    right = (
      <>
        <a href="#login" data-nav="login" className={route === "login" ? "active" : ""}>Log In</a>
        <a href="#signup" data-nav="signup" className={route === "signup" ? "active" : ""}>Sign Up</a>
      </>
    );
  } else if (user.role === "admin") {
    links = (
      <>
        {navItem("admin", "Dashboard")}
        {navItem("admin/manage", "Entities")}
        {navItem("admin/feedback", "Feedback")}
        {navItem("admin/requests", "Requests")}
      </>
    );
    right = <><span className="nav-user">{user.name}</span><button className="btn btn-sm" onClick={onLogout}>Log Out</button></>;
  } else {
    links = <>{navItem("dashboard", "Dashboard")}{navItem("my-feedback", "My Feedback")}</>;
    right = <><span className="nav-user">{user.name}</span><button className="btn btn-sm" onClick={onLogout}>Log Out</button></>;
  }

  return (
    <nav className="navbar">
      <div className="nav-brand">
        <img src="/prism_logo.png" alt="PRISM" className="nav-logo" />
        <a href="#" onClick={(event) => { event.preventDefault(); setRoute(""); }}>PRISM</a>
      </div>
      <div className="nav-links">{links}</div>
      <div className="nav-right">{right}</div>
    </nav>
  );
}

function getPage(route, param, user) {
  if (route === "" || route === "landing") return { html: landingPage() };
  if (route === "signup") return user ? null : { html: signupPage(), init: signupPageInit };
  if (route === "login") return user ? null : { html: loginPage(), init: loginPageInit };
  if (route === "admin-login") return { html: adminLoginPage(), init: adminLoginPageInit };
  if (route === "dashboard" && user?.role === "user") return { html: dashboardPage(), init: dashboardPageInit };
  if (route === "entity" && user) return { html: entityPage(param), init: () => entityPageInit(param) };
  if (route === "component" && user) return { html: componentPage(param), init: () => componentPageInit(param) };
  if (route === "my-feedback" && user?.role === "user") return { html: myFeedbackPage() };
  if (route === "admin" && user?.role === "admin") {
    if (!param) return { html: adminDashboardPage(), init: adminDashboardPageInit };
    if (param === "manage") return { html: adminManagePage(), init: adminManagePageInit };
    if (param === "feedback") return { html: adminFeedbackPage(), init: adminFeedbackPageInit };
    if (param === "requests") return { html: adminRequestsPage(), init: adminRequestsPageInit };
  }
  return null;
}

function App() {
  const [hash, setHash] = useState(window.location.hash);
  const [user, setUser] = useState(getCurrentUser());

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash);
      setUser(getCurrentUser());
      window.scrollTo(0, 0);
    };
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const { route, param } = useMemo(() => {
    const parts = hash.replace(/^#/, "").split("/");
    return { route: parts[0], param: parts[1] };
  }, [hash]);

  const page = getPage(route, param, user);
  useEffect(() => {
    if (!page) {
      setRoute(user?.role === "admin" ? "admin" : user ? "dashboard" : "login");
      return;
    }
    if (page.init) page.init();
    const handleNavigation = (event) => {
      const target = event.target.closest("[data-nav]");
      if (!target) return;
      event.preventDefault();
      const nav = target.getAttribute("data-nav");
      const id = target.getAttribute("data-id");
      setRoute(id ? `${nav}/${id}` : nav);
    };
    const app = document.getElementById("app");
    app.addEventListener("click", handleNavigation);
    return () => app.removeEventListener("click", handleNavigation);
  }, [page, user]);

  const handleLogout = () => {
    logout();
    setUser(null);
    setRoute("");
  };

  return (
    <>
      <Navbar route={route} user={user} onLogout={handleLogout} />
      <main dangerouslySetInnerHTML={{ __html: page?.html || "" }} />
    </>
  );
}

createRoot(document.getElementById("app")).render(<App />);
