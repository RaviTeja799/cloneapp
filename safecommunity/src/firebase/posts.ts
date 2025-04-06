import { collection, doc, setDoc, updateDoc, getDocs, getDoc, query, where, onSnapshot, addDoc, orderBy, limit, startAfter, Timestamp, QueryDocumentSnapshot, QueryConstraint } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './config';
import { publishToDetectionRequests } from './pubsub';
import { auth } from './auth';
import { optimizeImage, sanitizeFileName, validateImage } from './imageUtils';
import { createSmartQueryListener, createThrottledQueryListener, PaginationConfig, createPaginatedQuery } from './queryUtils';

// Generate a unique post ID based on timestamp and random string
export const generatePostId = (): string => {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.TZ]/g, '');
  const random = Math.random().toString(36).substring(2, 6);
  const postId = `${timestamp}-${random}`;
  console.log(`[Posts] Generated new post ID: ${postId}`);
  return postId;
};

// Interface for post data
export interface PostData {
  post_id: string;
  user_id: string;
  user_name: string;
  text_content?: string;
  image_url?: string;
  created_at: Date;
  status: 'PROCESSING' | 'APPROVED' | 'REJECTED' | 'PENDING';
  label?: string;
  confidence?: number;
  summary?: string;
}

// Interface representing a post in the system
export interface Post {
  id?: string;
  title: string;
  content: string;
  image_url?: string;
  user_id: string;
  user_name: string;
  user_avatar?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: Date;
  updated_at?: Date;
  likes?: number;
  comments?: number;
}

// Create a new post (text or image)
export const createPost = async (
  userId: string,
  userName: string,
  textContent?: string,
  imageFile?: File
): Promise<string> => {
  console.log(`[Posts] Creating new post for user: ${userId} (${userName})`);
  try {
    const postId = generatePostId();
    const postData: PostData = {
      post_id: postId,
      user_id: userId,
      user_name: userName,
      created_at: new Date(),
      status: 'PROCESSING'
    };

    // Add text content if provided
    if (textContent) {
      postData.text_content = textContent;
      console.log(`[Posts] Adding text content to post ${postId}: "${textContent.substring(0, 50)}${textContent.length > 50 ? '...' : ''}"`);
    }

    // Upload image if provided
    if (imageFile) {
      // Validate image before processing
      const validationError = validateImage(imageFile, 5);
      if (validationError) {
        throw new Error(validationError);
      }
      
      console.log(`[Posts] Processing image for post ${postId}: ${imageFile.name} (${(imageFile.size / 1024).toFixed(2)} KB)`);
      
      // Optimize the image
      const optimizedImage = await optimizeImage(imageFile, 'post');
      
      // Sanitize filename for security
      const safeName = sanitizeFileName(imageFile.name);
      
      // Upload to storage
      const imageRef = ref(storage, `posts/${postId}/${safeName}`);
      await uploadBytes(imageRef, optimizedImage);
      const imageUrl = await getDownloadURL(imageRef);
      postData.image_url = imageUrl;
      console.log(`[Posts] Image uploaded and URL generated: ${imageUrl.substring(0, 50)}...`);
    }

    // Save post to Firestore
    console.log(`[Posts] Saving post ${postId} to Firestore`);
    await setDoc(doc(db, 'preprocessed_data', postId), postData);
    console.log(`[Posts] Post saved to Firestore: ${postId}`);

    // Publish to detection-requests topic via our PubSub service
    console.log(`[Posts] Publishing post ${postId} to content moderation service`);
    await publishToDetectionRequests({
      post_id: postId,
      processed_text: textContent,
      image_url: postData.image_url
    });
    console.log(`[Posts] Post ${postId} sent for content moderation`);

    return postId;
  } catch (error) {
    console.error('[Posts] Error creating post:', error);
    throw error;
  }
};

// Get all posts for a user
export const getUserPosts = async (userId: string): Promise<PostData[]> => {
  console.log(`[Posts] Fetching posts for user: ${userId}`);
  try {
    // Update the query to exclude rejected posts
    const q = query(
      collection(db, 'preprocessed_data'),
      where('user_id', '==', userId),
      where('status', '!=', 'REJECTED')
    );
    const querySnapshot = await getDocs(q);
    
    const posts: PostData[] = [];
    querySnapshot.forEach((doc) => {
      posts.push(doc.data() as PostData);
    });
    
    console.log(`[Posts] Retrieved ${posts.length} posts for user ${userId}`);
    return posts;
  } catch (error) {
    console.error('[Posts] Error getting user posts:', error);
    throw error;
  }
};

