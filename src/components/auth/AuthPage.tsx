import React, { useState } from 'react';
import { useKaksha } from '../../store/kakshaStore';
import {
  GraduationCap,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  BookOpen,
  Calendar,
  ShieldAlert,
  Loader2,
  Mail,
  Lock,
  Smartphone,
} from 'lucide-react';
import { UserRole } from '../../types';
import { auth, googleProvider } from '../../lib/firebase';
import { signInWithPopup } from 'firebase/auth';
import { supabase } from '../../lib/supabase';

export const AuthPage: React.FC = () => {
  const { loginWithGoogleUser, loginWithSupabaseEmailUser } = useKaksha();

  const [selectedRole, setSelectedRole] = useState<UserRole>('teacher');
  const [authMethod, setAuthMethod] = useState<'google' | 'email' | 'phone'>('google');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');

  // Supabase Email & Password state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');

  // Mobile Auth state (Supabase Phone OTP)
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'phone' | 'otp'>('phone');

  const [deviceId] = useState('device-primary');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // 1. Google Authentication
  const handleGoogleSignIn = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const googleUser = result.user;

      loginWithGoogleUser(
        {
          uid: googleUser.uid,
          email: googleUser.email,
          displayName: googleUser.displayName,
          photoURL: googleUser.photoURL,
        },
        selectedRole,
        deviceId
      );

      setSuccessMsg(`Welcome ${googleUser.displayName || googleUser.email}! Authentication successful.`);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      if (err.code === 'auth/popup-closed-by-user') {
        setErrorMsg('Sign-in popup was closed. Please try again.');
      } else {
        setErrorMsg(err.message || 'Failed to authenticate with Google.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email & Password Authentication
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide a valid email and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);

    try {
      if (emailMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName.trim() || undefined,
              role: selectedRole,
            },
          },
        });

        if (error) throw error;

        if (data.user) {
          loginWithSupabaseEmailUser(
            {
              id: data.user.id,
              email: data.user.email,
              user_metadata: { full_name: fullName || data.user.email?.split('@')[0] },
            },
            selectedRole,
            deviceId
          );
          setSuccessMsg('Account created successfully! Welcome to Kaksha.');
        } else {
          setSuccessMsg('Please check your email inbox to verify your account.');
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data.user) {
          loginWithSupabaseEmailUser(
            {
              id: data.user.id,
              email: data.user.email,
              user_metadata: data.user.user_metadata,
            },
            selectedRole,
            deviceId
          );
          setSuccessMsg('Signed in successfully!');
        }
      }
    } catch (err: any) {
      console.error('Email Auth Error:', err);
      setErrorMsg(err.message || 'Failed to authenticate email.');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Mobile Number Authentication (Supabase Phone OTP)
  const handleSendPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const formattedPhone = phone.startsWith('+') ? phone.trim() : `+91${phone.replace(/\D/g, '')}`;
    if (formattedPhone.length < 12) {
      setErrorMsg('Please enter a valid 10-digit mobile number.');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        if (error.message.includes('SMS provider') || error.message.includes('Twilio') || error.message.includes('disabled')) {
          setErrorMsg('Mobile SMS provider is not configured in your Supabase backend yet. Please configure Twilio or MessageBird in your Supabase Dashboard under Authentication -> Providers -> Phone.');
        } else {
          throw error;
        }
        return;
      }

      setSuccessMsg(`Verification OTP sent to ${formattedPhone}!`);
      setPhoneStep('otp');
    } catch (err: any) {
      console.error('Supabase Phone OTP Error:', err);
      setErrorMsg(err.message || 'Failed to send OTP to mobile number.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPhoneOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (phoneOtp.length < 6) {
      setErrorMsg('Please enter the 6-digit OTP code.');
      return;
    }

    const formattedPhone = phone.startsWith('+') ? phone.trim() : `+91${phone.replace(/\D/g, '')}`;
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: phoneOtp,
        type: 'sms',
      });

      if (error) throw error;

      if (data.user) {
        loginWithSupabaseEmailUser(
          {
            id: data.user.id,
            email: data.user.email || formattedPhone,
            user_metadata: { full_name: `User ${formattedPhone.slice(-4)}` },
          },
          selectedRole,
          deviceId
        );
        setSuccessMsg('Phone Number Verified! Welcome to Kaksha.');
      }
    } catch (err: any) {
      console.error('Supabase Verify Phone Error:', err);
      setErrorMsg(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col justify-between selection:bg-amber-500 selection:text-slate-950 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      {/* Background Glow Accents */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 right-0 translate-x-20 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Brand Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <GraduationCap className="w-7 h-7" />
          </div>
          <div>
            <span className="text-2xl font-black tracking-tight text-white">
              Kaksha<span className="text-amber-400">.</span>
            </span>
            <span className="ml-2 bg-amber-400/20 text-amber-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wider">
              by Kilobytz Studio
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 text-xs font-medium text-slate-400">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Secure Cloud Identity Verification</span>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10 flex-1">
        {/* Left Info Column */}
        <div className="lg:col-span-7 space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-900/60 text-indigo-300 text-xs font-extrabold px-3 py-1.5 rounded-full border border-indigo-700/60">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Digital Operating Layer for India's Local Tuition</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black leading-tight text-white tracking-tight">
            One platform for the teacher.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-200">
              One unified space for the student.
            </span>
          </h1>

          <p className="text-slate-400 text-sm sm:text-base max-w-xl leading-relaxed">
            Eliminate fragmented WhatsApp groups and paper timetables. Kaksha provides a unified classroom environment with real-time sync.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <BookOpen className="w-6 h-6 text-indigo-400" />
              <h4 className="text-xs font-bold text-white">Persistent Batches</h4>
              <p className="text-[11px] text-slate-400">Share unique batch code e.g. MATH-7XQ2 with students.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <Calendar className="w-6 h-6 text-amber-400" />
              <h4 className="text-xs font-bold text-white">Unified Timeline</h4>
              <p className="text-[11px] text-slate-400">Aggregates classes across all teachers into one timeline.</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-2">
              <ShieldCheck className="w-6 h-6 text-emerald-400" />
              <h4 className="text-xs font-bold text-white">Encrypted Identity</h4>
              <p className="text-[11px] text-slate-400">Verified identity with role-based access control.</p>
            </div>
          </div>
        </div>

        {/* Right Auth Card */}
        <div className="lg:col-span-5">
          <div className="bg-white text-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
            {errorMsg && (
              <div className="mb-4 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Account Role Selector */}
            <div className="mb-5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Select Account Type
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedRole('teacher')}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                    selectedRole === 'teacher'
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>👨‍🏫 Teacher</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('student')}
                  className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all border ${
                    selectedRole === 'student'
                      ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md shadow-amber-200'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>👨‍🎓 Student</span>
                </button>
              </div>
            </div>

            {/* Auth Provider Tabs */}
            <div className="grid grid-cols-3 gap-1 border-b border-slate-200 mb-6">
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('google');
                  setErrorMsg('');
                }}
                className={`pb-3 text-xs font-extrabold transition-all border-b-2 text-center ${
                  authMethod === 'google'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Google
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('email');
                  setErrorMsg('');
                }}
                className={`pb-3 text-xs font-extrabold transition-all border-b-2 text-center ${
                  authMethod === 'email'
                    ? 'border-emerald-600 text-emerald-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod('phone');
                  setErrorMsg('');
                }}
                className={`pb-3 text-xs font-extrabold transition-all border-b-2 text-center ${
                  authMethod === 'phone'
                    ? 'border-amber-500 text-amber-600'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}
              >
                Mobile OTP
              </button>
            </div>

            {/* METHOD 1: GOOGLE */}
            {authMethod === 'google' && (
              <div className="space-y-4 py-2">
                <div className="text-center space-y-1">
                  <h3 className="text-lg font-black text-slate-900">Sign in with Google</h3>
                  <p className="text-xs text-slate-500">
                    Instant verification using your Google Account.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 font-bold py-3.5 px-4 border-2 border-slate-200 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-3 text-sm disabled:opacity-60"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </button>

                <div className="pt-2 text-center text-[11px] text-slate-400">
                  Safe & encrypted identity authentication.
                </div>
              </div>
            )}

            {/* METHOD 2: EMAIL */}
            {authMethod === 'email' && (
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">
                    {emailMode === 'signin' ? 'Email Sign In' : 'Create Email Account'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailMode(emailMode === 'signin' ? 'signup' : 'signin');
                      setErrorMsg('');
                    }}
                    className="text-xs font-bold text-emerald-600 underline"
                  >
                    {emailMode === 'signin' ? 'Need an account?' : 'Already registered?'}
                  </button>
                </div>

                {emailMode === 'signup' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Ananya Roy"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <div className="relative">
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <Mail className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      required
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl shadow-md shadow-emerald-200 transition-all flex items-center justify-center gap-2 text-xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span>{emailMode === 'signin' ? 'Sign In' : 'Register Account'}</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* METHOD 3: MOBILE NUMBER OTP */}
            {authMethod === 'phone' && (
              <div className="space-y-4">
                {phoneStep === 'phone' ? (
                  <form onSubmit={handleSendPhoneOTP} className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-sm font-bold text-slate-900">Sign In via Mobile OTP</h3>
                      <p className="text-xs text-slate-500">Enter your 10-digit mobile number to receive a verification OTP.</p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                      <div className="relative">
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+91 98765 43210"
                          className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                          required
                        />
                        <Smartphone className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Send Verification OTP</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyPhoneOTP} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-900">Enter OTP Code</h3>
                      <button
                        type="button"
                        onClick={() => setPhoneStep('phone')}
                        className="text-xs text-amber-600 font-bold underline"
                      >
                        Change Number
                      </button>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">6-Digit Mobile OTP</label>
                      <input
                        type="text"
                        maxLength={6}
                        value={phoneOtp}
                        onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full tracking-widest text-center px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-mono font-bold text-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                        required
                        autoFocus
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold py-3 rounded-xl shadow-md shadow-amber-200 transition-all flex items-center justify-center gap-2 text-xs"
                    >
                      {isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <span>Verify & Sign In</span>
                          <CheckCircle2 className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto px-6 py-4 text-center text-xs text-slate-500 border-t border-slate-800/80 relative z-10">
        Kaksha • Powered by Kilobytz Studio (KBS)
      </footer>
    </div>
  );
};
