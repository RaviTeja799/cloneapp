import { useEffect, useState } from 'react';
import {
  Container,
  Paper,
  Box,
  Typography,
  Avatar,
  Grid,
  Divider,
  Card,
  CardContent,
  CircularProgress,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { getUserPosts, PostData } from '../firebase/posts';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    const fetchUserPosts = async () => {
      try {
        const userPosts = await getUserPosts(currentUser.uid);
        setPosts(userPosts);
      } catch (error) {
        console.error('Error fetching user posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [currentUser, navigate]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Filter posts based on status
  const getFilteredPosts = () => {
    switch (tabValue) {
      case 0: // All posts
        return posts;
      case 1: // Approved posts
        return posts.filter(post => post.status === 'APPROVED');
      case 2: // Pending posts
        return posts.filter(post => post.status === 'PENDING');
      case 3: // Rejected posts
        return posts.filter(post => post.status === 'REJECTED');
      default:
        return posts;
    }
  };

  if (!currentUser || !userData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {/* Profile Header */}
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} alignItems="center">
          <Avatar
            sx={{
              width: 100,
              height: 100,
              fontSize: 40,
              bgcolor: '#e91e63',
              mb: { xs: 2, sm: 0 },
              mr: { sm: 4 }
            }}
          >
            {userData.name.charAt(0)}
          </Avatar>

          <Box>
            <Typography variant="h4" gutterBottom>
              {userData.name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {userData.email}
            </Typography>

            <Box display="flex" mt={2}>
              <Box mr={4}>
                <Typography variant="body2" color="text.secondary">
                  Posts
                </Typography>
                <Typography variant="h6">{posts.length}</Typography>
              </Box>
              <Box mr={4}>
                <Typography variant="body2" color="text.secondary">
                  Followers
                </Typography>
                <Typography variant="h6">{userData.followers}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Following
                </Typography>
                <Typography variant="h6">{userData.following}</Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Posts Section */}
      <Paper elevation={3} sx={{ mt: 4, p: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ mb: 2 }}
        >
          <Tab label={`All (${posts.length})`} />
          <Tab label={`Approved (${posts.filter(p => p.status === 'APPROVED').length})`} />
          <Tab label={`Pending (${posts.filter(p => p.status === 'PENDING').length})`} />
          <Tab label={`Rejected (${posts.filter(p => p.status === 'REJECTED').length})`} />
        </Tabs>

        <Divider />

        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : getFilteredPosts().length === 0 ? (
          <Box textAlign="center" p={4}>
            <Typography variant="body1" color="text.secondary">
              No posts to display
            </Typography>
          </Box>
        ) : (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {getFilteredPosts().map((post) => (
              <Grid item xs={12} key={post.post_id}>
                <Card variant="outlined">
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        Post #{post.post_id.substring(post.post_id.length - 6)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: post.status === 'APPROVED' ? 'success.main' :
                                 post.status === 'REJECTED' ? 'error.main' :
                                 'warning.main'
                        }}
                      >
                        {post.status}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(post.created_at).toLocaleString()}
                    </Typography>
                    
                    <Divider sx={{ my: 1 }} />
                    
                    {post.text_content && (
                      <Typography variant="body1" paragraph>
                        {post.text_content}
                      </Typography>
                    )}
                    
                    {post.image_url && (
                      <Box 
                        component="img" 
                        src={post.image_url}
                        alt="Post image" 
                        sx={{ 
                          maxHeight: 200, 
                          maxWidth: '100%', 
                          objectFit: 'contain',
                          display: 'block',
                          mx: 'auto'
                        }}
                      />
                    )}
                    
                    {post.label && (
                      <Box mt={2} bgcolor="#f5f5f5" p={1} borderRadius={1}>
                        <Typography variant="caption" display="block">
                          <strong>Label:</strong> {post.label}
                          {post.confidence && ` (${(post.confidence * 100).toFixed(2)}% confidence)`}
                        </Typography>
                        {post.summary && (
                          <Typography variant="caption" display="block">
                            <strong>Summary:</strong> {post.summary}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    </Container>
  );
};

export default Profile;