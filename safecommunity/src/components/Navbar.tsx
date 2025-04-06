import { useState } from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Avatar, 
  Menu, 
  MenuItem, 
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  useMediaQuery,
  useTheme
} from '@mui/material';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logoutUser } from '../firebase/auth';
import { 
  MenuIcon, 
  HomeIcon, 
  DashboardIcon, 
  PersonIcon, 
  LogoutIcon, 
  ShieldIcon 
} from '../utils/uiUtils';

const Navbar = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      navigate('/');
    } catch (error) {
      console.error('Failed to log out', error);
    }
    handleClose();
    setDrawerOpen(false);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };
  const getAvatarColor = () => {
    // Use behavior score to determine avatar color if available
    if (userData?.behavior_score !== undefined) {
      if (userData.behavior_score > 90) return theme.palette.success.main; // Green for good users
      if (userData.behavior_score > 70) return theme.palette.info.main; // Blue for average users
      if (userData.behavior_score > 40) return theme.palette.warning.main; // Yellow for warning users
      return theme.palette.error.main; // Red for problematic users
    }
    return theme.palette.primary.main; // Default color
  };

  const drawerContent = (
    <Box
      sx={{ width: 250 }}
      role="presentation"
    >
      {currentUser && (
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mb: 1,
              bgcolor: getAvatarColor()
            }}
          >
            {userData?.name.charAt(0) || 'U'}
          </Avatar>
          <Typography variant="subtitle1">{userData?.name || 'User'}</Typography>
          <Typography variant="body2" color="text.secondary">{userData?.email}</Typography>
          {userData?.isModerator && (
            <Box sx={{ mt: 1, display: 'flex', alignItems: 'center' }}>
              <ShieldIcon color="primary" fontSize="small" sx={{ mr: 0.5 }} />
              <Typography variant="body2" color="primary.main">Moderator</Typography>
            </Box>
          )}
        </Box>
      )}
      
      <Divider />
      
      <List>
        {currentUser ? (
          <>
            <ListItem 
              component={Link} 
              to="/home" 
              onClick={() => setDrawerOpen(false)}
              selected={location.pathname === '/home'}
              component="button"
            >
              <ListItemIcon>
                <HomeIcon color={location.pathname === '/home' ? 'primary' : undefined} />
              </ListItemIcon>
              <ListItemText primary="Home" />
            </ListItem>
            
            <ListItem 
              component={Link} 
              to="/profile" 
              onClick={() => setDrawerOpen(false)}
              selected={location.pathname === '/profile'}
              button
            >
              <ListItemIcon>
                <PersonIcon color={location.pathname === '/profile' ? 'primary' : undefined} />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            
            {userData?.isModerator && (
              <ListItem 
                component={Link} 
                to="/moderator" 
                onClick={() => setDrawerOpen(false)}
                selected={location.pathname === '/moderator'}
                button
              >
                <ListItemIcon>
                  <DashboardIcon color={location.pathname === '/moderator' ? 'primary' : undefined} />
                </ListItemIcon>
                <ListItemText primary="Moderator Dashboard" />
              </ListItem>
            )}
            
            <Divider sx={{ my: 1 }} />
            
            <ListItem component="button" onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </>
        ) : (
          <>
            <ListItem 
              component={Link} 
              to="/login" 
              onClick={() => setDrawerOpen(false)}
              selected={location.pathname === '/login'}
              button
            >
              <ListItemIcon>
                <PersonIcon color={location.pathname === '/login' ? 'primary' : undefined} />
              </ListItemIcon>
              <ListItemText primary="Login" />
            </ListItem>
            
            <ListItem 
              component={Link} 
              to="/signup" 
              onClick={() => setDrawerOpen(false)}
              selected={location.pathname === '/signup'}
              button
            >
              <ListItemIcon>
                <PersonIcon color={location.pathname === '/signup' ? 'primary' : undefined} />
              </ListItemIcon>
              <ListItemText primary="Sign Up" />
            </ListItem>
          </>
        )}
      </List>
    </Box>
  );

  return (
    <AppBar position="sticky" elevation={2} sx={{ backgroundColor: theme.palette.primary.main }}>
      <Toolbar>
        {isMobile && (
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={toggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
        )}

        <Typography 
          variant="h6" 
          component={Link} 
          to={currentUser ? "/home" : "/"} 
          sx={{ 
            flexGrow: 1, 
            textDecoration: 'none', 
            color: 'white',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center'
          }}
        >
          <ShieldIcon sx={{ mr: 1 }} />
          SafeCommunity
        </Typography>

        {/* Desktop Navigation */}
        {!isMobile && currentUser ? (
          <Box display="flex" alignItems="center">
            <Button 
              color="inherit" 
              component={Link} 
              to="/home"
              sx={{ 
                mr: 1,
                borderBottom: location.pathname === '/home' ? '2px solid white' : 'none'
              }}
            >
              Home
            </Button>
            
            {userData?.isModerator && (
              <Button 
                color="inherit" 
                component={Link} 
                to="/moderator" 
                sx={{ 
                  mr: 1,
                  borderBottom: location.pathname === '/moderator' ? '2px solid white' : 'none'
                }}
              >
                Moderator
              </Button>
            )}
            
            <IconButton 
              onClick={handleProfileClick}
              size="medium"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              color="inherit"
              sx={{ 
                ml: 0.5,
                border: '2px solid',
                borderColor: getAvatarColor()
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: getAvatarColor()
                }}
              >
                {userData?.name?.charAt(0) || 'U'}
              </Avatar>
            </IconButton>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem 
                onClick={() => {
                  navigate('/profile');
                  handleClose();
                }}
              >
                Profile
              </MenuItem>
              <MenuItem onClick={handleLogout}>Logout</MenuItem>
            </Menu>
          </Box>
        ) : !isMobile && !currentUser ? (
          <Box>
            <Button 
              color="inherit" 
              component={Link} 
              to="/login"
              sx={{ 
                mr: 1,
                borderBottom: location.pathname === '/login' ? '2px solid white' : 'none'
              }}
            >
              Login
            </Button>
            <Button 
              variant="outlined" 
              color="inherit" 
              component={Link} 
              to="/signup"
              sx={{ 
                borderColor: 'white',
                '&:hover': {
                  borderColor: 'white',
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              Sign Up
            </Button>
          </Box>
        ) : null}
      </Toolbar>
      
      {/* Mobile Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer}
      >
        {drawerContent}
      </Drawer>
    </AppBar>
  );
};

export default Navbar;