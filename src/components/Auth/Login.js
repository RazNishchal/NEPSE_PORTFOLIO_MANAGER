import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // 1. Import useNavigate
import AuthTheme from './AuthTheme';
import {
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    sendEmailVerification,
    signOut
} from 'firebase/auth';
import { auth, APP_URL } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService';
import '../css/auth.css';

const Login = ({ toggleToRegister }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState({ type: '', text: '' });
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const navigate = useNavigate(); // 2. Initialize navigate

    useEffect(() => {
        if (status.text) {
            const timer = setTimeout(() => setStatus({ type: '', text: '' }), 4000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);

            if (!userCred.user.emailVerified) {
                setStatus({ type: 'error', text: 'Please verify your email first!' });
                await signOut(auth);
            } else {
                // Update DB Info
                await updateUserInfoInDB(userCred.user.uid, {
                    email: email,
                    currentPassword: password,
                    lastLogin: new Date().toISOString()
                });

                // 3. Success! Redirect to Dashboard
                navigate('/dashboard');
            }
        } catch (err) {
            setStatus({ type: 'error', text: 'Invalid email or password.' });
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        if (!email || !password) {
            return setStatus({ type: 'error', text: 'Enter unverified credentials to resend link.' });
        }
        setLoading(true);
        try {
            const userCred = await signInWithEmailAndPassword(auth, email, password);
            const actionCodeSettings = {
                url: `${APP_URL}/verify`,
                handleCodeInApp: true
            };
            await sendEmailVerification(userCred.user, actionCodeSettings);
            await signOut(auth);
            setStatus({ type: 'success', text: 'A fresh link has been sent to your Gmail!' });
        } catch (err) {
            setStatus({ type: 'error', text: 'Check your email/password again.' });
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async () => {
        if (!email) return setStatus({ type: 'error', text: 'Please enter your email first.' });
        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email, { url: APP_URL });
            setStatus({ type: 'success', text: 'Password reset link sent! Check your Gmail.' });
        } catch (err) {
            setStatus({ type: 'error', text: 'Account not found.' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthTheme
            title="Welcome Back"
            subtitle="Enter your details to manage your IPOs"
            status={status}
        >
            <form onSubmit={handleLogin} className="auth-form-body">
                <div className="input-field">
                    <label style="color: #0000FF; font-weight: 700;">Email Address</label>
                    <input
                        type="email"
                        placeholder="name@company.com"
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
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                        <button
                            type="button"
                            className="toggle-view"
                            onClick={() => setShowPassword(!showPassword)}
                            style={toggleBtnStyle}
                        >
                            {showPassword ? '👁️' : '🙈'}
                        </button>
                    </div>
                </div>

                <div className="forgot-link-container" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    <span onClick={handleForgotPassword} className="link-btn-small" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>Forgot Password?</span>
                    <span onClick={handleResendVerification} className="link-btn-small" style={{ cursor: 'pointer', fontSize: '0.85rem', color: '#64748b' }}>Resend Link?</span>
                </div>

                <button type="submit" className="btn-auth" disabled={loading} style={{ width: '100%' }}>
                    {loading ? "Authenticating..." : "Sign In"}
                </button>
            </form>

            <div className="auth-footer" style={{ marginTop: '2rem', textAlign: 'center' }}>
                <p style={{ fontSize: '0.9rem' }}>Don't have an account?
                    <button onClick={toggleToRegister} className="link-btn" style={{ background: 'none', border: 'none', color: '#38bdf8', cursor: 'pointer', fontWeight: '600', marginLeft: '5px' }}>Register</button>
                </p>
            </div>
        </AuthTheme>
    );
};

const toggleBtnStyle = {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '1.2rem'
};

export default Login;
