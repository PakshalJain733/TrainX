import React, { createContext, useContext, useState } from "react";
import "./ui.css";

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value, onValueChange, children, className = "" }) {
  const [selectedTab, setSelectedTab] = useState(defaultValue || value);

  const currentTab = value !== undefined ? value : selectedTab;
  const setTab = (val) => {
    if (value === undefined) setSelectedTab(val);
    if (onValueChange) onValueChange(val);
  };

  return (
    <TabsContext.Provider value={{ currentTab, setTab }}>
      <div className={`ui-tabs ${className}`}>
        {children}
      </div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className = "" }) {
  return (
    <div className={`ui-tabs-list ${className}`}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, className = "" }) {
  const { currentTab, setTab } = useContext(TabsContext);
  const isActive = currentTab === value;

  return (
    <button
      type="button"
      className={`ui-tabs-trigger ${isActive ? "ui-tabs-trigger--active" : ""} ${className}`}
      onClick={() => setTab(value)}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className = "" }) {
  const { currentTab } = useContext(TabsContext);
  if (currentTab !== value) return null;

  return (
    <div className={`ui-tabs-content ${className}`}>
      {children}
    </div>
  );
}
