import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Analyses } from './pages/Analyses';
import { Analysts } from './pages/Analysts';
import { Supervisors } from './pages/Supervisors';
import { Tracks } from './pages/Tracks';
import { Logs } from './pages/Logs';
import { Profile } from './pages/Profile';
import { Profiles } from './pages/Profiles';

export default function App() {
  React.useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, []);

  return (
    <BrowserRouter>
      <Toaster position="top-right" />
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/nova-analise" element={<Analyses mode="form" />} />
          <Route path="/historico" element={<Analyses mode="list" />} />
          <Route path="/analistas" element={<Analysts />} />
          <Route path="/supervisores" element={<Supervisors />} />
          <Route path="/esteiras" element={<Tracks />} />
          <Route path="/logs" element={<Logs />} />
          <Route path="/perfis" element={<Profiles />} />
          <Route path="/perfil" element={<Profile />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