// Get all posts with PENDING status (for moderators)
export const getPendingPosts = async (): Promise<PostData[]> => {
  console.log('[Posts] Fetching pending posts for moderation');
  try {
    const q = query(collection(db, 'preprocessed_data'), where('status', '==', 'PENDING'));
    const querySnapshot = await getDocs(q);
    
    const pendingPosts: PostData[] = [];
    querySnapshot.forEach((doc) => {
      pendingPosts.push(doc.data() as PostData);
    });
    
    console.log(`[Posts] Retrieved ${pendingPosts.length} pending posts for moderation`);
    return pendingPosts;
  } catch (error) {
    console.error('[Posts] Error getting pending posts:', error);
    throw error;
  }
};

// Update post status (for moderators)
export const updatePostStatus = async (
  postId: string, 
  status: 'APPROVED' | 'REJECTED'
): Promise<void> => {
  console.log(`[Posts] Updating post ${postId} status to: ${status}`);
  try {
    await updateDoc(doc(db, 'preprocessed_data', postId), { status });
    console.log(`[Posts] Post ${postId} status updated to ${status}`);
  } catch (error) {
    console.error('[Posts] Error updating post status:', error);
    throw error;
  }
};

// Listen for changes to a post
export const listenToPost = (postId: string, callback: (post: PostData) => void) => {
  console.log(`[Posts] Setting up listener for post: ${postId}`);
  return onSnapshot(doc(db, 'preprocessed_data', postId), (doc) => {
    if (doc.exists()) {
      const postData = doc.data() as PostData;
      console.log(`[Posts] Post ${postId} updated: status=${postData.status}`);
      callback(postData);
    } else {
      console.log(`[Posts] Post ${postId} does not exist or was deleted`);
    }
  });
};

// Listen for all user posts
export const listenToUserPosts = (userId: string, callback: (posts: PostData[]) => void) => {
  console.log(`[Posts] Setting up listener for all posts by user: ${userId}`);
  const q = query(collection(db, 'preprocessed_data'), where('user_id', '==', userId));
  
  return onSnapshot(q, (querySnapshot) => {
    const posts: PostData[] = [];
    querySnapshot.forEach((doc) => {
      posts.push(doc.data() as PostData);
    });
    console.log(`[Posts] User ${userId} has ${posts.length} posts (received update)`);
    callback(posts);
  });
};

// Listen for all posts with PENDING status (for moderators)
export const listenToPendingPosts = (callback: (posts: PostData[]) => void) => {
  console.log('[Posts] Setting up listener for pending posts');
  const q = query(collection(db, 'preprocessed_data'), where('status', '==', 'PENDING'));
  
  return onSnapshot(q, (querySnapshot) => {
    const pendingPosts: PostData[] = [];
    querySnapshot.forEach((doc) => {
      pendingPosts.push(doc.data() as PostData);
    });
    console.log(`[Posts] Pending posts updated: ${pendingPosts.length} posts waiting for moderation`);
    callback(pendingPosts);
  });
};

// Creates a new post and sends it for content moderation
export const createPostWithModeration = async (post: Omit<Post, 'id' | 'user_id' | 'user_name' | 'created_at' | 'status'>, imageFile?: File): Promise<string> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to create a post');
    }
    
    // Check if user is banned
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    if (userDoc.exists() && userDoc.data().isBanned) {
      throw new Error('Your account has been suspended due to policy violations. Please contact support.');
    }
    
    // Process image file if provided
    let imageUrl = post.image_url || null;
    
    if (imageFile) {
      // Validate image
      const validationError = validateImage(imageFile, 5);
      if (validationError) {
        throw new Error(validationError);
      }
      
      // Optimize the image
      const optimizedImage = await optimizeImage(imageFile, 'post');
      
      // Sanitize filename
      const safeName = sanitizeFileName(imageFile.name);
      
      // Generate a unique ID for the image
      const imageId = generatePostId();
      
      // Upload to storage
      const imageRef = ref(storage, `posts/${imageId}/${safeName}`);
      await uploadBytes(imageRef, optimizedImage);
      imageUrl = await getDownloadURL(imageRef);
      
      console.log(`[Posts] Processed and uploaded image: ${imageUrl.substring(0, 50)}...`);
    }
    
    // Create post document
    const newPost = {
      title: post.title,
      content: post.content,
      image_url: imageUrl,
      user_id: currentUser.uid,
      user_name: currentUser.displayName || 'Anonymous User',
      user_avatar: currentUser.photoURL || null,
      status: 'PROCESSING' as const,
      created_at: new Date(),
      likes: 0,
      comments: 0
    };
    
    console.log('[Posts] Creating new post:', newPost);
    
    // Add to posts collection
    const postRef = await addDoc(collection(db, 'posts'), newPost);
    const postId = postRef.id;
    
    console.log('[Posts] Created post with ID:', postId);
    
    // Create preprocessed_data entry
    const preprocessedData = {
      post_id: postId,
      processed_text: post.content,
      image_url: imageUrl,
      status: 'PROCESSING',
      created_at: new Date()
    };
    
    // Add to preprocessed_data collection using post ID as document ID
    await addDoc(collection(db, 'preprocessed_data'), preprocessedData);
    
    console.log('[Posts] Added to preprocessed_data');
    
    // Send for content moderation via PubSub
    await publishToDetectionRequests({
      post_id: postId,
      processed_text: post.content,
      image_url: imageUrl || undefined
    });
    
    return postId;
  } catch (error) {
    console.error('[Posts] Error creating post:', error);
    throw error;
  }
};

