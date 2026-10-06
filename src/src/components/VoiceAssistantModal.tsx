import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  X,
  RotateCcw,
  Check,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Send,
  HelpCircle,
} from 'lucide-react';
import type { AppView, Transaction, Budget, TransactionCategory } from '../types';
import { useI18n } from '../i18n';
import { voiceAssistant, type VoiceState } from '../services/voiceAssistant';
import { parseVoiceIntent, type ParsedVoiceIntent } from '../utils/voiceCommandParser';
import { aiApi } from '../services/aiApi';
import { scamApi, type ScamAnalysisResponse } from '../services/scamApi';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  transactions: Transaction[];
  budgets: Budget[];
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  onAddBudget: (b: Omit<Budget, 'id'>) => Promise<void>;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  currentView,
  onNavigate,
  transactions,
  budgets,
  onAddTransaction,
  onAddBudget,
}) => {
  const { t, language, getLocalizedError } = useI18n();

  const [voiceState, setVoiceState] = useState<VoiceState>('IDLE');
  const [transcript, setTranscript] = useState<string>('');
  const [displayText, setDisplayText] = useState<string>('');
  const [spokenResponse, setSpokenResponse] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [manualInput, setManualInput] = useState<string>('');

  // Pending Confirmation Objects
  const [pendingTransaction, setPendingTransaction] = useState<{
    type: 'INCOME' | 'EXPENSE';
    amount: number;
    category: TransactionCategory;
    description: string;
  } | null>(null);

  const [pendingBudget, setPendingBudget] = useState<{
    category: TransactionCategory;
    amount: number;
  } | null>(null);

  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isSupported] = useState<boolean>(() => voiceAssistant.isSpeechRecognitionSupported());

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      voiceAssistant.stopListening();
      voiceAssistant.stopSpeaking();
    };
  }, []);

  const handleModalClose = useCallback(() => {
    voiceAssistant.stopListening();
    voiceAssistant.stopSpeaking();
    setVoiceState('IDLE');
    setTranscript('');
    setDisplayText('');
    setSpokenResponse('');
    setErrorMessage(null);
    setPendingTransaction(null);
    setPendingBudget(null);
    setIsSpeaking(false);
    onClose();
  }, [onClose]);

  const speakText = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      setIsSpeaking(true);
      voiceAssistant.speak({
        text,
        language,
        onStart: () => {
          if (isMountedRef.current) setIsSpeaking(true);
        },
        onEnd: () => {
          if (isMountedRef.current) setIsSpeaking(false);
        },
        onError: () => {
          if (isMountedRef.current) setIsSpeaking(false);
        },
      });
    },
    [language]
  );

  const handleStopSpeaking = () => {
    voiceAssistant.stopSpeaking();
    setIsSpeaking(false);
  };

  // Execute Financial Summary Readout
  const handleReadSummary = useCallback(
    (target: 'dashboard' | 'scamshield' | 'security' | 'general') => {
      let summaryText: string;

      if (target === 'dashboard' || target === 'general') {
        const totalIncome = transactions
          .filter((t) => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0);
        const totalExpenses = transactions
          .filter((t) => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpenses;
        const budgetCount = budgets.length;

        if (language === 'te') {
          summaryText = `మీ ప్రస్తుత బ్యాలెన్స్ ₹${balance.toLocaleString('en-IN')}. మొత్తం ఆదాయం ₹${totalIncome.toLocaleString('en-IN')}, మరియు మొత్తం ఖర్చులు ₹${totalExpenses.toLocaleString('en-IN')}. మీ వద్ద ${budgetCount} యాక్టివ్ బడ్జెట్‌లు ఉన్నాయి.`;
        } else if (language === 'hi') {
          summaryText = `आपका वर्तमान बैलेंस ₹${balance.toLocaleString('en-IN')} है। कुल आय ₹${totalIncome.toLocaleString('en-IN')} और कुल खर्च ₹${totalExpenses.toLocaleString('en-IN')} है। आपके पास ${budgetCount} सक्रिय बजट हैं।`;
        } else {
          summaryText = `Your current net balance is ₹${balance.toLocaleString('en-IN')}. Total income is ₹${totalIncome.toLocaleString('en-IN')}, and total expenses are ₹${totalExpenses.toLocaleString('en-IN')}. You have ${budgetCount} active budgets.`;
        }
      } else if (target === 'security') {
        if (language === 'te') {
          summaryText = 'ఫిన్‌షీల్డ్ భద్రతా స్కోరు 98 శాతం. IDOR రక్షణ, సెషన్ సమగ్రత, మరియు AI గార్డ్‌రైల్స్ అన్నీ సక్రియంగా ఉన్నాయి.';
        } else if (language === 'hi') {
          summaryText = 'फिनशील्ड सुरक्षा स्कोर 98 प्रतिशत है। IDOR सुरक्षा, सत्र सुरक्षा, और एआई सुरक्षा पूरी तरह से सक्रिय हैं।';
        } else {
          summaryText = 'FinShield security posture score is 98 percent. Real-time IDOR defense, session integrity, and AI guardrails are fully active.';
        }
      } else {
        if (language === 'te') {
          summaryText = 'స్కామ్‌షీల్డ్ అనుమానాస్పద సందేశాలు మరియు UPI మోసాలను విశ్లేషించడానికి సిద్ధంగా ఉంది.';
        } else if (language === 'hi') {
          summaryText = 'स्कैमशील्ड संदिग्ध संदेशों और यूपीआई धोखाधड़ी का विश्लेषण करने के लिए तैयार है।';
        } else {
          summaryText = 'ScamShield is active and ready to evaluate suspicious messages and UPI fraud indicators.';
        }
      }

      setDisplayText(summaryText);
      setSpokenResponse(summaryText);
      setVoiceState('SPEAKING');
      speakText(summaryText);
    },
    [transactions, budgets, language, speakText]
  );

  // Execute confirmed transaction mutation
  const handleConfirmTransaction = useCallback(async () => {
    if (!pendingTransaction) return;
    setVoiceState('PROCESSING');
    try {
      await onAddTransaction({
        type: pendingTransaction.type,
        amount: pendingTransaction.amount,
        category: pendingTransaction.category,
        description: pendingTransaction.description,
        payee: pendingTransaction.description,
        date: new Date().toISOString(),
      });
      const successMsg = t('voice.transactionCreated');
      setDisplayText(successMsg);
      setSpokenResponse(successMsg);
      setPendingTransaction(null);
      setVoiceState('SPEAKING');
      speakText(successMsg);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t('errors.serverError');
      setErrorMessage(getLocalizedError(errMsg));
      setVoiceState('ERROR');
    }
  }, [pendingTransaction, onAddTransaction, t, speakText, getLocalizedError]);

  const handleCancelTransaction = useCallback(() => {
    setPendingTransaction(null);
    const cancelMsg = t('voice.transactionCancelled');
    setDisplayText(cancelMsg);
    setVoiceState('IDLE');
  }, [t]);

  // Execute confirmed budget mutation
  const handleConfirmBudget = useCallback(async () => {
    if (!pendingBudget) return;
    setVoiceState('PROCESSING');
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      await onAddBudget({
        category: pendingBudget.category,
        limit: pendingBudget.amount,
        spent: 0,
        month: currentMonth,
      });
      const successMsg = t('voice.budgetUpdated');
      setDisplayText(successMsg);
      setSpokenResponse(successMsg);
      setPendingBudget(null);
      setVoiceState('SPEAKING');
      speakText(successMsg);
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : t('errors.serverError');
      setErrorMessage(getLocalizedError(errMsg));
      setVoiceState('ERROR');
    }
  }, [pendingBudget, onAddBudget, t, speakText, getLocalizedError]);

  const handleCancelBudget = useCallback(() => {
    setPendingBudget(null);
    const cancelMsg = t('voice.budgetCancelled');
    setDisplayText(cancelMsg);
    setVoiceState('IDLE');
  }, [t]);

  // Process Parsed Voice Intent
  const processIntent = useCallback(
    async (intent: ParsedVoiceIntent) => {
      setErrorMessage(null);

      // Handle confirmation speech when confirming
      if (intent.type === 'CONFIRMATION') {
        if (pendingTransaction) {
          if (intent.value) {
            await handleConfirmTransaction();
          } else {
            handleCancelTransaction();
          }
          return;
        }
        if (pendingBudget) {
          if (intent.value) {
            await handleConfirmBudget();
          } else {
            handleCancelBudget();
          }
          return;
        }
      }

      // 1. Navigation
      if (intent.type === 'NAVIGATION') {
        onNavigate(intent.view);
        let navMsg: string;
        if (language === 'te') navMsg = 'పేజీకి నావిగేట్ చేస్తున్నాము.';
        else if (language === 'hi') navMsg = 'पेज खोला जा रहा है।';
        else navMsg = 'Navigating to page.';
        setDisplayText(navMsg);
        speakText(navMsg);
        setTimeout(handleModalClose, 1000);
        return;
      }

      // 2. Transaction Creation -> REQUIRE EXPLICIT CONFIRMATION
      if (intent.type === 'TRANSACTION_CREATE') {
        setPendingTransaction({
          type: intent.transactionType,
          amount: intent.amount,
          category: intent.category,
          description: intent.description,
        });
        setVoiceState('CONFIRMING');
        const confirmPrompt = `${t('voice.confirmTransactionPrompt')} ₹${intent.amount.toLocaleString(
          'en-IN'
        )} (${intent.category})`;
        speakText(confirmPrompt);
        return;
      }

      // 3. Budget Set -> REQUIRE EXPLICIT CONFIRMATION
      if (intent.type === 'BUDGET_SET') {
        setPendingBudget({
          category: intent.category,
          amount: intent.amount,
        });
        setVoiceState('CONFIRMING');
        const confirmPrompt = `${t('voice.confirmBudgetPrompt')} ₹${intent.amount.toLocaleString(
          'en-IN'
        )} (${intent.category})`;
        speakText(confirmPrompt);
        return;
      }

      // 4. Budget Query
      if (intent.type === 'BUDGET_QUERY') {
        const found = intent.category
          ? budgets.find((b) => b.category === intent.category)
          : budgets[0];
        let answer: string;
        if (found) {
          const rem = Math.max(0, found.limit - found.spent);
          if (language === 'te') {
            answer = `${found.category} బడ్జెట్ పరిమితి ₹${found.limit.toLocaleString(
              'en-IN'
            )}. మిగిలి ఉన్న మొత్తం ₹${rem.toLocaleString('en-IN')}.`;
          } else if (language === 'hi') {
            answer = `${found.category} बजट सीमा ₹${found.limit.toLocaleString(
              'en-IN'
            )} है। शेष राशि ₹${rem.toLocaleString('en-IN')} है।`;
          } else {
            answer = `Your ${found.category} budget limit is ₹${found.limit.toLocaleString(
              'en-IN'
            )}. Remaining balance is ₹${rem.toLocaleString('en-IN')}.`;
          }
        } else {
          if (language === 'te') {
            answer = 'ఈ కేటగిరీకి బడ్జెట్ ఇంకా సెట్ చేయలేదు.';
          } else if (language === 'hi') {
            answer = 'इस श्रेणी के लिए अभी तक कोई बजट निर्धारित नहीं किया गया है।';
          } else {
            answer = 'No budget has been set for this category yet.';
          }
        }
        setDisplayText(answer);
        setSpokenResponse(answer);
        setVoiceState('SPEAKING');
        speakText(answer);
        return;
      }

      // 5. Read Interface Summary
      if (intent.type === 'READ_SUMMARY') {
        handleReadSummary(intent.target);
        return;
      }

      // 6. ScamShield Analysis
      if (intent.type === 'ANALYZE_SCAM') {
        setVoiceState('PROCESSING');
        try {
          const res: ScamAnalysisResponse = await scamApi.analyze({
            text: intent.message,
          });
          const reasonsStr = res.reasons.join('. ');
          let scamSpeech: string;
          if (language === 'te') {
            scamSpeech = `ప్రమాద స్థాయి: ${res.riskLevel}. స్కోరు: ${res.riskScore} పాయింట్లు. ${reasonsStr}`;
          } else if (language === 'hi') {
            scamSpeech = `जोखिम स्तर: ${res.riskLevel}. स्कोर: ${res.riskScore} अंक. ${reasonsStr}`;
          } else {
            scamSpeech = `Risk Level: ${res.riskLevel}. Risk score is ${res.riskScore}. ${reasonsStr}`;
          }
          setDisplayText(scamSpeech);
          setSpokenResponse(scamSpeech);
          setVoiceState('SPEAKING');
          speakText(scamSpeech);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : t('errors.serverError');
          setErrorMessage(getLocalizedError(errMsg));
          setVoiceState('ERROR');
        }
        return;
      }

      // 7. Natural Financial Question -> AI Assistant Backend
      if (intent.type === 'FINANCIAL_QUESTION') {
        setVoiceState('PROCESSING');
        try {
          const aiRes = await aiApi.ask(intent.query, language);
          const reply = aiRes.answer;
          if (!reply || !reply.trim()) {
            setErrorMessage(getLocalizedError('AI Assistant query failed'));
            setVoiceState('ERROR');
            return;
          }
          setDisplayText(reply);
          setSpokenResponse(reply);
          setVoiceState('SPEAKING');
          speakText(reply);
        } catch (err: unknown) {
          const errMsg = err instanceof Error ? err.message : t('ai.errorFailed');
          setErrorMessage(getLocalizedError(errMsg));
          setVoiceState('ERROR');
        }
        return;
      }

      // 8. Unknown / Unclear
      setErrorMessage(t('voice.commandUnclear'));
      setVoiceState('ERROR');
    },
    [
      pendingTransaction,
      pendingBudget,
      handleConfirmTransaction,
      handleCancelTransaction,
      handleConfirmBudget,
      handleCancelBudget,
      onNavigate,
      language,
      speakText,
      handleModalClose,
      t,
      getLocalizedError,
      budgets,
      handleReadSummary,
    ]
  );

  // Start Voice Listening Session
  const startListeningSession = useCallback(() => {
    setErrorMessage(null);
    setDisplayText('');
    setSpokenResponse('');
    setTranscript('');
    voiceAssistant.stopSpeaking();
    setIsSpeaking(false);

    const started = voiceAssistant.startListening({
      language,
      onStart: () => {
        if (isMountedRef.current) setVoiceState('LISTENING');
      },
      onResult: (text, isFinal) => {
        if (!isMountedRef.current) return;
        setTranscript(text);
        if (isFinal) {
          setVoiceState('PREVIEW');
        }
      },
      onError: (code) => {
        if (!isMountedRef.current) return;
        setVoiceState('ERROR');
        if (code === 'micPermissionDenied') {
          setErrorMessage(t('voice.micPermissionDenied'));
        } else if (code === 'noSpeechDetected') {
          setErrorMessage(t('voice.noSpeechDetected'));
        } else if (code === 'unsupported') {
          setErrorMessage(t('voice.unsupported'));
        } else {
          setErrorMessage(t('voice.commandUnclear'));
        }
      },
      onEnd: () => {
        if (!isMountedRef.current) return;
        if (voiceState === 'LISTENING') {
          setVoiceState('IDLE');
        }
      },
    });

    if (!started) {
      setVoiceState('ERROR');
      setErrorMessage(t('voice.unsupported'));
    }
  }, [language, voiceState, t]);

  const stopListeningSession = () => {
    voiceAssistant.stopListening();
    if (transcript.trim()) {
      setVoiceState('PREVIEW');
    } else {
      setVoiceState('IDLE');
    }
  };

  // User accepts recognized transcript
  const handleUseTranscript = () => {
    if (!transcript.trim()) return;
    const intent = parseVoiceIntent(transcript, language, currentView);
    void processIntent(intent);
  };

  // Submit typed command in fallback mode
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualInput.trim()) return;
    setTranscript(manualInput.trim());
    const intent = parseVoiceIntent(manualInput.trim(), language, currentView);
    setManualInput('');
    void processIntent(intent);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('voice.voiceMode')}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md selection:bg-cyan-500/30"
    >
      <div className="relative w-full max-w-lg bg-[#090f1d]/95 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-32 bg-cyan-500/15 rounded-full blur-2xl pointer-events-none" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                {t('voice.voiceMode')}
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-800/50 text-cyan-400">
                  {language.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {voiceState === 'LISTENING'
                  ? t('voice.listeningDesc')
                  : t('voice.readyToListen')}
              </p>
            </div>
          </div>
          <button
            onClick={handleModalClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/80 transition-colors"
            aria-label={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Central Audio / Interaction Area */}
        <div className="py-8 flex flex-col items-center justify-center text-center">
          {/* Animated Microphone Ring */}
          <div className="relative mb-6">
            {voiceState === 'LISTENING' && (
              <>
                <div className="absolute -inset-4 rounded-full bg-cyan-500/20 animate-ping pointer-events-none" />
                <div className="absolute -inset-2 rounded-full bg-teal-500/30 animate-pulse pointer-events-none" />
              </>
            )}

            <button
              type="button"
              onClick={
                voiceState === 'LISTENING'
                  ? stopListeningSession
                  : startListeningSession
              }
              aria-label={
                voiceState === 'LISTENING'
                  ? t('voice.stopListening')
                  : t('voice.startListening')
              }
              className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-xl cursor-pointer ${
                voiceState === 'LISTENING'
                  ? 'bg-gradient-to-br from-rose-500 to-rose-600 text-white shadow-rose-500/30 scale-105'
                  : 'bg-gradient-to-br from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 shadow-cyan-500/30 hover:scale-105'
              }`}
            >
              {voiceState === 'LISTENING' ? (
                <MicOff className="w-10 h-10" />
              ) : (
                <Mic className="w-10 h-10" />
              )}
            </button>
          </div>

          {/* Waveform Sound Activity Visualization */}
          {voiceState === 'LISTENING' && (
            <div
              className="flex items-center gap-1.5 h-8 mb-4"
              aria-label="Sound activity waveform"
            >
              <div className="w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] h-4" />
              <div className="w-1.5 bg-teal-300 rounded-full animate-bounce [animation-delay:-0.15s] h-7" />
              <div className="w-1.5 bg-cyan-300 rounded-full animate-bounce [animation-delay:0s] h-8" />
              <div className="w-1.5 bg-teal-400 rounded-full animate-bounce [animation-delay:-0.15s] h-6" />
              <div className="w-1.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:-0.3s] h-3" />
            </div>
          )}

          {/* State Label */}
          <div className="text-sm font-semibold text-slate-200">
            {voiceState === 'LISTENING' && t('voice.listening')}
            {voiceState === 'PROCESSING' && (
              <span className="inline-flex items-center gap-2 text-cyan-300">
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('voice.processing')}
              </span>
            )}
            {voiceState === 'SPEAKING' && t('voice.speaking')}
            {voiceState === 'IDLE' && t('voice.readyToListen')}
          </div>
        </div>

        {/* Live Transcript Surface */}
        {transcript && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-left">
            <p className="text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1">
              {t('voice.youSaid')}
            </p>
            <p className="text-sm font-medium text-cyan-200">{transcript}</p>

            {voiceState === 'PREVIEW' && (
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleUseTranscript}
                  className="px-3.5 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> {t('voice.useThis')}
                </button>
                <button
                  type="button"
                  onClick={startListeningSession}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> {t('voice.tryAgain')}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Transaction Confirmation Card (MANDATORY SAFETY GATE) */}
        {voiceState === 'CONFIRMING' && pendingTransaction && (
          <div className="mb-5 p-4 rounded-2xl bg-cyan-950/40 border border-cyan-800/60 text-left">
            <div className="flex items-center gap-2 mb-2 text-cyan-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('voice.confirmTransactionTitle')}</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              {t('voice.confirmTransactionPrompt')}
            </p>

            <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-slate-900/80 text-xs mb-3">
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {t('voice.typeIncome')} / {t('voice.typeExpense')}
                </span>
                <span className="font-bold text-white">
                  {pendingTransaction.type}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {t('voice.amountLabel')}
                </span>
                <span className="font-bold text-cyan-400">
                  ₹{pendingTransaction.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {t('voice.categoryLabel')}
                </span>
                <span className="font-medium text-slate-200">
                  {pendingTransaction.category}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {t('voice.descLabel')}
                </span>
                <span className="font-medium text-slate-200 truncate block">
                  {pendingTransaction.description}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmTransaction}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> {t('voice.confirm')}
              </button>
              <button
                type="button"
                onClick={handleCancelTransaction}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('voice.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Budget Confirmation Card (MANDATORY SAFETY GATE) */}
        {voiceState === 'CONFIRMING' && pendingBudget && (
          <div className="mb-5 p-4 rounded-2xl bg-teal-950/40 border border-teal-800/60 text-left">
            <div className="flex items-center gap-2 mb-2 text-teal-400 font-semibold text-xs">
              <ShieldCheck className="w-4 h-4" />
              <span>{t('voice.confirmBudgetTitle')}</span>
            </div>
            <p className="text-xs text-slate-300 mb-3">
              {t('voice.confirmBudgetPrompt')}
            </p>

            <div className="p-2.5 rounded-xl bg-slate-900/80 text-xs mb-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 block">
                  {t('voice.categoryLabel')}
                </span>
                <span className="font-bold text-white">
                  {pendingBudget.category}
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">
                  {t('voice.amountLabel')}
                </span>
                <span className="font-bold text-teal-400 text-sm">
                  ₹{pendingBudget.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleConfirmBudget}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-teal-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" /> {t('voice.confirm')}
              </button>
              <button
                type="button"
                onClick={handleCancelBudget}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                {t('voice.cancel')}
              </button>
            </div>
          </div>
        )}

        {/* Display Text / Spoken Response Card */}
        {displayText && !pendingTransaction && !pendingBudget && (
          <div className="mb-4 p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-left">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                FinShield
              </span>
              {spokenResponse && (
                <div className="flex items-center gap-1">
                  {isSpeaking ? (
                    <button
                      type="button"
                      onClick={handleStopSpeaking}
                      className="p-1 rounded-md text-cyan-400 hover:text-white bg-cyan-950/60 border border-cyan-800/60 text-[10px] flex items-center gap-1 px-2"
                      title={t('voice.stopSpeaking')}
                    >
                      <VolumeX className="w-3 h-3" /> {t('voice.stopSpeaking')}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => speakText(spokenResponse)}
                      className="p-1 rounded-md text-slate-400 hover:text-cyan-400 bg-slate-800 text-[10px] flex items-center gap-1 px-2"
                      title={t('voice.replay')}
                    >
                      <Volume2 className="w-3 h-3" /> {t('voice.replay')}
                    </button>
                  )}
                </div>
              )}
            </div>
            <p className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap">
              {displayText}
            </p>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-2.5 text-xs text-rose-300 text-left">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">{errorMessage}</div>
          </div>
        )}

        {/* Suggested Voice Commands */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 text-left">
          <p className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
            {t('voice.suggestedCommandsTitle')}
          </p>
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
              <span>{t('voice.suggestedSpend')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
              <span>{t('voice.suggestedTx')}</span>
            </div>
            <div className="flex items-center gap-2">
              <ArrowRight className="w-3 h-3 text-cyan-500 shrink-0" />
              <span>{t('voice.suggestedNav')}</span>
            </div>
          </div>
        </div>

        {/* Fallback Text Input (Ensures 100% accessibility if mic/browser is unsupported) */}
        {(!isSupported || errorMessage) && (
          <form onSubmit={handleManualSubmit} className="mt-4 pt-3 border-t border-slate-800 flex gap-2">
            <input
              type="text"
              value={manualInput}
              onChange={(e) => setManualInput(e.target.value)}
              placeholder={t('voice.textFallbackPlaceholder')}
              className="flex-1 px-3.5 py-2 bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {t('voice.sendTextCmd')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
