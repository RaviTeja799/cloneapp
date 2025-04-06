import { Box, Container, Typography, Paper, Divider, List, ListItem, ListItemText } from '@mui/material';

const TermsOfService = () => {
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Terms of Service
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Last updated: April 6, 2025
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          1. Acceptance of Terms
        </Typography>
        <Typography variant="body1" paragraph>
          By accessing or using SafeCommunity, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions, you must not access or use our services.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          2. Description of Service
        </Typography>
        <Typography variant="body1" paragraph>
          SafeCommunity provides a platform for users to share content, interact with other users, and create online communities. Our service includes automated content moderation to maintain community standards.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          3. User Accounts
        </Typography>
        <Typography variant="body1" paragraph>
          To use certain features of our Service, you may be required to create an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="3.1 Account Requirements" 
              secondary="You must be at least 13 years old to create an account. If you are under 18, you must have parental consent." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="3.2 Account Security" 
              secondary="You are responsible for maintaining the security of your account and password. SafeCommunity cannot and will not be liable for any loss or damage from your failure to comply with this security obligation." 
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          4. Content Guidelines
        </Typography>
        <Typography variant="body1" paragraph>
          Users are prohibited from posting content that:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="4.1 Hate Speech" 
              secondary="Content that promotes, encourages, or incites hatred against protected characteristics." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="4.2 Violence" 
              secondary="Content that glorifies, promotes, or encourages violence or physical harm against individuals or groups." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="4.3 Harassment" 
              secondary="Content that harasses, intimidates, or bullies any individual." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="4.4 Illegal Activities" 
              secondary="Content that promotes illegal activities or infringes on the legal rights of others." 
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          5. Content Moderation
        </Typography>
        <Typography variant="body1" paragraph>
          SafeCommunity employs automated and human moderation to enforce our content guidelines. Content that violates our guidelines may be removed, and repeated violations may result in account suspension or termination.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          6. Intellectual Property
        </Typography>
        <Typography variant="body1" paragraph>
          By submitting content to SafeCommunity, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, translate, and distribute such content across our platform.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          7. Limitation of Liability
        </Typography>
        <Typography variant="body1" paragraph>
          SafeCommunity and its affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your access to or use of, or inability to access or use, the service.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          8. Changes to Terms
        </Typography>
        <Typography variant="body1" paragraph>
          We reserve the right to modify these terms at any time. We will provide notice of significant changes by updating the date at the top of these terms and by maintaining a current version of the terms at safecommunity.com/terms.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          9. Governing Law
        </Typography>
        <Typography variant="body1" paragraph>
          These Terms shall be governed by the laws of the jurisdiction in which SafeCommunity is registered, without regard to its conflict of law provisions.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          10. Contact
        </Typography>
        <Typography variant="body1" paragraph>
          If you have any questions about these Terms, please contact us at legal@safecommunity.com.
        </Typography>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 2 }}>
          <Typography variant="body2" align="center">
            By using SafeCommunity, you acknowledge that you have read and understand these Terms of Service and agree to be bound by them.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default TermsOfService;