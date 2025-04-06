import { Box, Container, Typography, Paper, Divider, List, ListItem, ListItemText } from '@mui/material';

const PrivacyPolicy = () => {
  return (
    <Container maxWidth="lg" sx={{ my: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          Privacy Policy
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Last updated: April 6, 2025
        </Typography>

        <Divider sx={{ mb: 4 }} />

        <Typography variant="body1" paragraph>
          SafeCommunity is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our platform.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          1. Information We Collect
        </Typography>
        <Typography variant="body1" paragraph>
          We collect several types of information from and about users of our platform, including:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="1.1 Personal Information" 
              secondary="Information that can be used to identify you, such as your name, email address, and profile information." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="1.2 User Content" 
              secondary="Content you post, upload, or otherwise share on our platform." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="1.3 Usage Data" 
              secondary="Information about how you access and use our platform, including your IP address, browser type, device information, and the pages you visit." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="1.4 Content Analysis Data" 
              secondary="When you submit content, it may be analyzed by our automated moderation systems to ensure compliance with our content guidelines." 
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          2. How We Use Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We use the information we collect to:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="2.1 Provide and Maintain Our Platform" 
              secondary="Deliver the services you request, process transactions, and send notifications related to your account." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="2.2 Improve User Experience" 
              secondary="Analyze usage patterns to improve our platform and develop new features." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="2.3 Content Moderation" 
              secondary="Review and moderate user-generated content to maintain community standards." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="2.4 Communication" 
              secondary="Communicate with you about your account, respond to inquiries, and send updates about our services." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="2.5 Security" 
              secondary="Detect, prevent, and address technical issues, fraudulent activities, or violations of our terms." 
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          3. Sharing Your Information
        </Typography>
        <Typography variant="body1" paragraph>
          We may share your information with:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="3.1 Service Providers" 
              secondary="Third-party vendors who perform services on our behalf, such as hosting, analytics, and payment processing." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="3.2 Legal Requirements" 
              secondary="When required by law, subpoena, or other legal process, or to protect our rights or the safety of others." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="3.3 Business Transfers" 
              secondary="In connection with a merger, acquisition, or sale of all or a portion of our assets." 
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          4. Data Security
        </Typography>
        <Typography variant="body1" paragraph>
          We implement appropriate technical and organizational measures to protect your information from unauthorized access, loss, or alteration. However, no internet transmission is entirely secure, and we cannot guarantee the security of your data.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          5. Data Retention
        </Typography>
        <Typography variant="body1" paragraph>
          We retain your information for as long as your account is active or as needed to provide services, comply with legal obligations, resolve disputes, and enforce our agreements.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          6. Your Rights
        </Typography>
        <Typography variant="body1" paragraph>
          Depending on your location, you may have certain rights regarding your personal information, including:
        </Typography>
        <List>
          <ListItem>
            <ListItemText 
              primary="6.1 Access and Correction" 
              secondary="You can access and update your account information at any time through your account settings." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="6.2 Deletion" 
              secondary="You can request deletion of your account and personal information." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="6.3 Data Portability" 
              secondary="You can request a copy of your personal information in a structured, commonly used format." 
            />
          </ListItem>
          <ListItem>
            <ListItemText 
              primary="6.4 Objection" 
              secondary="You can object to certain processing of your personal information." 
            />
          </ListItem>
        </List>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          7. Children's Privacy
        </Typography>
        <Typography variant="body1" paragraph>
          Our platform is not intended for children under 13. We do not knowingly collect personal information from children under 13. If we learn we have collected information from a child under 13, we will delete that information.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          8. Third-Party Links
        </Typography>
        <Typography variant="body1" paragraph>
          Our platform may contain links to third-party websites. We are not responsible for the privacy practices or content of these websites. We encourage you to read the privacy policies of any third-party website you visit.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          9. Changes to This Privacy Policy
        </Typography>
        <Typography variant="body1" paragraph>
          We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date.
        </Typography>

        <Typography variant="h5" gutterBottom sx={{ mt: 3 }}>
          10. Contact Us
        </Typography>
        <Typography variant="body1" paragraph>
          If you have questions or concerns about this Privacy Policy, please contact us at privacy@safecommunity.com.
        </Typography>

        <Box sx={{ mt: 4, p: 3, bgcolor: 'rgba(0, 0, 0, 0.03)', borderRadius: 2 }}>
          <Typography variant="body2" align="center">
            By using SafeCommunity, you consent to our Privacy Policy and our collection, use, and sharing of your information as described.
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default PrivacyPolicy;