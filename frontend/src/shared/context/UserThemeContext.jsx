import React, { createContext, useContext, useState, useEffect } from 'react';

const UserThemeContext = createContext({
  theme: 'dark',
  toggleTheme: () => {},
});

export const UserThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('userAppTheme');
      return saved === 'light' ? 'light' : 'dark';
    }
    return 'dark';
  });

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('userAppTheme', next);
      return next;
    });
  };

  return (
    <UserThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </UserThemeContext.Provider>
  );
};

export const useUserTheme = () => useContext(UserThemeContext);
