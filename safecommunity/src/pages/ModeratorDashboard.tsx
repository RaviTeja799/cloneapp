import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Paper,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  Tabs,
  Tab,
  Avatar,
  Badge,
  useTheme,
  useMediaQuery,
  LinearProgress
} from '@mui/material';
import { 
  CheckCircle as CheckCircleIcon, 
  Cancel as CancelIcon, 
  Warning as WarningIcon,
  Info as InfoIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { getPendingPosts, updatePostStatus, PostData, listenToPendingPostsOptimized } from '../firebase/posts';
import { useNavigate } from 'react-router-dom';
import { renderTextWithNewlines } from '../utils/contentSanitizer';

// Utility functions for moderator dashboard
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  
  return date.toLocaleDateString();
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    case 'PENDING':
      return 'warning';
    default:
      return 'default';
  }
};

const ModeratorDashboard = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [pendingPosts, setPendingPosts] = useState<PostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [moderationStats, setModerationStats] = useState({
    totalReviewed: 0,
    approved: 0,
    rejected: 0,
    pending: 0
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Group posts by user
  const postsByUser = pendingPosts.reduce((acc, post) => {
    const userId = post.user_id;
    if (!acc[userId]) {
      acc[userId] = {
        user_id: userId,
        user_name: post.user_name,
        posts: []
      };
    }
    acc[userId].posts.push(post);
    return acc;
  }, {} as Record<string, { user_id: string; user_name: string; posts: PostData[] }>);
  
  const userGroups = Object.values(postsByUser);

  // Check if user is a moderator
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userData && !userData.isModerator) {
      navigate('/home');
    }
  }, [currentUser, userData, navigate]);

  // Use real-time listener for pending posts with optimization
  useEffect(() => {
    if (!userData?.isModerator) return;
    
    setLoading(true);
    
    // First get initial data
    getPendingPosts()
      .then(posts => {
        setPendingPosts(posts);
        setLoading(false);
        
        // Update stats
        setModerationStats(prev => ({
          ...prev,
          pending: posts.length
        }));
      })
      .catch(error => {
        console.error('Error fetching pending posts:', error);
        setError('Failed to load pending posts for review');
        setLoading(false);
      });
    
    // Then set up real-time listener with throttling for better performance
    const unsubscribe = listenToPendingPostsOptimized((posts) => {
      setPendingPosts(posts);
      setLoading(false);
      
      // Update stats
      setModerationStats(prev => ({
        ...prev,
        pending: posts.length
      }));
    });
    
    return () => unsubscribe();
  }, [userData]);

  // Handle post approval
  const handleApprovePost = async (postId: string) => {
    setActionInProgress(postId);
    try {
      await updatePostStatus(postId, 'APPROVED');
      // Update stats
      setModerationStats(prev => ({
        ...prev,
        approved: prev.approved + 1,
        totalReviewed: prev.totalReviewed + 1
      }));
    } catch (error) {
      console.error('Error approving post:', error);
      setError('Failed to approve post');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle post rejection
  const handleRejectPost = async (postId: string) => {
    setActionInProgress(postId);
    try {
      await updatePostStatus(postId, 'REJECTED');
      // Update stats
      setModerationStats(prev => ({
        ...prev,
        rejected: prev.rejected + 1,
        totalReviewed: prev.totalReviewed + 1
      }));
    } catch (error) {
      console.error('Error rejecting post:', error);
      setError('Failed to reject post');
    } finally {
      setActionInProgress(null);
    }
  };

  // Handle tab change between "All Posts" and "By User"
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!currentUser || !userData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!userData.isModerator) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          You do not have permission to access this page.
        </Alert>
      </Container>
    );
  }

  // Render AI content analysis section for each post
  const renderContentAnalysis = (post: PostData) => {
    const confidence = post.confidence ? Math.round(post.confidence * 100) : null;
    
    return (
      <Box bgcolor="#f5f5f5" p={2} borderRadius={1} mt={2}>
        <Typography variant="subtitle2" display="flex" alignItems="center">
          <InfoIcon fontSize="small" sx={{ mr: 0.5 }} />
          AI Analysis:
        </Typography>
        
        <Grid container spacing={1} mt={1}>
          <Grid component="div" item xs={12} sm={6}>
            <Typography variant="body2">
              <strong>Label:</strong> {post.label || 'N/A'}
            </Typography>
          </Grid>
          
          {confidence !== null && (
            <Grid component="div" item xs={12} sm={6}>
              <Typography variant="body2">
                <strong>Confidence:</strong> {confidence}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={confidence} 
                color={confidence > 75 ? "error" : confidence > 50 ? "warning" : "info"}
                sx={{ mt: 0.5, height: 8, borderRadius: 1 }}
              />
            </Grid>
          )}
          
          {post.flaggedContent && (
            <Grid component="div" item xs={12}>
              <Typography variant="body2" mt={1}>
                <strong>Flagged Content:</strong> {post.flaggedContent}
              </Typography>
            </Grid>
          )}
        </Grid>
      </Box>
    );
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" flexDirection={isMobile ? "column" : "row"} justifyContent="space-between" alignItems={isMobile ? "flex-start" : "center"}>
          <Box>
            <Typography variant="h4" gutterBottom>
              Moderator Dashboard
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Review and moderate content that requires human verification
            </Typography>
          </Box>
          
          <Badge badgeContent={pendingPosts.length} color="warning" showZero sx={{ mt: isMobile ? 2 : 0 }}>
            <Chip 
              label={`${pendingPosts.length} Pending Review${pendingPosts.length !== 1 ? 's' : ''}`} 
              color="primary" 
              sx={{ fontWeight: 'bold', px: 2 }}
            />
          </Badge>
        </Box>
      </Paper>

      {/* Moderation Statistics */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <BarChartIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="h6">Moderation Statistics</Typography>
        </Box>
        
        <Grid container spacing={3}>
          <Grid component="div" item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#f5f5f5', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="text.secondary">Total Reviewed</Typography>
                <Typography variant="h4">{moderationStats.totalReviewed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#e8f5e9', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="success.main">Approved</Typography>
                <Typography variant="h4" color="success.main">{moderationStats.approved}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#ffebee', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="error.main">Rejected</Typography>
                <Typography variant="h4" color="error.main">{moderationStats.rejected}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid component="div" item xs={6} sm={3}>
            <Card sx={{ bgcolor: '#fff8e1', height: '100%' }}>
              <CardContent>
                <Typography variant="subtitle2" color="warning.main">Pending</Typography>
                <Typography variant="h4" color="warning.main">{pendingPosts.length}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : pendingPosts.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No posts pending review
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            All content has been moderated. Check back later for new content.
          </Typography>
        </Paper>
      ) : (
        <>
          <Paper sx={{ mb: 3 }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="fullWidth">
              <Tab label="All Pending Posts" />
              <Tab label="Group by User" />
            </Tabs>
          </Paper>

          {tabValue === 0 ? (
            // All posts view
            <Grid container spacing={3}>
              {pendingPosts.map((post) => (
                <Grid component="div" item xs={12} md={6} key={post.post_id}>
                  <Card elevation={3}>
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                        <Box display="flex" alignItems="center">
                          <Avatar sx={{ bgcolor: '#e91e63', mr: 2 }}>
                            {post.user_name ? post.user_name.charAt(0) : '?'}
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1">
                              {post.user_name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Post #{post.post_id ? post.post_id.substring(Math.max(0, post.post_id.length - 6)) : 'Unknown'}
                            </Typography>
                          </Box>
                        </Box>
                        <Chip 
                          label="PENDING" 
                          color="warning" 
                          size="small" 
                          icon={<WarningIcon fontSize="small" />}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {new Date(post.created_at).toLocaleString()}
                      </Typography>
                      
                      <Divider sx={{ my: 2 }} />
                      
                      {post.text_content && (
                        <Typography 
                          variant="body1" 
                          paragraph
                          dangerouslySetInnerHTML={{ 
                            __html: renderTextWithNewlines(post.text_content) 
                          }}
                        />
                      )}
                      
                      {post.image_url && (
                        <CardMedia
                          component="img"
                          image={post.image_url}
                          alt="Post content"
                          sx={{ maxHeight: 300, objectFit: 'contain', mt: 2, mb: 2, borderRadius: 1 }}
                        />
                      )}
                      
                      {renderContentAnalysis(post)}
                      
                      <CardActions sx={{ justifyContent: 'flex-end', pt: 2 }}>
                        <Button
                          variant="outlined"
                          color="error"
                          onClick={() => handleRejectPost(post.post_id)}
                          disabled={actionInProgress === post.post_id}
                          startIcon={<CancelIcon />}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="contained"
                          color="success"
                          onClick={() => handleApprovePost(post.post_id)}
                          disabled={actionInProgress === post.post_id}
                          startIcon={<CheckCircleIcon />}
                          sx={{ ml: 1 }}
                        >
                          Approve
                        </Button>
                        {actionInProgress === post.post_id && (
                          <CircularProgress size={24} sx={{ ml: 2 }} />
                        )}
                      </CardActions>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          ) : (
            // Group by user view
            <Box>
              {userGroups.map((group) => (
                <Paper elevation={2} sx={{ mb: 3, p: 2 }} key={group.user_id}>
                  <Box display="flex" alignItems="center" mb={2}>
                    <Avatar sx={{ bgcolor: '#9c27b0', mr: 2 }}>
                      {group.user_name ? group.user_name.charAt(0) : '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{group.user_name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {group.posts.length} pending post{group.posts.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Grid container spacing={2}>
                    {group.posts.map((post) => (
                      <Grid component="div" item xs={12} md={6} key={post.post_id}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="caption" color="text.secondary">
                                Post #{post.post_id ? post.post_id.substring(Math.max(0, post.post_id.length - 6)) : 'Unknown'}
                              </Typography>
                              <Chip 
                                label="PENDING" 
                                color="warning" 
                                size="small" 
                                variant="outlined"
                              />
                            </Box>
                            
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {new Date(post.created_at).toLocaleString()}
                            </Typography>
                            
                            {post.text_content && (
                              <Typography 
                                variant="body1" 
                                paragraph
                                dangerouslySetInnerHTML={{ 
                                  __html: renderTextWithNewlines(post.text_content) 
                                }}
                              />
                            )}
                            
                            {post.image_url && (
                              <CardMedia
                                component="img"
                                image={post.image_url}
                                alt="Post content"
                                sx={{ 
                                  height: 140, 
                                  objectFit: 'cover', 
                                  mt: 2, 
                                  borderRadius: 1 
                                }}
                              />
                            )}
                            
                            {renderContentAnalysis(post)}
                            
                            <CardActions sx={{ justifyContent: 'flex-end', pt: 2 }}>
                              <Button
                                size="small"
                                variant="outlined"
                                color="error"
                                onClick={() => handleRejectPost(post.post_id)}
                                disabled={actionInProgress === post.post_id}
                              >
                                Reject
                              </Button>
                              <Button
                                size="small"
                                variant="contained"
                                color="success"
                                onClick={() => handleApprovePost(post.post_id)}
                                disabled={actionInProgress === post.post_id}
                                sx={{ ml: 1 }}
                              >
                                Approve
                              </Button>
                              {actionInProgress === post.post_id && (
                                <CircularProgress size={20} sx={{ ml: 1 }} />
                              )}
                            </CardActions>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              ))}
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default ModeratorDashboard;