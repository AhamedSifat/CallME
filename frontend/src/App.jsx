import { BrowserRouter as Router, Routes, Route } from 'react-router';
import Login from './pages/user-login/Login';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path='/user-login' element={<Login />} />
      </Routes>
    </Router>
  );
};

export default App;
