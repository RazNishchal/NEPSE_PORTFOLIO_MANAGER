import React, { useEffect, useState } from 'react';
import { applyActionCode } from 'firebase/auth';
import AuthTheme from './AuthTheme';
import { auth, APP_URL } from '../../firebase';
import { updateUserInfoInDB } from '../../services/portfolioService'; // ✨ Import helper
import '../css/verify.css';

const Verify = () => {
    const [status, setStatus] = useState('verifying');

    useEffect(() => {
        const queryParams = new URLSearchParams(window.location.search);
        const oobCode = queryParams.get('oobCode');

        if (oobCode) {
            applyActionCode(auth, oobCode)
                .then(async () => {
                    // ✨ ADDED: Update DB to mark as verified
                    // This helps your scraper identify active accounts
                    if (auth.currentUser) {
                        await updateUserInfoInDB(auth.currentUser.uid, {
                            isVerified: true,
                            verifiedAt: new Date().toISOString()
                        });
                    }
                    setStatus('success');
                })
                .catch((error) => {
                    console.error("Verification error:", error);
                    setStatus('error');
                });
        } else {
            setStatus('error');
        }
    }, []);

    const goToLogin = () => {
        window.location.href = APP_URL;
    };

    return (
        <div className="auth-wrapper">
            <div className="form-slide-in" style={{ textAlign: 'center', justifyContent: 'center' }}>

                {status === 'verifying' && (
                    <div className="auth-header">
                        {/* You can add a CSS spinner class here */}
                        <div className="loading-dots">...</div>
                        <h1>Verifying Email</h1>
                        <p>Just a second while we confirm your account.</p>
                    </div>
                )}

                {status === 'success' && (
                    <>
                        <div className="auth-header">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✨</div>
                            <h1>Verified!</h1>
                            <p>Your email has been successfully confirmed. You're all set to manage your IPOs.</p>
                        </div>

                        <div className="auth-form-body">
                            <button className="btn-auth" onClick={goToLogin}>
                                Proceed to Login
                            </button>
                        </div>
                    </>
                )}

                {status === 'error' && (
                    <>
                        <div className="auth-header">
                            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
                            <h1>Oops!</h1>
                            <p>This link is invalid or has expired. Please try requesting a new verification link.</p>
                        </div>

                        <div className="auth-form-body">
                            <button className="btn-auth" onClick={goToLogin} style={{ background: '#64748b' }}>
                                Back to Home
                            </button>
                        </div>
                    </>
                )}

                <div className="auth-footer">
                    <p>© {new Date().getFullYear()} Your Company Name</p>
                </div>
            </div>
        </div>
    );
};

export default Verify;