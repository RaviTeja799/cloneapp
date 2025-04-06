const functions = require('@google/cloud-functions-framework');
const admin = require('firebase-admin');
const language = require('@google-cloud/language').v1;
const vision = require('@google-cloud/vision');
const {PubSub} = require('@google-cloud/pubsub');
const cors = require('cors')({origin: true});

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

// Initialize Firestore
const db = admin.firestore();

// Initialize Natural Language and Vision clients
const languageClient = new language.LanguageServiceClient();
const visionClient = new vision.ImageAnnotatorClient();

// Initialize PubSub client
const pubsub = new PubSub();
const humanReviewTopic = 'human-review-requests';

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
 * @param {string} label - The label to check
 * @returns {boolean} - Whether the label is harmful
 */
const isHarmfulLabel = (label) => {
  if (!label) return false;
  return HARMFUL_LABELS.some(harmfulLabel => 
    label.toLowerCase().includes(harmfulLabel.toLowerCase())
  );
};

/**
 * Determine moderation status based on confidence and label
 * @param {number} confidence - The confidence score (0-1)
 * @param {string} label - The detected label
 * @returns {string} - The appropriate moderation status
 */
const determineModerationStatus = (confidence, label) => {
  // If no label or not harmful, approve it
  if (!label || !isHarmfulLabel(label)) {
    return 'APPROVED';
  }
  
  // Apply tiered moderation based on confidence for harmful labels
  if (confidence > 0.7) {
    return 'REJECTED'; // Ban content with high confidence of harmful content
  } else if (confidence > 0.4) {
    return 'PENDING'; // Send for human review
  } else {
    return 'APPROVED'; // Low confidence, approve but track
  }
};

/**
 * HTTP Cloud Function to detect harmful content in text and images
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
functions.http('detect_harmful_content', async (req, res) => {
  // Handle CORS
  return cors(req, res, async () => {
    try {
      console.log('Received moderation request:', req.body);

      // Validate request
      if (!req.body || !req.body.post_id) {
        console.error('Invalid request: Missing post_id');
        return res.status(400).send({ error: 'Missing required field: post_id' });
      }

      const { post_id, text, image_url } = req.body;
      
      // Log the received content for debugging
      console.log(`Processing post ${post_id} with ${text ? 'text' : 'no text'} and ${image_url ? 'image' : 'no image'}`);

      // Validate that at least one content type is provided
      if ((!text || !text.trim()) && !image_url) {
        console.error('Invalid request: No content provided for moderation');
        return res.status(400).send({ error: 'Missing content: Please provide text or image_url' });
      }

      // Default values
      let status = 'APPROVED';
      let label = null;
      let confidence = 0;
      let summary = null;
      let errors = [];
      
      // Array to store all analysis promises
      const analysisPromises = [];
      
      // Analyze text if provided
      if (text && text.trim()) {
        analysisPromises.push(
          analyzeText(text).catch(error => {
            console.error('Error in text analysis:', error);
            errors.push('Text analysis failed');
            return { confidence: 0, label: null, summary: 'Error analyzing text content', error: true };
          })
        );
      }
      
      // Analyze image if provided
      if (image_url) {
        analysisPromises.push(
          analyzeImage(image_url).catch(error => {
            console.error('Error in image analysis:', error);
            errors.push('Image analysis failed');
            return { confidence: 0, label: null, summary: 'Error analyzing image content', error: true };
          })
        );
      }
      
      // Wait for all analyses to complete
      const results = await Promise.all(analysisPromises);
      
      // Check if all analyses failed
      const allFailed = results.every(result => result.error);
      if (allFailed && results.length > 0) {
        console.error(`All content analyses failed for post ${post_id}`);
        return res.status(500).send({ 
          error: 'Content analysis failed', 
          details: errors
        });
      }
      
      // Combine results (taking highest confidence score)
      for (const result of results) {
        if (!result.error && result.confidence > confidence) {
          confidence = result.confidence;
          label = result.label;
          summary = result.summary;
        }
      }
      
      // Determine post status based on confidence score and label
      status = determineModerationStatus(confidence, label);
      
      // If status is PENDING, publish to human-review-requests topic
      if (status === 'PENDING') {
        try {
          await publishToHumanReview(post_id, text, image_url, confidence, label);
          console.log(`Post ${post_id} published to human review queue`);
        } catch (pubsubError) {
          console.error('Error publishing to human review topic:', pubsubError);
          // Continue processing despite PubSub error
        }
      }
      
      // Track user behavior if rejected or pending
      if (status !== 'APPROVED') {
        try {
          // Get the post document to find the user ID
          const postDoc = await db.collection('posts').doc(post_id).get();
          
          if (postDoc.exists) {
            const userId = postDoc.data().user_id;
            await trackUserBehavior(userId, status, label);
          } else {
            console.error(`Post ${post_id} not found in Firestore`);
          }
        } catch (trackingError) {
          console.error('Error tracking user behavior:', trackingError);
          // Continue processing despite tracking error
        }
      }
      
      // Update Firestore with analysis results
      try {
        await db.collection('preprocessed_data').doc(post_id).update({
          status,
          label,
          confidence,
          summary,
          flaggedContent: label ? true : false,
          flagReason: label,
          moderation_details: {
            errors: errors.length > 0 ? errors : null,
            partial_analysis: errors.length > 0,
          },
          processed_at: admin.firestore.FieldValue.serverTimestamp()
        });
        
        console.log(`Updated post ${post_id} with status: ${status}`);
        
        // Send response
        res.status(200).send({
          success: true,
          post_id,
          status,
          label,
          confidence,
          summary,
          errors: errors.length > 0 ? errors : null
        });
      } catch (dbError) {
        console.error('Error updating Firestore:', dbError);
        res.status(500).send({ error: 'Failed to update post status', details: dbError.message });
      }
    } catch (error) {
      console.error('Error in detect_harmful_content function:', error);
      res.status(500).send({ error: 'Internal server error', details: error.message });
    }
  });
});

/**
 * Track user behavior based on post moderation outcome
 * @param {string} userId - The user ID
 * @param {string} status - The moderation status
 * @param {string} label - The content label
 */
