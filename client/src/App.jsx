import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SavedPage from './pages/SavedPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/saved" element={<SavedPage />} />
      </Routes>
    </Router>
  );
}
