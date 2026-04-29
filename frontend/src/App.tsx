import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import TestEditor from './pages/TestEditor';
import TakeTest from './pages/TakeTest';
import Results from './pages/Results';
import MyTests from './pages/MyTests';
import TestStats from './pages/TestStats';

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

                <Route path="/tests/my" element={
                    <main className="container mx-auto px-4 max-w-4xl">
                        <MyTests />
                    </main>
                } />

                <Route path="/attempt/:testId" element={
                    <main className="container mx-auto px-4 max-w-4xl pt-8">
                        <TakeTest />
                    </main>
                } />

                <Route path="/results/:attemptId" element={
                    <main className="container mx-auto px-4 max-w-4xl">
                        <Results />
                    </main>
                } />

                <Route path="/tests/:testId/stats" element={
                    <main className="container mx-auto px-4 max-w-4xl">
                        <TestStats />
                    </main>
                } />

                <Route path="/tests/create" element={
                    <main className="container mx-auto px-4 max-w-4xl">
                        <TestEditor />
                    </main>
                } />

                <Route path="/tests/edit/:testId" element={
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