async function trackUserBehavior(userId, status, label) {
  try {
    // Get user doc reference
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      console.error(`[Function] User ${userId} not found for behavior tracking`);
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
    let appealEligibleDate = userData.appealEligibleDate || null;
    let banDetails = userData.banDetails || null;
    
    if (status === 'REJECTED' && isHarmfulLabel(label)) {
      behaviorDelta = -10;
      warningCount += 1;
      
      // User gets banned after 3 rejections with harmful content
      if (warningCount >= 3 && !isBanned) {
        isBanned = true;
        
        // Set appeal eligibility date (7 days from now)
        const appealDate = new Date();
        appealDate.setDate(appealDate.getDate() + 7);
        appealEligibleDate = appealDate.toISOString();
        
        banDetails = {
          reason: `Multiple violations: Latest harmful content labeled as "${label}"`,
          banned_at: admin.firestore.FieldValue.serverTimestamp(),
          appeal_eligible: appealEligibleDate,
          violation_count: warningCount,
          severity: confidence > 0.8 ? 'high' : 'medium',
          last_flagged_content: label
        };
        
        // Add a record to banned_users collection for audit trail
        await db.collection('banned_users').add({
          user_id: userId,
          user_email: userData.email,
          user_name: userData.name || userData.displayName,
          ban_reason: banDetails.reason,
          banned_at: admin.firestore.FieldValue.serverTimestamp(),
          appeal_eligible: appealEligibleDate,
          ban_details: banDetails
        });
        
        console.log(`[Function] User ${userId} has been banned due to multiple violations`);
        
        // Create notification about ban
        await db.collection('user_notifications').add({
          user_id: userId,
          type: 'account_ban',
          title: 'Account Restricted',
          message: `Your account has been restricted due to multiple content violations. You can appeal this decision after ${new Date(appealEligibleDate).toLocaleDateString()}.`,
          details: banDetails,
          created_at: admin.firestore.FieldValue.serverTimestamp(),
          read: false
        });
      }
    } else if (status === 'PENDING' && isHarmfulLabel(label)) {
      behaviorDelta = -3;
      
      // Create a warning notification
      await db.collection('user_notifications').add({
        user_id: userId,
        type: 'content_warning',
        title: 'Content Under Review',
        message: `Your content has been flagged for review because it may contain "${label}" material. Repeated violations may result in account restrictions.`,
        details: {
          post_id: post_id,
          content_type: label,
          confidence: confidence
        },
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        read: false
      });
    }
    
    // Update user behavior score
    const currentScore = userData.behavior_score || 100; // Default starting score: 100
    const newScore = Math.max(0, Math.min(100, currentScore + behaviorDelta)); // Clamp between 0-100
    
    await userRef.update({
      behavior_score: newScore,
      last_behavior_update: admin.firestore.FieldValue.serverTimestamp(),
      isBanned,
      warningCount,
      appealEligibleDate,
      banDetails
    });
    
    console.log(`[Function] Updated behavior score for user ${userId}: ${currentScore} → ${newScore}`);
  } catch (error) {
    console.error('[Function] Error tracking user behavior:', error);
  }
}

