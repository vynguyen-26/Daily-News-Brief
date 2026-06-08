import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import SavedPage from './pages/SavedPage';
import Login from './pages/Login';
import CreateAccount from './pages/CreateAccount';
import ArticleDetail from './pages/ArticleDetail';
import { isCurrentUserAuthenticated } from './utils/savedArticles';

function RequireAuth({ children }) {
  const location = useLocation();

  if (!isCurrentUserAuthenticated()) {
    // Send guests to login, then return them to the protected page afterward.
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return children;
}

export default function App() {
  return (
    <Router>
      <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/HomePage" element={<Navigate to="/" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/saved"
            element={
              <RequireAuth>
                <SavedPage />
              </RequireAuth>
            }
          />
          <Route
            path="/article/:articleId"
            element={
              <RequireAuth>
                <ArticleDetail />
              </RequireAuth>
            }
          />
          <Route path="/signup" element={<CreateAccount />} />
      </Routes>
    </Router>
  );
}
