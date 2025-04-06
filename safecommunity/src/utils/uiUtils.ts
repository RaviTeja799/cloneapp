/**
 * This file contains optimized imports for Material UI components
 * to ensure tree-shaking works properly and reduce bundle size
 */

// Import only the icons we need instead of the entire library
export { 
  // Navigation icons
  Home as HomeIcon, 
  Person as PersonIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  
  // Content icons
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Comment as CommentIcon,
  Share as ShareIcon,
  
  // Status icons
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Error as ErrorIcon,
  
  // Action icons
  Send as SendIcon,
  PhotoCamera as PhotoCameraIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  MoreVert as MoreVertIcon,
  
  // Data visualization
  BarChart as BarChartIcon,
  PieChart as PieChartIcon,
  
  // Special icons
  Shield as ShieldIcon
} from '@mui/icons-material';

// Color utility functions
export const getStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
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

// Date formatting utility
export const formatRelativeTime = (dateString: string | Date): string => {
  const date = dateString instanceof Date ? dateString : new Date(dateString);
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

// Loading state components configuration
export const loadingConfigs = {
  small: {
    size: 16,
    thickness: 4
  },
  medium: {
    size: 24,
    thickness: 3.6
  },
  large: {
    size: 40,
    thickness: 3.2
  }
};