/**
 * Analyzes text content for harmful/toxic content
 * @param {string} text - The text to analyze
 * @returns {Object} Analysis result with confidence score and label
 */
async function analyzeText(text) {
  try {
    console.log('Analyzing text content...');
    
    // Prepare request for content moderation
    const document = {
      content: text,
      type: 'PLAIN_TEXT',
    };
    
    // Analyze sentiment and classify content
    const [sentimentResult] = await languageClient.analyzeSentiment({document});
    const [classificationResult] = await languageClient.classifyText({document});
    
    // Extract sentiment score and magnitude
    const sentiment = sentimentResult.documentSentiment;
    const sentimentScore = sentiment.score;
    const sentimentMagnitude = sentiment.magnitude;
    
    // Check for harmful content based on sentiment and categories
    let harmfulCategories = [];
    let highestConfidence = 0;
    
    if (classificationResult.categories && classificationResult.categories.length > 0) {
      // Look for harmful categories
      for (const category of classificationResult.categories) {
        const categoryName = category.name.toLowerCase();
        const confidence = category.confidence;
        
        if (
          categoryName.includes('adult') || 
          categoryName.includes('offensive') || 
          categoryName.includes('violence') ||
          categoryName.includes('hate')
        ) {
          harmfulCategories.push({
            name: category.name,
            confidence: confidence
          });
          
          if (confidence > highestConfidence) {
            highestConfidence = confidence;
          }
        }
      }
    }
    
    // Calculate harmful score from sentiment (negative sentiment with high magnitude)
    let harmfulScore = 0;
    if (sentimentScore < -0.3 && sentimentMagnitude > 0.6) {
      harmfulScore = Math.abs(sentimentScore) * sentimentMagnitude;
    }
    
    // Use the higher score between category and sentiment
    const effectiveConfidence = Math.max(highestConfidence, harmfulScore);
    
    // Determine label and summary
    let label = null;
    let summary = null;
    
    if (effectiveConfidence > 0) {
      if (harmfulCategories.length > 0) {
        // Use the category with highest confidence
        const topCategory = harmfulCategories.reduce((a, b) => 
          a.confidence > b.confidence ? a : b
        );
        label = topCategory.name.split('/').pop();
        summary = `Content identified as ${label} with ${(topCategory.confidence * 100).toFixed(1)}% confidence.`;
      } else {
        label = 'negative_content';
        summary = `Content has negative tone with ${(harmfulScore * 100).toFixed(1)}% intensity.`;
      }
    }
    
    console.log(`Text analysis result: confidence=${effectiveConfidence}, label=${label}`);
    
    return {
      confidence: effectiveConfidence,
      label,
      summary
    };
  } catch (error) {
    console.error('Error analyzing text:', error);
    return {
      confidence: 0,
      label: null,
      summary: 'Error analyzing text content'
    };
  }
}

/**
 * Analyzes image content for harmful/inappropriate content
 * @param {string} imageUrl - URL of the image to analyze
 * @returns {Object} Analysis result with confidence score and label
 */
