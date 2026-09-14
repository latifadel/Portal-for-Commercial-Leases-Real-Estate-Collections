import React, { useState } from 'react';
import { Mail, Send, Copy, Check, ExternalLink, AlertCircle, Sparkles } from 'lucide-react';
import { Modal } from './Modal';
import { useLanguage } from '../../context/LanguageContext';
import { useData } from '../../context/DataContext';
import { openNativeMailClient, sendDirectEmailViaResend } from '../../services/emailService';

interface EmailNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTo?: string;
  defaultSubject: string;
  defaultBody: string;
  title?: string;
}

export const EmailNoticeModal: React.FC<EmailNoticeModalProps> = ({
  isOpen,
  onClose,
  defaultTo = '',
  defaultSubject,
  defaultBody,
  title,
}) => {
  const { language } = useLanguage();
  const { settings } = useData();

  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(defaultBody);
  const [isSending, setIsSending] = useState(false);
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Sync state when opened
  React.useEffect(() => {
    if (isOpen) {
      setTo(defaultTo);
      setSubject(defaultSubject);
      setBody(defaultBody);
      setFeedback(null);
      setCopied(false);
    }
  }, [isOpen, defaultTo, defaultSubject, defaultBody]);

  const handleOpenNative = () => {
    openNativeMailClient({ to, subject, body });
  };

  const handleSendCloud = async () => {
    if (!to) {
      setFeedback({ type: 'error', message: language === 'ar' ? 'يرجى إدخال البريد الإلكتروني للمستلم' : 'Please enter recipient email' });
      return;
    }
    setIsSending(true);
    setFeedback(null);
    const res = await sendDirectEmailViaResend({ to, subject, body }, settings);
    setIsSending(false);
    if (res.success) {
      setFeedback({ type: 'success', message: language === 'ar' ? 'تم إرسال البريد الإلكتروني بنجاح!' : res.message });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`${subject}\n\n${body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title || (language === 'ar' ? 'إرسال إشعار بريد إلكتروني' : 'Send Email Notification')}
      maxWidth="2xl"
    >
      <div className="space-y-4">
        {feedback && (
          <div
            className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-sand-500/10 border border-sand-500/20 text-najdi-800 dark:text-sand-300'
                : 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400'
            }`}
          >
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{feedback.message}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'البريد الإلكتروني للمستلم' : 'Recipient Email'}
          </label>
          <div className="relative">
            <Mail className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="email"
              placeholder="tenant@example.com"
              value={to}
              onChange={e => setTo(e.target.value)}
              className="w-full ps-9 pe-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'عنوان الرسالة (الموضوع)' : 'Subject'}
          </label>
          <input
            type="text"
            value={subject}
            onChange={e => setSubject(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            {language === 'ar' ? 'نص الإشعار' : 'Message Body'}
          </label>
          <textarea
            rows={8}
            value={body}
            onChange={e => setBody(e.target.value)}
            className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 focus:outline-none whitespace-pre-wrap leading-relaxed"
          />
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-sand-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? (language === 'ar' ? 'تم النسخ!' : 'Copied!') : (language === 'ar' ? 'نسخ النص (واتساب/رسائل)' : 'Copy Text (WhatsApp)')}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenNative}
              className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>{language === 'ar' ? 'فتح في تطبيق البريد (آيفون/كمبيوتر)' : 'Open in Mail App'}</span>
            </button>

            {settings.resendApiKey && (
              <button
                type="button"
                disabled={isSending}
                onClick={handleSendCloud}
                className="px-4 py-2 rounded-xl bg-sand-500 hover:bg-sand-600 text-najdi-900 text-xs font-bold flex items-center gap-1.5 shadow-md shadow-sand-500/20 transition-all disabled:opacity-50"
              >
                {isSending ? (
                  <Sparkles className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
                <span>{language === 'ar' ? 'إرسال سحابي مباشر' : 'Send via Cloud'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};
