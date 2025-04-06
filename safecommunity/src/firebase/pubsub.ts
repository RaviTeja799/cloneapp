import { db } from './config';
import { doc, updateDoc, getDoc, collection, addDoc } from 'firebase/firestore';

// Interface for detection request payload
interface DetectionRequest {
  post_id: string;
  processed_text?: string;
  image_url?: string;
}

// Define harmful labels that require moderation
const HARMFUL_LABELS = [
  'hate_speech',
  'hate speech',
  'cyberbullying',
  'violence',
  'offensive_language',
  'offensive language',
  'adult',
  'racy',
  'double_meaning',
  'double meaning'
];

/**
 * Check if a label is considered harmful
 * @param label The label to check
 * @returns Boolean indicating if the label is harmful
 */
const isHarmfulLabel = (label: string | null): boolean => {
  if (!label) return false;
  return HARMFUL_LABELS.some(harmfulLabel => 
    label.toLowerCase().includes(harmfulLabel.toLowerCase())
  );
};

/**
 * Determine moderation status based on confidence and label
 * @param confidence The confidence score (0-1)
 * @param label The detected label
 * @returns The appropriate moderation status
 */
const determineModerationStatus = (confidence: number, label: string | null): string => {
  // If no label or not harmful, approve it
  if (!label || !isHarmfulLabel(label)) {
    return 'APPROVED';
  }
  
  // Apply tiered moderation based on confidence for harmful labels
  if (confidence > 0.9) {
    return 'REJECTED'; // Ban content with high confidence of harmful content
  } else if (confidence > 0.4) {
    return 'PENDING'; // Send for human review
  } else {
    return 'APPROVED'; // Low confidence, approve but track
  }
};

/**
 * Sends a post to the content moderation service via HTTP API
 * This calls the Cloud Function directly instead of using Pub/Sub from the client
 */
export const publishToDetectionRequests = async (request: DetectionRequest): Promise<boolean> => {
  try {
    console.log('[PubSub] Publishing to content moderation service:', request.post_id);
    
    // Update Firestore status to PROCESSING
    await updateDoc(doc(db, 'preprocessed_data', request.post_id), {
      status: 'PROCESSING',
      pubsub_timestamp: new Date()
    });
    
    // Only use simulator if environment variable is not set or we're in development
    if (!import.meta.env.VITE_CONTENT_MODERATION_FUNCTION_URL || import.meta.env.DEV) {
      console.log('[PubSub] Using simulation mode for content moderation');
      return simulateContentModeration(request);
    }
    
    // Call the actual Cloud Function via HTTP
    const functionUrl = import.meta.env.VITE_CONTENT_MODERATION_FUNCTION_URL;
    console.log(`[PubSub] Calling content moderation function: ${functionUrl}`);
    
    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        post_id: request.post_id,
        text: request.processed_text || '',
        image_url: request.image_url || ''
      })
    });
    
    if (!response.ok) {
      throw new Error(`Cloud Function returned status ${response.status}`);
    }
    
    console.log(`[PubSub] Content moderation request sent successfully for post ${request.post_id}`);
    return true;
  } catch (error) {
    console.error('[PubSub] Error publishing to content moderation service:', error);
    
    // Update post with error status
    try {
      await updateDoc(doc(db, 'preprocessed_data', request.post_id), {
        status: 'APPROVED', // Default to approved on error
        error_message: 'Failed to process content. Approved by default.',
        processed_at: new Date()
      });
    } catch (updateError) {
      console.error('[PubSub] Error updating post status after failure:', updateError);
    }
    
    return false;
  }
};

/**
 * Track user behavior based on post moderation outcome
 * This function updates a user's behavior score in Firestore
 */
