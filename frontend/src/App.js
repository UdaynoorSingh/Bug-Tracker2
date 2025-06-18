// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import CreateProject from './pages/CreateProject';
import CreateTicket from './pages/CreateTicket';
import TicketDetails from './pages/TicketDetails';
import AcceptInvitePage from './pages/AcceptInvitePage';
import VerifyEmailPage from './pages/Verify'; 

function App() {
    return (
        <AuthProvider>
            <div className="min-h-screen bg-gray-100">
                <div className="p-4 bg-blue-500 text-white shadow-md">
                    <h1 className="text-2xl font-bold">Bug Tracker</h1>
                </div>
                <Router>
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/accept-invite/:token" element={<AcceptInvitePage />} />
                        <Route path="/verify-email" element={<VerifyEmailPage />} />
                        
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Dashboard />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/projects/new"
                            element={
                                <PrivateRoute>
                                    <CreateProject />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/projects/:id"
                            element={
                                <PrivateRoute>
                                    <ProjectDetails />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/projects/:projectId/tickets/new"
                            element={
                                <PrivateRoute>
                                    <CreateTicket />
                                </PrivateRoute>
                            }
                        />
                        <Route
                            path="/tickets/:id"
                            element={
                                <PrivateRoute>
                                    <TicketDetails />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </Router>
            </div>
        </AuthProvider>
    );
}

export default App;
