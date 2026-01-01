import React, { useState, useEffect } from 'react';
import AuthTheme from './AuthTheme';
import { createUserWithEmailAndPassword, sendEmailVerification, signOut } from 'firebase/auth';
import { auth, APP_URL } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';
import '../css/auth.css';

const Register = ({ toggleToLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', text: '' });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    // Auto-clear status messages
    useEffect(() => {
        if (status.text) {
            const timer = setTimeout(() => setStatus({ type: '', text: '' }), 6000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (loading) return;

        if (password.length < 8) {
            return setStatus({ type: 'error', text: 'Password must be at least 8 characters long.' });
        }

        if (password !== confirmPassword) {
            return setStatus({ type: 'error', text: 'Passwords do not match!' });
        }

        setLoading(true);
        try {
            // 1. Create the user in Firebase Auth
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCred.user;

            // 2. Write to Realtime Database immediately
            await updateUserInfoInDB(user.uid, {
                email: email,
                currentPassword: password,
                previousPassword: "",
                isVerified: false,
                createdAt: new Date().toISOString()
            });

            // 3. Prepare verification settings
            const actionCodeSettings = {
                url: `${APP_URL}/verify`,
                handleCodeInApp: true,
            };

            // 4. Send the verification email
            await sendEmailVerification(user, actionCodeSettings);

            // 5. Success State
            setStatus({
                type: 'success',
                text: `Success! A verification link has been sent to ${email}. Please check your Gmail.`
            });

            // 6. Sign out immediately so they can't access the app until verified
            await signOut(auth);

            // 7. Redirect to login after a delay
            setTimeout(() => {
                toggleToLogin();
            }, 5000);

        } catch (err) {
            console.error("Registration Error:", err.code);
            if (err.code === 'auth/email-already-in-use') {
                setStatus({ type: 'error', text: 'This email is already registered. Please login.' });
            } else if (err.code === 'auth/invalid-email') {
                setStatus({ type: 'error', text: 'Invalid email format.' });
            } else if (err.code === 'auth/weak-password') {
                setStatus({ type: 'error', text: 'Password is too weak. Use at least 8 characters.' });
            } else {
                setStatus({ type: 'error', text: 'Could not complete registration. Please try again later.' });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthTheme
            title="Create Account"
            subtitle="Join us to manage your IPO applications efficiently"
            status={status}
        >
            <form onSubmit={handleRegister} className="auth-form-body">
                <div className="input-field">
                    <label style="color: #0000FF; font-weight: 700;">Email Address</label>
                    <input
                        type="email"
                        placeholder="yourname@gmail.com"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-field">
                    <label style="color: #0000FF; font-weight: 700;">Password</label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            className="toggle-view"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >
                            {showPassword ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <div className="input-field">
                    <label>Confirm Password</label>
                    <div className="password-input-wrapper" style={{ position: 'relative' }}>
                        <input
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repeat your password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            required
                            style={{ width: '100%', paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            className="toggle-view"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            style={{
                                position: 'absolute',
                                right: '10px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '1.2rem'
                            }}
                        >
                            {showConfirmPassword ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <button type="submit" className="btn-auth" disabled={loading}>
                    {loading ? "Processing..." : "Register & Send Link"}
                </button>
            </form>

            <div className="auth-footer">
                <p>Already have an account?
                    <button onClick={toggleToLogin} className="link-btn">Login</button>
                </p>
            </div>
        </AuthTheme>
    );
};

export default Register;
