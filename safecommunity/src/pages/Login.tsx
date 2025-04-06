import { useState } from 'react';
import { 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Container, 
  Paper, 
  Grid, 
  Divider,
  Card,
  CardMedia,
  CardContent
} from '@mui/material';
import { useNavigate, Link } from 'react-router-dom';
import { signInWithEmail, signInWithGoogle, isModeratorEmail } from '../firebase/auth';

// Icons for the safe community principles
const safetyIcons = [
  { 
    title: 'No Hate Speech',
    icon: '/icons/no-hate-speech.svg',
    alt: 'No Hate Speech Icon'
  },
  { 
    title: 'No Offensive Content',
    icon: '/icons/no-offensive-content.svg',
    alt: 'No Offensive Content Icon'
  },
  { 
    title: 'No Violence',
    icon: '/icons/no-violence.svg',
    alt: 'No Violence Icon'
  }
];

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!email) {
        setError('Email is required');
        return;
      }
      
      if (!password) {
        setError('Password is required for login');
        return;
      }
      
      await signInWithEmail(email, password);
      navigate('/home');
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please check your credentials.');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else {
        setError('Failed to log in. Please try again later.');
      }
      console.error(error);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    
    try {
      await signInWithGoogle();
      navigate('/home');
    } catch (error) {
      setError('Failed to log in with Google.');
      console.error(error);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Grid container spacing={4}>
          <Grid item xs={12} md={7}>
            <Typography variant="h4" component="h1" gutterBottom>
              Welcome to SafeCommunity
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" paragraph>
              A safe space for positive interaction and respectful dialogue.
            </Typography>
            
            <Box component="form" onSubmit={handleEmailLogin} noValidate sx={{ mt: 3 }}>
              {error && (
                <Typography color="error" sx={{ mb: 2 }}>
                  {error}
                </Typography>
              )}
              
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleEmailChange}
              />
              
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
              >
                Login
              </Button>
              
              <Divider sx={{ my: 2 }}>or</Divider>
              
              <Button
                fullWidth
                variant="outlined"
                onClick={handleGoogleLogin}
                sx={{ mb: 2 }}
              >
                Sign in with Google
              </Button>
              
              <Grid container justifyContent="flex-end">
                <Grid item>
                  <Link to="/signup">
                    <Typography variant="body2">
                      Don't have an account? Sign Up
                    </Typography>
                  </Link>
                </Grid>
              </Grid>
            </Box>
          </Grid>
          
          <Grid item xs={12} md={5}>
            <Typography variant="h6" gutterBottom>
              Our Community Principles
            </Typography>
            
            <Grid container spacing={2}>
              {safetyIcons.map((icon, index) => (
                <Grid item xs={12} key={index}>
                  <Card variant="outlined">
                    <CardContent sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box 
                        component="img" 
                        src={icon.icon}
                        alt={icon.alt}
                        sx={{ 
                          width: 60, 
                          height: 60, 
                          mr: 2,
                          filter: 'invert(13%) sepia(95%) saturate(7466%) hue-rotate(0deg) brightness(94%) contrast(115%)'
                        }}
                        onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                          // If image fails to load, display a placeholder text
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      <Typography variant="subtitle1">{icon.title}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default Login;