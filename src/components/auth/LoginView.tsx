import React, { useState } from 'react';
import {
  Lock,
  Mail,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  UserPlus,
  KeyRound,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AlabdullatifLogo, NajdiPatternDivider, NajdiGeometricBackground } from '../common/NajdiMotifs';

export const LoginView: React.FC = () => {
  const { signIn, signUp, resetPassword } = useAuth();
  const { language, setLanguage } = useLanguage();

  const [mode, setMode] = useState<'LOGIN' | 'SIGNUP'>('LOGIN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [forgotFeedback, setForgotFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage(
        language === 'ar'
          ? 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
          : 'Please enter your email and password'
      );
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'LOGIN') {
        const res = await signIn(email, password);
        if (!res.success) {
          setErrorMessage(
            res.error?.includes('Invalid login credentials')
              ? (language === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Invalid email or password')
              : res.error || (language === 'ar' ? 'فشل تسجيل الدخول' : 'Failed to sign in')
          );
        }
      } else {
        const res = await signUp(email, password, name);
        if (!res.success) {
          setErrorMessage(res.error || (language === 'ar' ? 'فشل إنشاء الحساب' : 'Failed to create account'));
        } else {
          setSuccessMessage(
            res.message ||
              (language === 'ar'
                ? 'تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول'
                : 'Account created successfully! You can now sign in.')
          );
          setMode('LOGIN');
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) {
      setForgotFeedback({
        type: 'error',
        message: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter your email address',
      });
      return;
    }

    setIsForgotLoading(true);
    setForgotFeedback(null);

    const res = await resetPassword(forgotEmail);
    setIsForgotLoading(false);

    if (res.success) {
      setForgotFeedback({
        type: 'success',
        message:
          language === 'ar'
            ? 'تم إرسال رابط استعادة كلمة المرور إلى بريدك الإلكتروني.'
            : res.message || 'Password reset email sent.',
      });
    } else {
      setForgotFeedback({
        type: 'error',
        message: res.error || (language === 'ar' ? 'تعذر إرسال الرابط' : 'Failed to send reset email'),
      });
    }
  };

  return (
    <div className="min-h-screen bg-cream-100 flex flex-col justify-center items-center p-4 selection:bg-sand-500 selection:text-najdi-900 relative overflow-hidden font-sans">
      {/* Najdi Geometric Background — subtle, architectural */}
      <NajdiGeometricBackground dark={false} />

      {/* Language Switcher */}
      <div className="absolute top-6 end-6 z-20">
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="px-3.5 py-1.5 rounded-xl bg-najdi-900/90 hover:bg-najdi-800 text-sand-200 text-xs font-semibold border border-najdi-800 shadow-md transition-colors"
        >
          {language === 'en' ? 'العربية' : 'English'}
        </button>
      </div>

      <div className="w-full max-w-md space-y-5 relative z-10 my-auto">
        {/* Alabdullatif Tower Brand Header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <AlabdullatifLogo size="lg" variant="light" />

          <p className="text-xs text-sand-400 font-medium max-w-sm pt-2">
            {language === 'ar'
              ? 'بوابة الملاك لإدارة عقود الإيجار والتحصيلات العقارية'
              : 'Owner Portal for Commercial Leases & Real Estate Collections'}
          </p>

          <NajdiPatternDivider className="text-bronze-500/25 max-w-xs pt-1" />
        </div>

        {/* Auth Card in Deep Najdi Brown with Bronze Border */}
        <div className="bg-najdi-900/95 backdrop-blur-xl border border-najdi-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-2xl bg-najdi-950 border border-najdi-800/80">
            <button
              type="button"
              onClick={() => {
                setMode('LOGIN');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'LOGIN'
                  ? 'bg-sand-500 text-najdi-900 shadow-sm'
                  : 'text-sand-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('SIGNUP');
                setErrorMessage(null);
              }}
              className={`py-2 rounded-xl text-xs font-bold transition-all ${
                mode === 'SIGNUP'
                  ? 'bg-sand-500 text-najdi-900 shadow-sm'
                  : 'text-sand-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'حساب جديد' : 'New Account'}
            </button>
          </div>

          {/* Feedback Messages */}
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-danger-950/60 border border-danger-800/60 text-danger-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-2xl bg-sand-950/60 border border-sand-700/60 text-sand-300 text-xs font-medium flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-sand-400" />
              <span>{successMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'SIGNUP' && (
              <div>
                <label className="block text-xs font-semibold text-sand-300 mb-1.5">
                  {language === 'ar' ? 'الاسم الكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <UserPlus className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-500" />
                  <input
                    type="text"
                    required
                    placeholder={language === 'ar' ? 'مثال: مالك العقار' : 'e.g. Property Owner'}
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-najdi-800 bg-najdi-950 text-sm text-cream-50 placeholder-sand-600 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-sand-300 mb-1.5">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="owner@alabdullatif.sa"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full ps-10 pe-4 py-2.5 rounded-xl border border-najdi-800 bg-najdi-950 text-sm text-cream-50 placeholder-sand-600 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-sand-300">
                  {language === 'ar' ? 'كلمة المرور' : 'Password'}
                </label>
                {mode === 'LOGIN' && (
                  <button
                    type="button"
                    onClick={() => {
                      setForgotEmail(email);
                      setForgotFeedback(null);
                      setShowForgotModal(true);
                    }}
                    className="text-[11px] text-bronze-400 hover:text-bronze-300 font-medium transition-colors"
                  >
                    {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute start-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-sand-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete={mode === 'LOGIN' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full ps-10 pe-11 py-2.5 rounded-xl border border-najdi-800 bg-najdi-950 text-sm text-cream-50 placeholder-sand-600 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute end-3 top-1/2 -translate-y-1/2 p-1 text-sand-500 hover:text-cream-50 transition-colors"
                  title={showPassword ? 'Hide Password' : 'Show Password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-2 py-3 rounded-xl bg-sand-500 hover:bg-sand-600 active:scale-[0.99] text-najdi-900 font-bold text-sm transition-all shadow-lg shadow-sand-900/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>{language === 'ar' ? 'جارِ التحقق...' : 'Signing In...'}</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'LOGIN'
                      ? language === 'ar'
                        ? 'تسجيل الدخول'
                        : 'Sign In'
                      : language === 'ar'
                      ? 'إنشاء حساب جديد'
                      : 'Create Account'}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Security / Compliance Badge */}
        <div className="text-center text-xs text-sand-500 space-y-1">
          <div className="flex items-center justify-center gap-1.5 text-sand-400 font-medium">
            <ShieldCheck className="h-4 w-4 text-bronze-400" />
            <span>{language === 'ar' ? 'سحابي متزامن عبر Supabase • مشفر ومحمي' : 'Encrypted & Real-time Cloud Sync via Supabase'}</span>
          </div>
          <p className="text-[10px] text-sand-600">
            برج العبداللطيف • الرياض، المملكة العربية السعودية
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-najdi-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-najdi-900 border border-najdi-800 rounded-3xl p-6 shadow-2xl space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-najdi-800 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="h-5 w-5 text-bronze-400" />
                <h3 className="text-sm font-serif font-bold text-cream-50">
                  {language === 'ar' ? 'استعادة كلمة المرور' : 'Reset Password'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowForgotModal(false)}
                className="p-1 rounded-lg text-sand-400 hover:text-white hover:bg-najdi-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-sand-400">
              {language === 'ar'
                ? 'أدخل بريدك الإلكتروني وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.'
                : 'Enter your account email and we will send a password reset link.'}
            </p>

            {forgotFeedback && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  forgotFeedback.type === 'success'
                    ? 'bg-sand-950/50 border border-sand-700 text-sand-300'
                    : 'bg-danger-950/50 border border-danger-800 text-danger-300'
                }`}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{forgotFeedback.message}</span>
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <div>
                <input
                  type="email"
                  required
                  placeholder="owner@alabdullatif.sa"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-najdi-800 bg-najdi-950 text-sm text-cream-50 placeholder-sand-600 focus:ring-2 focus:ring-brand-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-sand-400 hover:text-white transition-colors"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="px-4 py-2 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isForgotLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  <span>{language === 'ar' ? 'إرسال الرابط' : 'Send Reset Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
