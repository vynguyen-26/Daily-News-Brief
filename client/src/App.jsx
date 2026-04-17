import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SavedPage from './pages/SavedPage';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';

export default function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/HomePage" element={<HomePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/signup" element={<CreateAccount />} />
      </Routes>
    </Router>
  );
}
