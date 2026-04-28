import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TestEditor from './pages/TestEditor';

function App() {
    return (
        <div className="min-h-screen bg-brand-darker">
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                {/* Загорнули сторінки з навігацією у контейнер */}
                <Route path="/tests" element={
                    <main className="container mx-auto px-4 max-w-4xl">
                        <Dashboard />
                    </main>
                } />

                <Route path="/tests/my" element={<div className="container mx-auto text-white mt-10">Мої тести (в розробці)</div>} />

                <Route path="/tests/create" element={
                    <main className="container mx-auto px-4 max-w-4xl">
                        <TestEditor />
                    </main>
                } />

                <Route path="/" element={<Navigate to="/tests" replace />} />
            </Routes>
        </div>
    );
}

export default App;