import { Container, Typography, Paper, Box, TextField, Button, Grid } from '@mui/material';

const ContactUs = () => {
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom align="center">
          Contact Us
        </Typography>
        <Typography variant="body1" paragraph align="center">
          Have questions or feedback? We'd love to hear from you.
        </Typography>
        
        <Box component="form" sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Name"
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                variant="outlined"
                type="email"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject"
                variant="outlined"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Message"
                variant="outlined"
                multiline
                rows={6}
                required
              />
            </Grid>
            <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                size="large"
                sx={{ minWidth: 150 }}
              >
                Send Message
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        <Box mt={6}>
          <Typography variant="h5" gutterBottom>
            Other Ways to Reach Us
          </Typography>
          <Typography variant="body1">
            <strong>Email:</strong> support@safecommunity.example.com
          </Typography>
          <Typography variant="body1">
            <strong>Phone:</strong> +1 (555) 123-4567
          </Typography>
          <Typography variant="body1">
            <strong>Address:</strong> 123 Community Drive, Safety City, SC 12345
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default ContactUs;