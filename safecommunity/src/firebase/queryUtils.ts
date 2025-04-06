import { 
  query, 
  collection, 
  where, 
  orderBy, 
  limit, 
  startAfter, 
  DocumentData, 
  QueryConstraint,
  QueryDocumentSnapshot,
  FirestoreError,
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './config';

/**
 * Configuration for pagination
 */
export interface PaginationConfig {
  pageSize: number;
  orderByField: string;
  orderDirection: 'asc' | 'desc';
  startAfterDoc?: QueryDocumentSnapshot<DocumentData>;
}

/**
 * Configuration for efficient Firestore queries
 */
export interface QueryConfig {
  collectionName: string;
  whereConditions?: Array<{
    field: string;
    operator: '==' | '!=' | '>' | '>=' | '<' | '<='; 
    value: any;
  }>;
  orderByField?: string;
  orderDirection?: 'asc' | 'desc';
  limitCount?: number;
}

/**
 * Creates an optimized Firestore query with the given configuration
 * @param {QueryConfig} config - The query configuration
 * @returns Firestore query with appropriate constraints
 */
export const createOptimizedQuery = (config: QueryConfig) => {
  const constraints: QueryConstraint[] = [];
  
  // Add where conditions if provided
  if (config.whereConditions) {
    for (const condition of config.whereConditions) {
      constraints.push(where(condition.field, condition.operator, condition.value));
    }
  }
  
  // Add orderBy if provided
  if (config.orderByField) {
    constraints.push(orderBy(config.orderByField, config.orderDirection || 'desc'));
  }
  
  // Add limit if provided
  if (config.limitCount) {
    constraints.push(limit(config.limitCount));
  }
  
  return query(collection(db, config.collectionName), ...constraints);
};

/**
 * Creates a paginated query for efficient data fetching
 * @param {string} collectionName - The Firestore collection to query
 * @param {PaginationConfig} paginationConfig - Configuration for pagination
 * @param {QueryConstraint[]} additionalConstraints - Additional query constraints
 * @returns Firestore query with pagination applied
 */
export const createPaginatedQuery = (
  collectionName: string,
  paginationConfig: PaginationConfig,
  additionalConstraints: QueryConstraint[] = []
) => {
  const constraints: QueryConstraint[] = [
    ...additionalConstraints,
    orderBy(paginationConfig.orderByField, paginationConfig.orderDirection),
    limit(paginationConfig.pageSize)
  ];
  
  // Add startAfter if we have a previous document for pagination
  if (paginationConfig.startAfterDoc) {
    constraints.push(startAfter(paginationConfig.startAfterDoc));
  }
  
  return query(collection(db, collectionName), ...constraints);
};

/**
 * Sets up a listener with automatic cleanup when component unmounts
 * @param {DocumentReference} docRef - Document reference to listen to
 * @param {Function} callback - Callback function for document changes
 * @param {Function} errorCallback - Optional callback for errors
 * @returns {Object} Object with unsubscribe function
 */
export const createDocumentListener = (
  docRef: DocumentReference<DocumentData>,
  callback: (doc: DocumentSnapshot<DocumentData>) => void,
  errorCallback?: (error: FirestoreError) => void
) => {
  const unsubscribe = onSnapshot(
    docRef,
    (doc) => {
      try {
        callback(doc);
      } catch (err) {
        console.error('[QueryUtils] Error processing document snapshot:', err);
        if (errorCallback && err instanceof FirestoreError) {
          errorCallback(err as FirestoreError);
        }
      }
    },
    (error) => {
      console.error('[QueryUtils] Error in document listener:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
  
  return {
    unsubscribe
  };
};

/**
 * Sets up a memory-efficient query listener with throttling
 * @param {QueryConfig} queryConfig - Configuration for the query
 * @param {Function} callback - Callback function for query results
 * @param {Function} errorCallback - Optional callback for handling Firestore errors
 * @param {Object} options - Additional options like throttle time
 * @returns {Unsubscribe} Function to unsubscribe from the listener
 */
export const createThrottledQueryListener = (
  queryConfig: QueryConfig,
  callback: (docs: QueryDocumentSnapshot<DocumentData>[]) => void,
  errorCallback?: (error: FirestoreError) => void,
  options = { throttleMs: 1000 }
): Unsubscribe => {
  const q = createOptimizedQuery(queryConfig);
  
  let lastCallTime = 0;
  let pendingDocs: QueryDocumentSnapshot<DocumentData>[] | null = null;
  let timeoutId: NodeJS.Timeout | null = null;
  
  // Create the throttled callback function
  const throttledCallback = (docs: QueryDocumentSnapshot<DocumentData>[]) => {
    const now = Date.now();
    if (now - lastCallTime >= options.throttleMs) {
      // It's been long enough since the last call, call immediately
      lastCallTime = now;
      callback(docs);
      pendingDocs = null;
    } else {
      // Store the docs for later and set a timeout if not already set
      pendingDocs = docs;
      if (!timeoutId) {
        timeoutId = setTimeout(() => {
          if (pendingDocs) {
            lastCallTime = Date.now();
            callback(pendingDocs);
            pendingDocs = null;
          }
          timeoutId = null;
        }, options.throttleMs - (now - lastCallTime));
      }
    }
  };
  
  // Set up the listener with the throttled callback
  return onSnapshot(
    q,
    (snapshot) => {
      try {
        throttledCallback(snapshot.docs);
      } catch (err) {
        console.error('[QueryUtils] Error processing query snapshot:', err);
        if (errorCallback && err instanceof FirestoreError) {
          errorCallback(err);
        }
      }
    },
    (error) => {
      console.error('[QueryUtils] Error in throttled query listener:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
};

/**
 * Creates a smart query listener that only calls the callback when data has meaningfully changed
 * @param {QueryConfig} queryConfig - The query configuration
 * @param {Function} callback - Callback function for query results
 * @param {Function} changeDetector - Optional function to detect meaningful changes
 * @param {Function} errorCallback - Optional callback for handling Firestore errors
 * @returns {Unsubscribe} Function to unsubscribe from the listener
 */
export const createSmartQueryListener = (
  queryConfig: QueryConfig,
  callback: (docs: DocumentData[]) => void,
  changeDetector?: (previous: DocumentData[], current: DocumentData[]) => boolean,
  errorCallback?: (error: FirestoreError) => void
): Unsubscribe => {
  const q = createOptimizedQuery(queryConfig);
  
  let previousData: DocumentData[] = [];
  
  return onSnapshot(
    q, 
    (querySnapshot) => {
      try {
        const currentData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        // If no change detector provided, always call the callback
        if (!changeDetector) {
          previousData = currentData;
          callback(currentData);
          return;
        }
        
        // Otherwise, only call if the change detector determines there's a meaningful change
        if (changeDetector(previousData, currentData)) {
          previousData = currentData;
          callback(currentData);
        }
      } catch (err) {
        console.error('[QueryUtils] Error processing smart query snapshot:', err);
        if (errorCallback && err instanceof FirestoreError) {
          errorCallback(err);
        }
      }
    },
    (error) => {
      console.error('[QueryUtils] Error in smart query listener:', error);
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
};