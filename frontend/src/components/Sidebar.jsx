import { NavLink } from "react-router-dom";

function Sidebar() {
  const navItems = [
    { path: "/dashboard", label: "Dashboard" },
    { path: "/datasets", label: "Datasets" },
    { path: "/pipelines", label: "Pipelines" },
    { path: "/runs", label: "Runs" },
    { path: "/alerts", label: "Alerts" },
  ];

  return (
    <aside className="sidebar">
      <div>
        <h2>Pipeline Monitor</h2>
      </div>

      <nav>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => (isActive ? "active" : "")}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default Sidebar;