// Retrieves a post by its ID
export const getPostById = async (postId: string): Promise<Post | null> => {
  try {
    const postDoc = await getDoc(doc(db, 'posts', postId));
    
    if (!postDoc.exists()) {
      return null;
    }
    
    const postData = postDoc.data() as Post;
    return {
      ...postData,
      id: postId,
      created_at: postData.created_at instanceof Date 
        ? postData.created_at 
        : new Date((postData.created_at as any).seconds * 1000)
    };
  } catch (error) {
    console.error('[Posts] Error getting post:', error);
    throw error;
  }
};

// Retrieves the moderation status of a post
export const getPostModerationStatus = async (postId: string): Promise<any> => {
  try {
    // Query preprocessed_data collection to find document with matching post_id
    const q = query(
      collection(db, 'preprocessed_data'),
      where('post_id', '==', postId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return {
        status: 'UNKNOWN',
        error: 'No moderation data found for this post'
      };
    }
    
    const moderationData = querySnapshot.docs[0].data();
    
    return {
      status: moderationData.status || 'PROCESSING',
      label: moderationData.label || null,
      confidence: moderationData.confidence || 0,
      summary: moderationData.summary || null,
      processed_at: moderationData.processed_at || null
    };
  } catch (error) {
    console.error('[Posts] Error getting moderation status:', error);
    throw error;
  }
};

// Retrieves a list of posts with pagination
export const getPosts = async (limitCount: number = 10, startAfter?: string): Promise<Post[]> => {
  try {
    let q;
    
    // Check if the user is a moderator
    const currentUser = auth.currentUser;
    const isModerator = currentUser 
      ? (await getDoc(doc(db, 'users', currentUser.uid))).data()?.role === 'moderator'
      : false;
    
    if (isModerator) {
      // Moderators can see all posts, including pending ones
      q = query(
        collection(db, 'posts'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
    } else {
      // Regular users only see approved posts
      q = query(
        collection(db, 'posts'),
        where('status', '==', 'APPROVED'),
        orderBy('created_at', 'desc'),
        limit(limitCount)
      );
    }
    
    // Apply pagination if startAfter is provided
    if (startAfter) {
      const startAfterDoc = await getDoc(doc(db, 'posts', startAfter));
      if (startAfterDoc.exists()) {
        q = query(collection(db, 'posts'), orderBy('created_at', 'desc'), startAfter(startAfterDoc), limit(limitCount));
      }
    }
    
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => {
      const data = doc.data() as Post;
      return {
        ...data,
        id: doc.id,
        created_at: data.created_at instanceof Date 
          ? data.created_at 
          : new Date((data.created_at as any).seconds * 1000)
      };
    });
  } catch (error) {
    console.error('[Posts] Error getting posts:', error);
    throw error;
  }
};

// Updates a post's status
export const updatePostStatusWithModeration = async (postId: string, status: 'APPROVED' | 'REJECTED'): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error('You must be logged in to update post status');
    }
    
    // Check if user is a moderator
    const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
    
    if (!userDoc.exists() || userDoc.data().role !== 'moderator') {
      throw new Error('Only moderators can update post status');
    }
    
    // Update post status
    await updateDoc(doc(db, 'posts', postId), {
      status,
      updated_at: new Date()
    });
    
    // Also update in preprocessed_data
    const q = query(
      collection(db, 'preprocessed_data'),
      where('post_id', '==', postId),
      limit(1)
    );
    
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const preprocessedDoc = querySnapshot.docs[0];
      await updateDoc(doc(db, 'preprocessed_data', preprocessedDoc.id), {
        status,
        updated_at: new Date(),
        reviewed_by: currentUser.uid
      });
    }
    
    // If rejected, check and possibly ban the user
    if (status === 'REJECTED') {
      // Get post to find user
      const postDoc = await getDoc(doc(db, 'posts', postId));
      if (postDoc.exists()) {
        const userId = postDoc.data().user_id;
        
        // Check user's rejection count
        const userRejectedPosts = await getDocs(
          query(
            collection(db, 'posts'),
            where('user_id', '==', userId),
            where('status', '==', 'REJECTED')
          )
        );
        
        // If user has 3 or more rejected posts, ban them
        if (userRejectedPosts.size >= 3) {
          await updateDoc(doc(db, 'users', userId), {
            isBanned: true,
            banReason: 'Multiple content policy violations',
            bannedAt: new Date()
          });
          
          console.log(`[Posts] User ${userId} has been banned due to multiple content violations`);
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error('[Posts] Error updating post status:', error);
    throw error;
  }
};

// Interface for query configuration
interface QueryConfig {
  collectionName: string;
  whereConditions: { field: string; operator: string; value: any }[];
  orderByField: string;
  orderDirection: 'asc' | 'desc';
  limitCount?: number;
}

// Listen for all user posts with optimization
export const listenToUserPostsOptimized = (userId: string, callback: (posts: PostData[]) => void) => {
  console.log(`[Posts] Setting up optimized listener for all posts by user: ${userId}`);
  
  const queryConfig: QueryConfig = {
    collectionName: 'preprocessed_data',
    whereConditions: [
      { field: 'user_id', operator: '==', value: userId }
    ],
    orderByField: 'created_at',
    orderDirection: 'desc',
    limitCount: 20 // Limit to prevent excessive data transfer
  };
  
  // Only trigger when post status changes or a new post is added
  const changeDetector = (prev: Document[], current: DocumentData[]) => {
    // Check if there are different number of posts
    if (prev.length !== current.length) return true;
    
    // Check if any post status has changed
    for (let i = 0; i < prev.length; i++) {
      if (prev[i].status !== current[i].status) return true;
    }
    
    return false;
  };
  
  return createSmartQueryListener(
    queryConfig,
    (docs) => {
      const posts = docs as PostData[];
      console.log(`[Posts] User ${userId} has ${posts.length} posts (optimized update)`);
      callback(posts);
    },
    changeDetector
  );
};

// Listen for pending posts with throttling to avoid excessive updates
export const listenToPendingPostsOptimized = (callback: (posts: PostData[]) => void) => {
  console.log('[Posts] Setting up optimized listener for pending posts');
  
  const queryConfig: QueryConfig = {
    collectionName: 'preprocessed_data',
    whereConditions: [
      { field: 'status', operator: '==', value: 'PENDING' }
    ],
    orderByField: 'created_at',
    orderDirection: 'desc'
  };
  
  return createThrottledQueryListener(
    queryConfig,
    (docs) => {
      const pendingPosts = docs.map(doc => doc.data() as PostData);
      console.log(`[Posts] Pending posts updated: ${pendingPosts.length} posts waiting for moderation (throttled)`);
      callback(pendingPosts);
    },
    { throttleMs: 1500 } // Throttle updates to reduce UI flickering and database costs
  );
};

// Get posts with pagination for better performance
export const getPostsPaginated = async (
  pageSize: number = 10, 
  lastVisibleDoc?: QueryDocumentSnapshot<DocumentData>,
  filterStatus?: 'APPROVED' | 'PENDING' | 'REJECTED'
): Promise<{posts: Post[], lastVisible: QueryDocumentSnapshot<DocumentData> | null}> => {
  try {
    const paginationConfig: PaginationConfig = {
      pageSize,
      orderByField: 'created_at',
      orderDirection: 'desc',
      startAfterDoc: lastVisibleDoc
    };
    
    // Add status filter if needed
    const additionalConstraints: QueryConstraint[] = [];
    if (filterStatus) {
      additionalConstraints.push(where('status', '==', filterStatus));
    }
    
    const q = createPaginatedQuery('posts', paginationConfig, additionalConstraints);
    const querySnapshot = await getDocs(q);
    
    // Get the last document for pagination
    const lastVisible = querySnapshot.docs.length > 0 
      ? querySnapshot.docs[querySnapshot.docs.length - 1] 
      : null;
    
    const posts = querySnapshot.docs.map(doc => {
      const data = doc.data() as Post;
      return {
        ...data,
        id: doc.id,
        created_at: data.created_at instanceof Date 
          ? data.created_at 
          : new Date(data.created_at.seconds * 1000)
      };
    });
    
    return { posts, lastVisible };
  } catch (error) {
    console.error('[Posts] Error getting paginated posts:', error);
    throw error;
  }
};