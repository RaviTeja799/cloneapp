import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  Avatar, 
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import GroupIcon from '@mui/icons-material/Group';
import PsychologyIcon from '@mui/icons-material/Psychology';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import BlockIcon from '@mui/icons-material/Block';

const AboutUs = () => {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center" color="primary" fontWeight="bold">
          About SafeCommunity
        </Typography>
        
        <Typography variant="h6" align="center" color="text.secondary" paragraph sx={{ mb: 6 }}>
          Creating a safer online environment through advanced AI-powered content moderation
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mb: 6, backgroundColor: 'primary.light', color: 'white' }}>
          <Typography variant="h4" gutterBottom>Our Mission</Typography>
          <Typography variant="body1" paragraph>
            SafeCommunity is dedicated to fostering an online environment where users can freely express themselves without fear of encountering harmful content. We believe in the power of technology to create safe spaces for genuine connection and communication.
          </Typography>
          <Typography variant="body1">
            By leveraging cutting-edge AI and machine learning technologies, we're building a platform that automatically identifies and filters out hate speech, offensive content, and violent materials, allowing moderators to focus on edge cases and community building.
          </Typography>
        </Paper>
        
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          How Our Technology Works
        </Typography>
        
        <Grid container spacing={3} sx={{ mb: 6 }}>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <PsychologyIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h5" component="div">
                    Natural Language Processing
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Our system uses Google's Natural Language API to analyze text content, identifying potentially harmful language patterns, hate speech, and offensive terminology with high accuracy. Content is categorized by severity and intent to help moderators make informed decisions.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <FingerprintIcon color="primary" sx={{ fontSize: 40, mr: 2 }} />
                  <Typography variant="h5" component="div">
                    Image Recognition
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Using Google Cloud Vision API, we scan all images for inappropriate visual content. Our system can detect violent imagery, explicit content, and other potentially harmful visual elements before they reach the community.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Community Guidelines
        </Typography>
        
        <Box sx={{ mb: 6 }}>
          <List>
            <ListItem>
              <ListItemIcon>
                <BlockIcon color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="No Hate Speech" 
                secondary="Content that promotes, encourages, or incites hatred against protected groups is not permitted." 
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <BlockIcon color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="No Offensive Content" 
                secondary="Deliberately offensive or provocative content designed to hurt others is prohibited." 
              />
            </ListItem>
            <Divider variant="inset" component="li" />
            
            <ListItem>
              <ListItemIcon>
                <BlockIcon color="error" />
              </ListItemIcon>
              <ListItemText 
                primary="No Violence" 
                secondary="Content that glorifies, promotes, or encourages violence or physical harm is not allowed." 
              />
            </ListItem>
          </List>
        </Box>
        
        <Typography variant="h4" gutterBottom align="center" sx={{ mb: 4 }}>
          Our Team
        </Typography>
        
        <Grid container spacing={4} sx={{ mb: 6 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'primary.main' }}>AJ</Avatar>
              <Typography variant="h6" component="div" gutterBottom>
                Aiden Johnson
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Founder & CEO
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'secondary.main' }}>SL</Avatar>
              <Typography variant="h6" component="div" gutterBottom>
                Sophia Liu
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Chief Technology Officer
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'success.main' }}>MP</Avatar>
              <Typography variant="h6" component="div" gutterBottom>
                Michael Patel
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Lead AI Researcher
              </Typography>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
              <Avatar sx={{ width: 100, height: 100, mb: 2, bgcolor: 'warning.main' }}>EW</Avatar>
              <Typography variant="h6" component="div" gutterBottom>
                Emma Wilson
              </Typography>
              <Typography variant="body2" color="text.secondary" align="center">
                Director of Community
              </Typography>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default AboutUs;