async function analyzeImage(imageUrl) {
  try {
    console.log('Analyzing image content...');
    
    // Validate the image URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      throw new Error('Invalid image URL provided');
    }
    
    // Check if URL is accessible before processing
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        throw new Error(`Image URL not accessible: ${response.status} ${response.statusText}`);
      }
    } catch (fetchError) {
      console.error('Error accessing image URL:', fetchError);
      throw new Error(`Image URL inaccessible: ${fetchError.message}`);
    }
    
    // Run safe search detection on the image
    const [result] = await visionClient.safeSearchDetection(imageUrl);
    
    // Check if we have valid results
    if (!result || !result.safeSearchAnnotation) {
      throw new Error('Vision API returned invalid or empty result');
    }
    
    const safeSearch = result.safeSearchAnnotation;
    
    // Map likelihood strings to numerical values
    const likelihoodMap = {
      'UNKNOWN': 0,
      'VERY_UNLIKELY': 0.05,
      'UNLIKELY': 0.2,
      'POSSIBLE': 0.5,
      'LIKELY': 0.8,
      'VERY_LIKELY': 0.95
    };
    
    // Calculate confidence scores for each category
    const adult = likelihoodMap[safeSearch.adult] || 0;
    const violence = likelihoodMap[safeSearch.violence] || 0;
    const racy = likelihoodMap[safeSearch.racy] || 0;
    const medical = likelihoodMap[safeSearch.medical] || 0;
    const spoof = likelihoodMap[safeSearch.spoof] || 0;
    
    // Log all scores for debugging
    console.log(`Image analysis scores: adult=${adult}, violence=${violence}, racy=${racy}, medical=${medical}, spoof=${spoof}`);
    
    // Use the highest score as the confidence
    const scores = [
      { label: 'adult', score: adult },
      { label: 'violence', score: violence },
      { label: 'racy', score: racy },
      { label: 'medical', score: medical },
      { label: 'spoof', score: spoof }
    ];
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    // Get the highest score
    const highestScore = scores[0];
    
    // Only consider as harmful if score is high enough
    if (highestScore.score >= 0.4) {
      console.log(`Image analysis result: confidence=${highestScore.score}, label=${highestScore.label}`);
      
      return {
        confidence: highestScore.score,
        label: highestScore.label,
        summary: `Image contains ${highestScore.label} content with ${(highestScore.score * 100).toFixed(1)}% confidence.`,
        allScores: scores.reduce((obj, item) => {
          obj[item.label] = item.score;
          return obj;
        }, {})
      };
    }
    
    console.log('Image analysis result: No harmful content detected');
    
    return {
      confidence: 0,
      label: null,
      summary: null,
      allScores: scores.reduce((obj, item) => {
        obj[item.label] = item.score;
        return obj;
      }, {})
    };
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Determine if error is related to image access or processing
    const isAccessError = error.message && (
      error.message.includes('URL') || 
      error.message.includes('access') ||
      error.message.includes('404') ||
      error.message.includes('403')
    );
    
    // Return detailed error information
    return {
      confidence: 0,
      label: 'error',
      summary: `Error analyzing image content: ${error.message}`,
      error: true,
      errorType: isAccessError ? 'access_error' : 'processing_error',
      errorDetails: error.message
    };
  }
}

/**
 * Publishes a message to the human review topic
 * @param {string} postId - The ID of the post
 * @param {string} text - The text content of the post
 * @param {string} imageUrl - The image URL of the post
 * @param {number} confidence - The confidence score
 * @param {string} label - The detected label
 * @returns {Promise<void>}
 */
async function publishToHumanReview(postId, text, imageUrl, confidence, label) {
  const message = {
    post_id: postId,
    text_content: text,
    image_url: imageUrl,
    confidence,
    label,
    timestamp: new Date().toISOString()
  };
  
  const messageBuffer = Buffer.from(JSON.stringify(message));
  
  try {
    const messageId = await pubsub.topic(humanReviewTopic).publish(messageBuffer);
    console.log(`Message ${messageId} published to topic ${humanReviewTopic}`);
  } catch (error) {
    console.error('Error publishing to Pub/Sub:', error);
    throw error;
  }
}