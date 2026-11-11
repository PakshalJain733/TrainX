import React, { useState, useEffect } from "react";
import { ChevronDown } from "lucide-react";

/**
 * Renders grouped navigation sections with collapsible headers for long menus,
 * automatically expanding whichever group contains the active route.
 */
export default function SidebarNavGroups({ groups, collapsed, mobileOpen, isActive, renderItem }) {
  const [openGroups, setOpenGroups] = useState(() => {
    const initial = {};
    groups.forEach((g) => {
      initial[g.id] = true;
    });
    return initial;
  });

  // Ensure the group containing the active route stays expanded
  useEffect(() => {
    const activeGroup = groups.find((g) =>
      g.items.some((item) => isActive(item.url, item.exact))
    );
    if (activeGroup) {
      setOpenGroups((prev) =>
        prev[activeGroup.id] ? prev : { ...prev, [activeGroup.id]: true }
      );
    }
  }, [groups, isActive]);

  const toggleGroup = (id) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Collapsed desktop icon-rail renders flat icons with tooltips
  if (collapsed && !mobileOpen) {
    return (
      <ul className="sidebar-menu">
        {groups.flatMap((g) => g.items).map(renderItem)}
      </ul>
    );
  }

  return (
    <>
      {groups.map((group) => {
        if (!group.items || group.items.length === 0) return null;
        const isOpen = openGroups[group.id] !== false;
        return (
          <div key={group.id} className="sidebar-group-section">
            {group.label && (
              <button
                type="button"
                className="sidebar-group-header"
                onClick={() => toggleGroup(group.id)}
                aria-expanded={isOpen}
              >
                <span>{group.label}</span>
                <ChevronDown
                  size={13}
                  className={`sidebar-group-chevron ${isOpen ? "sidebar-group-chevron--open" : ""}`}
                />
              </button>
            )}
            {isOpen && (
              <ul className="sidebar-menu">
                {group.items.map(renderItem)}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

