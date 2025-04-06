import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChange, isModeratorEmail } from '../firebase/auth';
import { db } from '../firebase/config';

interface UserData {
  uid: string;
  name: string;
  email: string | null;
  isModerator: boolean;
  posts: number;
  behavior_score?: number; 
  followers: number;
  following: number;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Fetch user data from Firestore
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            setUserData({
              uid: user.uid,
              name: data.name || user.displayName || 'User',
              email: user.email,
              isModerator: data.isModerator || isModeratorEmail(user.email),
              posts: data.posts || 0,
              followers: data.followers || 0,
              following: data.following || 0
            });
          } else {
            // Set default user data if not in Firestore
            setUserData({
              uid: user.uid,
              name: user.displayName || 'User',
              email: user.email,
              isModerator: isModeratorEmail(user.email),
              posts: 0,
              followers: 0,
              following: 0
            });
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      } else {
        setUserData(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userData,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};