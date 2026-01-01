import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut, reload } from 'firebase/auth';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                // Optional: Force a reload to get the latest emailVerified status
                // if they just coming back from the verify page.
                try {
                    await reload(u);
                } catch (e) {
                    console.error("Context reload error:", e);
                }
            }
            setUser(u);
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const logout = () => signOut(auth);

    // This is helpful for your Login page to "refresh" the user 
    // and check if emailVerified is now true.
    const refreshUser = async () => {
        if (auth.currentUser) {
            await reload(auth.currentUser);
            setUser({ ...auth.currentUser });
        }
    };

    return (
        <AuthContext.Provider value={{ user, logout, loading, refreshUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);