import { Box, Container, Typography, Link, Grid, IconButton, Divider } from '@mui/material';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';
import InstagramIcon from '@mui/icons-material/Instagram';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        py: 4,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.primary.main,
        color: 'white'
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} justifyContent="space-between">
          <Grid component="div" item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              SafeCommunity
            </Typography>
            <Typography variant="body2">
              Creating a safe online environment through advanced content moderation and community guidelines.
            </Typography>
          </Grid>
          <Grid component="div" item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Quick Links
            </Typography>
            <Link href="/" color="inherit" sx={{ display: 'block', mb: 1 }}>
              Home
            </Link>
            <Link href="/about" color="inherit" sx={{ display: 'block', mb: 1 }}>
              About Us
            </Link>
            <Link href="/moderator" color="inherit" sx={{ display: 'block', mb: 1 }}>
              Moderator Dashboard
            </Link>
            <Link href="/profile" color="inherit" sx={{ display: 'block', mb: 1 }}>
              My Profile
            </Link>
          </Grid>
          <Grid component="div" item xs={12} md={4}>
            <Typography variant="h6" gutterBottom>
              Connect With Us
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <IconButton color="inherit" aria-label="Facebook">
                <FacebookIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Twitter">
                <TwitterIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="Instagram">
                <InstagramIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="LinkedIn">
                <LinkedInIcon />
              </IconButton>
              <IconButton color="inherit" aria-label="GitHub">
                <GitHubIcon />
              </IconButton>
            </Box>
          </Grid>
        </Grid>
        
        <Divider sx={{ my: 3, backgroundColor: 'rgba(255,255,255,0.2)' }} />
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="inherit">
            © {new Date().getFullYear()} All Rights Reserved | SafeCommunity
          </Typography>
          <Box sx={{ mt: { xs: 2, sm: 0 } }}>
            <Link color="inherit" href="/privacy" sx={{ mx: 1 }}>
              Privacy Policy
            </Link>
            <Link color="inherit" href="/terms" sx={{ mx: 1 }}>
              Terms of Service
            </Link>
            <Link color="inherit" href="/contact" sx={{ mx: 1 }}>
              Contact Us
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;