const trackUserBehavior = async (userId: string, status: string, label: string | null) => {
  try {
    // Get user doc reference
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error(`[PubSub] User ${userId} not found for behavior tracking`);
      return;
    }
    
    const userData = userDoc.data();
    
    // Scoring system:
    // - REJECTED posts with harmful labels: -10 points
    // - PENDING posts with harmful labels: -3 points
    // - All other posts: +1 point (encouraging positive behavior)
    let behaviorDelta = 1; // Default: slight positive reinforcement
    let isBanned = userData.isBanned || false;
    let warningCount = userData.warningCount || 0;
    
    if (status === 'REJECTED' && isHarmfulLabel(label)) {
      behaviorDelta = -10;
      warningCount += 1;
      
      // User gets banned after 3 rejections with harmful content
      if (warningCount >= 3) {
        isBanned = true;
        
        // Add a record to banned_users collection for audit trail
        await addDoc(collection(db, 'banned_users'), {
          user_id: userId,
          user_email: userData.email,
          user_name: userData.name,
          ban_reason: `Multiple violations: Latest harmful content labeled as "${label}"`,
          banned_at: new Date()
        });
        
        console.log(`[PubSub] User ${userId} has been banned due to multiple violations`);
      }
    } else if (status === 'PENDING' && isHarmfulLabel(label)) {
      behaviorDelta = -3;
    }
    
    // Update user behavior score
    const currentScore = userData.behavior_score || 100; // Default starting score: 100
    const newScore = Math.max(0, Math.min(100, currentScore + behaviorDelta)); // Clamp between 0-100
    
    await updateDoc(userRef, {
      behavior_score: newScore,
      last_behavior_update: new Date(),
      isBanned,
      warningCount
    });
    
    console.log(`[PubSub] Updated behavior score for user ${userId}: ${currentScore} → ${newScore}`);
  } catch (error) {
    console.error('[PubSub] Error tracking user behavior:', error);
  }
};
/**
 * Simulation of content moderation for development and testing
 * This function is used when the real Cloud Function URL is not configured
 */
const simulateContentModeration = async (request: DetectionRequest): Promise<boolean> => {
  console.log(`[PubSub] Simulating AI content analysis for post ${request.post_id}`);
  
  setTimeout(async () => {
    try {
      // First, get the post owner ID to track behavior
      let postDoc = await getDoc(doc(db, 'posts', request.post_id));
      
      // If not found in posts collection, try preprocessed_data collection
      if (!postDoc.exists()) {
        console.log(`[PubSub] Post not found in 'posts' collection, checking 'preprocessed_data'`);
        postDoc = await getDoc(doc(db, 'preprocessed_data', request.post_id));
        
        // If still not found, log error and return
        if (!postDoc.exists()) {
          console.error(`[PubSub] Post ${request.post_id} not found for behavior tracking`);
          return false;
        }
      }
      
      const postData = postDoc.data();
      const userId = postData.user_id;
      
      // If no user ID found, we can't track behavior
      if (!userId) {
        console.error(`[PubSub] No user_id found for post ${request.post_id}`);
        // Still update the post status even if we can't track behavior
        await updateDoc(doc(db, 'preprocessed_data', request.post_id), {
          status: 'APPROVED',
          processed_at: new Date(),
          error_message: 'No user association found, approved by default'
        });
        return true;
      }
      
      // Generate a confidence score and random harmful label
      const confidence = Math.random();
      console.log(`[PubSub] Generated confidence score: ${confidence.toFixed(6)} for post ${request.post_id}`);
      
      let label: string | null = null;
      let summary: string | null = null;
      
      // For simulation, sometimes generate harmful content
      if (confidence > 0.3) {
        // Pick a random harmful label
        const harmfulLabels = [
          'cyberbullying', 
          'hate_speech', 
          'violence', 
          'offensive_language',
          'adult',
          'racy',
          'double_meaning'
        ];
        
        // Make harmful content more rare in simulation
        if (confidence > 0.6) {
          label = harmfulLabels[Math.floor(Math.random() * harmfulLabels.length)];
          summary = `Content may contain ${label}. Confidence: ${(confidence * 100).toFixed(1)}%`;
        } else {
          // Safe labels for lower confidence scores
          const safeLabels = [
            'informational',
            'educational',
            'general_discussion',
            'neutral_content',
            'humorous'
          ];
          label = safeLabels[Math.floor(Math.random() * safeLabels.length)];
          summary = `Content appears to be ${label}. Confidence: ${(confidence * 100).toFixed(1)}%`;
        }
      } else {
        summary = 'No issues detected in content.';
      }
      
      // Apply moderation policy
      const status = determineModerationStatus(confidence, label);
      
      console.log(`[PubSub] Post ${request.post_id} determined status: ${status} (label: ${label}, confidence: ${confidence.toFixed(6)})`);
      
      // Update the document with the "AI analysis" results
      await updateDoc(doc(db, 'preprocessed_data', request.post_id), {
        status,
        label,
        confidence,
        summary,
        processed_at: new Date()
      });
      
      // Track user behavior based on moderation outcome
      await trackUserBehavior(userId, status, label);
      
      console.log(`[PubSub] Updated post ${request.post_id} with moderation results: status=${status}`);
    } catch (error) {
      console.error(`[PubSub] Error in simulation for post ${request.post_id}:`, error);
    }
  }, 2000); // Simulate processing delay
  
  return true;
}