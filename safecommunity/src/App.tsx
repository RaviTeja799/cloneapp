import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import SignUp from './pages/SignUp';
import Home from './pages/Home';
import Profile from './pages/Profile';
import ModeratorDashboard from './pages/ModeratorDashboard';
import Footer from './components/Footer';
import './App.css';
import AboutUs from './pages/static/AboutUs';
import TermsOfService from './pages/static/TermsOfService';
import PrivacyPolicy from './pages/static/PrivacyPolicy';
import ContactUs from './pages/static/ContactUs';
// Create a theme with Google colors
const theme = createTheme({
  palette: {
    primary: {
      main: '#4285F4', // Google Blue
      light: '#5e97f6',
      dark: '#3367d6',
    },
    secondary: {
      main: '#DB4437', // Google Red
      light: '#e05d52',
      dark: '#c31c0d',
    },
    error: {
      main: '#DB4437', // Google Red
    },
    warning: {
      main: '#F4B400', // Google Yellow
      light: '#f6c026',
      dark: '#ca9703',
    },
    info: {
      main: '#4285F4', // Google Blue
    },
    success: {
      main: '#0F9D58', // Google Green
      light: '#24b573',
      dark: '#0b8043',
    },
    background: {
      default: '#f8f9fa',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Google Sans", "Roboto", "Arial", sans-serif',
    h1: {
      fontWeight: 400,
      fontSize: '2.5rem',
    },
    h2: {
      fontWeight: 400,
      fontSize: '2rem',
    },
    h3: {
      fontWeight: 400,
      fontSize: '1.75rem',
    },
    h4: {
      fontWeight: 400,
      fontSize: '1.5rem',
    },
    h5: {
      fontWeight: 400,
      fontSize: '1.25rem',
    },
    h6: {
      fontWeight: 500,
      fontSize: '1rem',
    },
  },
  shape: {
    borderRadius: 8,
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: '4px',
          fontWeight: 500,
        },
        containedPrimary: {
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
          '&:hover': {
            boxShadow: '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
          borderRadius: '8px',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Box display="flex" flexDirection="column" minHeight="100vh">
            <Navbar />
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 3 } }}>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/home" element={<Home />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/moderator" element={<ModeratorDashboard />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/contact" element={<ContactUs />} />
              </Routes>
            </Box>
            <Footer />
          </Box>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
