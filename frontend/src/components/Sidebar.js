// src/components/Sidebar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext'; 

const Sidebar = ({ onLogout }) => {
    const location = useLocation();
    const { currentUser } = useAuth(); 

    return (
        <aside className="bg-white w-64 min-h-screen border-r hidden md:block">
            <div className="p-6">
                <h2 className="text-2xl font-bold text-blue-700">Bug Tracker</h2>
                {currentUser && (
                    <div className="mt-3 text-sm text-gray-700">
                        <p className="font-bold">{currentUser.name}</p>
                        <p>{currentUser.email}</p>
                        <p className="italic text-gray-500 capitalize">{currentUser.role || "User"}</p>
                    </div>
                )}

                <nav className="flex flex-col gap-4 mt-8">
                    <Link to="/dashboard" className={`py-2 px-4 rounded hover:bg-blue-50 ${location.pathname === '/dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>Dashboard</Link>
                    <Link to="/projects/new" className={`py-2 px-4 rounded hover:bg-blue-50 ${location.pathname === '/projects/new' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>Create Project</Link>
                    <Link to="/projects" className={`py-2 px-4 rounded hover:bg-blue-50 ${location.pathname.startsWith('/projects') && location.pathname !== '/projects/new' ? 'bg-blue-100 text-blue-700' : 'text-gray-700'}`}>Projects</Link>
                    <button onClick={onLogout} className="mt-8 py-2 px-4 rounded bg-red-600 text-white hover:bg-red-700">Logout</button>
                </nav>
            </div>
        </aside>
    );
};

export default Sidebar;
