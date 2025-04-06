import { useState, useEffect, useRef } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Typography, 
  Paper, 
  Avatar, 
  Card, 
  CardHeader,
  CardContent,
  CardMedia,
  TextField,
  Button,
  CircularProgress,
  Chip,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider
} from '@mui/material';
import { PhotoCamera, Close, Send } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { createPost, listenToUserPostsOptimized, PostData } from '../firebase/posts';
import { useNavigate } from 'react-router-dom';
import { createImagePreview } from '../firebase/imageUtils';
import { renderTextWithNewlines } from '../utils/contentSanitizer';

const Home = () => {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State variables
  const [postText, setPostText] = useState('');
  const [postImage, setPostImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [error, setError] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Listen for user posts
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = listenToUserPostsOptimized(currentUser.uid, (updatedPosts) => {
      // Sort posts by creation date (newest first)
      const sortedPosts = [...updatedPosts].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setPosts(sortedPosts);
    });

    return () => unsubscribe();
  }, [currentUser]);

  // Handle image upload
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPostImage(file);
      
      // Use our utility function to create preview
      try {
        const preview = await createImagePreview(file);
        setImagePreview(preview);
      } catch (error) {
        console.error('Error creating image preview:', error);
        setError('Failed to preview image');
      }
    }
  };

  // Remove image
  const handleRemoveImage = () => {
    setPostImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Submit post
  const handlePostSubmit = async () => {
    if (!currentUser || !userData) return;
    if (!postText && !postImage) {
      setError('Please enter text or add an image');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await createPost(
        currentUser.uid,
        userData.name,
        postText,
        postImage || undefined
      );

      // Reset form
      setPostText('');
      setPostImage(null);
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error creating post:', error);
      setError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get status chip color based on post status
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

  // Get formatted date
  const formatPostDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hr ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
  };

  if (!currentUser || !userData) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* User Stats Sidebar - Conditional rendering based on screen size */}
        <Grid item xs={12} md={3} sx={{ display: { xs: isMobile ? 'none' : 'block', md: 'block' } }}>
          <Paper elevation={3} sx={{ 
            p: 3,
            height: '100%',
            background: 'linear-gradient(to bottom, #f5f5f5, #ffffff)',
            borderRadius: 2,
          }}>
            <Box display="flex" flexDirection="column" alignItems="center" mb={3}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  fontSize: 40,
                  bgcolor: theme.palette.primary.main,
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                  mb: 2
                }}
              >
                {userData.name.charAt(0)}
              </Avatar>
              <Typography variant="h6" fontWeight="bold">{userData.name}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {userData.email}
              </Typography>
              <Chip 
                label={userData.role === 'moderator' ? 'Moderator' : 'Member'} 
                color={userData.role === 'moderator' ? 'secondary' : 'primary'} 
                size="small"
                sx={{ mb: 2 }}
              />
            </Box>

            <Divider sx={{ mb: 2 }} />

            <Box sx={{ pt: 1 }}>
              <Box display="flex" justifyContent="space-between" py={1}>
                <Typography variant="body1">Posts</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {posts.length}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={1}>
                <Typography variant="body1">Followers</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {userData.followers || 0}
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" py={1}>
                <Typography variant="body1">Following</Typography>
                <Typography variant="body1" fontWeight="bold">
                  {userData.following || 0}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Mobile User Info - Only visible on mobile */}
        {isMobile && (
          <Grid item xs={12}>
            <Paper elevation={2} sx={{ 
              p: 2, 
              mb: 2,
              background: 'linear-gradient(to right, #f5f5f5, #ffffff)',
              borderRadius: 2
            }}>
              <Box display="flex" alignItems="center">
                <Avatar
                  sx={{
                    width: 50,
                    height: 50,
                    fontSize: 24,
                    bgcolor: theme.palette.primary.main,
                    mr: 2
                  }}
                >
                  {userData.name.charAt(0)}
                </Avatar>
                <Box>
                  <Typography variant="h6" fontWeight="bold">{userData.name}</Typography>
                  <Box display="flex" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      Posts: {posts.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Followers: {userData.followers || 0}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>
        )}

        {/* Main Content */}
        <Grid item xs={12} md={isMobile ? 12 : 9}>
          {/* Post Creation */}
          <Paper elevation={3} sx={{ 
            p: 3, 
            mb: 3,
            borderRadius: 2,
            background: 'linear-gradient(to bottom, #fafafa, #ffffff)',
            boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
          }}>
            <Typography variant="h6" gutterBottom fontWeight="bold" color="primary">
              Create Post
            </Typography>

            {error && (
              <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                {error}
              </Typography>
            )}

            <TextField
              fullWidth
              multiline
              rows={3}
              placeholder="What's on your mind?"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              disabled={isSubmitting}
              sx={{ 
                mb: 2,
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover fieldset': {
                    borderColor: theme.palette.primary.light,
                  },
                },
              }}
            />

            {imagePreview && (
              <Box position="relative" mb={2}>
                <img
                  src={imagePreview}
                  alt="Post preview"
                  style={{
                    width: '100%',
                    maxHeight: '300px',
                    objectFit: 'contain',
                    borderRadius: '8px'
                  }}
                />
                <IconButton
                  size="small"
                  color="error"
                  onClick={handleRemoveImage}
                  sx={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    bgcolor: 'rgba(255, 255, 255, 0.8)',
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.9)',
                    }
                  }}
                >
                  <Close />
                </IconButton>
              </Box>
            )}

            <Box display="flex" justifyContent="space-between">
              <Tooltip title="Add Image">
                <IconButton
                  color="primary"
                  component="label"
                  disabled={isSubmitting}
                  sx={{ borderRadius: 2 }}
                >
                  <PhotoCamera />
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </IconButton>
              </Tooltip>

              <Button
                variant="contained"
                onClick={handlePostSubmit}
                disabled={isSubmitting || (!postText && !postImage)}
                startIcon={isSubmitting ? <CircularProgress size={16} /> : <Send />}
                sx={{ 
                  borderRadius: 8,
                  px: 3,
                  py: 1,
                  boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    boxShadow: '0 6px 12px rgba(0, 0, 0, 0.15)',
                  }
                }}
              >
                {isSubmitting ? 'Posting...' : 'Post'}
              </Button>
            </Box>
          </Paper>

          {/* Posts Feed */}
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" fontWeight="bold" color="primary">
              Your Posts
            </Typography>
            <Chip 
              label={`${posts.length} ${posts.length === 1 ? 'post' : 'posts'}`} 
              size="small" 
              color="primary"
              variant="outlined"
            />
          </Box>

          {posts.length === 0 ? (
            <Paper elevation={2} sx={{ 
              p: 4, 
              textAlign: 'center',
              borderRadius: 2,
              background: 'linear-gradient(to bottom, #f5f5f5, #ffffff)',
              boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
            }}>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                You haven't created any posts yet. Share your thoughts above!
              </Typography>
              <Box
                sx={{ 
                  width: '150px', 
                  height: '150px',
                  opacity: 0.7,
                  margin: '0 auto'
                }}
              />
            </Paper>
          ) : (
            posts.map((post) => (
              <Card key={post.post_id} sx={{ 
                mb: 3,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.12)',
                },
                transition: 'box-shadow 0.3s ease'
              }}>
                <CardHeader
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                      {userData.name.charAt(0)}
                    </Avatar>
                  }
                  title={
                    <Typography variant="subtitle1" fontWeight="medium">
                      {userData.name}
                    </Typography>
                  }
                  subheader={formatPostDate(post.created_at.toString())}
                  action={
                    <Chip
                      label={post.status}
                      color={getStatusColor(post.status) as any}
                      size="small"
                      sx={{ fontWeight: 'medium' }}
                    />
                  }
                />
                
                {post.text_content && (
                  <CardContent sx={{ py: 1 }}>
                    <Typography 
                      variant="body1" 
                      dangerouslySetInnerHTML={{ 
                        __html: renderTextWithNewlines(post.text_content) 
                      }} 
                    />
                  </CardContent>
                )}
                
                {post.image_url && (
                  <CardMedia
                    component="img"
                    image={post.image_url}
                    alt="Post image"
                    sx={{ 
                      maxHeight: 500,
                      objectFit: 'contain',
                      backgroundColor: '#f5f5f5'
                    }}
                  />
                )}
                
                {(post.status === 'REJECTED' || post.status === 'PENDING') && (
                  <CardContent sx={{ 
                    py: 1,
                    backgroundColor: post.status === 'REJECTED' 
                      ? 'rgba(255, 0, 0, 0.03)' 
                      : 'rgba(255, 152, 0, 0.03)'
                  }}>
                    <Typography variant="caption" color="text.secondary">
                      {post.status === 'REJECTED' && (
                        <>
                          <strong>Reason for rejection:</strong>{' '}
                          {post.summary || `Identified as ${post.label} (${post.confidence ? (post.confidence * 100).toFixed(1) : 0}% confidence)`}
                        </>
                      )}
                      {post.status === 'PENDING' && (
                        <>
                          <strong>Under review:</strong>{' '}
                          This post is being reviewed by our moderators.
                        </>
                      )}
                    </Typography>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Home;