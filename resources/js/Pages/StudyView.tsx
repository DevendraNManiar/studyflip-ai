import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
    BookOpen, 
    FileText, 
    Layers, 
    MessageSquare, 
    Check, 
    HelpCircle,
    ArrowLeft, 
    ArrowRight, 
    RefreshCw, 
    Send,
    Bot,
    User,
    Sparkles,
    CheckCircle2,
    XCircle,
    ChevronLeft,
    Trash2,
    Headphones,
    Play,
    Pause,
    Download,
    Volume2,
    Square,
    Users,
    Workflow,
    Info,
    Smile,
    Link as LinkIcon,
    Share2
} from 'lucide-react';

interface Category {
    id: number;
    name: string;
}

interface Flashcard {
    id: number;
    question: string;
    answer: string;
    repetitions?: number;
    interval?: number;
    easiness_factor?: number;
    next_review_date?: string | null;
}

interface Quiz {
    id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: string;
    difficulty: 'easy' | 'medium' | 'hard';
}

interface QuizResult {
    id: number;
    score: number;
    total_questions: number;
    correct_answers: number;
    created_at: string;
}

interface PdfUpload {
    id: number;
    file_name: string;
    summary: string;
    extracted_text: string;
    chat_history: { role: 'user' | 'tutor', content: string, timestamp?: string }[];
    podcast_script?: { speaker: string, text: string }[];
    category: Category;
    flashcards: Flashcard[];
    quizzes: Quiz[];
    quiz_results: QuizResult[];
}

interface StudyViewProps {
    upload: PdfUpload;
}

// Light weight custom Markdown renderer to avoid npm conflicts
function MarkdownRenderer({ content }: { content: string }) {
    if (!content) return <p className="text-slate-400 italic">No summary generated.</p>;

    const lines = content.split('\n');
    return (
        <div className="space-y-4 text-slate-300 leading-relaxed text-sm">
            {lines.map((line, idx) => {
                const trimmed = line.trim();
                
                // Headers
                if (trimmed.startsWith('# ')) {
                    return <h1 key={idx} className="text-2xl font-extrabold text-slate-100 border-b border-slate-800 pb-2 mt-6 mb-4">{trimmed.replace('# ', '')}</h1>;
                }
                if (trimmed.startsWith('## ')) {
                    return <h2 key={idx} className="text-xl font-bold text-indigo-300 mt-5 mb-3">{trimmed.replace('## ', '')}</h2>;
                }
                if (trimmed.startsWith('### ')) {
                    return <h3 key={idx} className="text-lg font-semibold text-violet-300 mt-4 mb-2">{trimmed.replace('### ', '')}</h3>;
                }
                
                // Blockquotes
                if (trimmed.startsWith('> ')) {
                    return (
                        <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-950/20 px-4 py-3 rounded-r-xl italic my-4 text-slate-300">
                            {trimmed.replace('> ', '')}
                        </blockquote>
                    );
                }

                // Bullets
                if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
                    const cleanText = trimmed.replace(/^[-*]\s+/, '');
                    // Bold inline formatting
                    const parts = cleanText.split('**');
                    return (
                        <li key={idx} className="list-disc list-inside ml-4 text-slate-300">
                            {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-indigo-200">{p}</strong> : p)}
                        </li>
                    );
                }

                // Numbered list
                if (/^\d+\.\s+/.test(trimmed)) {
                    const cleanText = trimmed.replace(/^\d+\.\s+/, '');
                    const parts = cleanText.split('**');
                    return (
                        <div key={idx} className="flex gap-2 ml-2">
                            <span className="text-indigo-400 font-bold">{trimmed.match(/^\d+/)?.[0]}.</span>
                            <p>{parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-indigo-200">{p}</strong> : p)}</p>
                        </div>
                    );
                }

                if (trimmed === '') return <div key={idx} className="h-2" />;

                // Standard paragraph with inline bolding support
                const parts = line.split('**');
                return (
                    <p key={idx}>
                        {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-indigo-200">{p}</strong> : p)}
                    </p>
                );
            })}
        </div>
    );
}

interface TutorAvatarProps {
    state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

function TutorAvatar({ state }: TutorAvatarProps) {
    return (
        <div className="flex flex-col items-center justify-center space-y-4 p-6">
            <div className="relative w-40 h-40 flex items-center justify-center">
                {/* Orbiting background rings */}
                <div className="absolute inset-0 rounded-full border border-indigo-500/10 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-violet-500/10 animate-[spin_10s_linear_infinite_reverse]" />
                
                {/* Glowing Aura */}
                <div className={`absolute inset-6 rounded-full blur-xl transition-all duration-1000 ${
                    state === 'listening' ? 'bg-emerald-500/20' :
                    state === 'thinking' ? 'bg-amber-500/20' :
                    state === 'speaking' ? 'bg-indigo-500/20' : 'bg-indigo-600/10'
                }`} />

                {/* Animated Inner Core */}
                <div className={`w-24 h-24 rounded-full border flex items-center justify-center transition-all duration-500 ${
                    state === 'listening' ? 'bg-emerald-950/40 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105' :
                    state === 'thinking' ? 'bg-amber-950/40 border-amber-500/40 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-pulse' :
                    state === 'speaking' ? 'bg-indigo-950/40 border-indigo-500/40 shadow-[0_0_20px_rgba(99,102,241,0.3)] scale-95' :
                    'bg-[#0f121d] border-indigo-500/20 shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                }`}>
                    {state === 'idle' && (
                        <div className="w-12 h-12 rounded-full border-2 border-indigo-500/30 animate-ping [animation-duration:3s]" />
                    )}

                    {state === 'listening' && (
                        <div className="flex items-center justify-center gap-1.5">
                            <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce" />
                            <span className="w-1.5 h-10 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                            <span className="w-1.5 h-6 bg-emerald-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                        </div>
                    )}

                    {state === 'thinking' && (
                        <div className="w-10 h-10 relative animate-spin">
                            <div className="absolute inset-0 rounded-full border-2 border-amber-500 border-t-transparent" />
                        </div>
                    )}

                    {state === 'speaking' && (
                        <div className="flex items-end justify-center gap-1 h-8">
                            <span className="w-1.5 h-3 bg-indigo-400 rounded-full animate-[pulse_0.4s_infinite_alternate]" />
                            <span className="w-1.5 h-7 bg-indigo-400 rounded-full animate-[pulse_0.6s_infinite_alternate_0.15s]" />
                            <span className="w-1.5 h-5 bg-indigo-400 rounded-full animate-[pulse_0.5s_infinite_alternate_0.3s]" />
                            <span className="w-1.5 h-6 bg-indigo-400 rounded-full animate-[pulse_0.7s_infinite_alternate_0.2s]" />
                        </div>
                    )}
                </div>
            </div>

            {/* Label Status */}
            <div className="text-center">
                <p className={`text-[10px] font-bold uppercase tracking-widest ${
                    state === 'listening' ? 'text-emerald-400' :
                    state === 'thinking' ? 'text-amber-400' :
                    state === 'speaking' ? 'text-indigo-400' : 'text-slate-400'
                }`}>
                    {state === 'listening' ? 'Tutor Listening' :
                     state === 'thinking' ? 'Tutor Thinking' :
                     state === 'speaking' ? 'Tutor Speaking' : 'Tutor Core'}
                </p>
                <p className="text-[9px] text-slate-500 mt-0.5">
                    {state === 'listening' ? 'Speak clearly now' :
                     state === 'thinking' ? 'Analyzing query' :
                     state === 'speaking' ? 'Reading aloud' : 'Voice Mode Inactive'}
                </p>
            </div>
        </div>
    );
}

export default function StudyView({ upload }: StudyViewProps) {
    const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'quiz' | 'tutor' | 'podcast' | 'concept-graph' | 'study-room'>('summary');

    // Spaced repetition flashcards local state
    const [flashcards, setFlashcards] = useState<Flashcard[]>(upload.flashcards);

    // Concept Graph State
    const [conceptGraph, setConceptGraph] = useState<{ nodes: any[], edges: any[] } | null>(null);
    const [isLoadingGraph, setIsLoadingGraph] = useState(false);
    const [selectedNode, setSelectedNode] = useState<any>(null);

    // Study Room State
    const [roomState, setRoomState] = useState<{ users: Record<string, any>, history: any[] }>({ users: {}, history: [] });
    const [copied, setCopied] = useState(false);

    const joinUrl = typeof window !== 'undefined' ? window.location.origin + '/study/' + upload.id : '';
    const whatsappUrl = `https://api.whatsapp.com/send?text=Join%20my%20real-time%20StudyFlip%20session%20for%20` + encodeURIComponent(upload.file_name) + `%20here:%20` + encodeURIComponent(joinUrl);

    const handleCopyLink = () => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(joinUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    // Podcast State
    const [podcastScript, setPodcastScript] = useState<{ speaker: string, text: string }[]>(upload.podcast_script || []);
    const [isGeneratingPodcast, setIsGeneratingPodcast] = useState(false);
    const [isPlayingPodcast, setIsPlayingPodcast] = useState(false);
    const [currentDialogueIndex, setCurrentDialogueIndex] = useState<number | null>(null);
    const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [speakerAVoice, setSpeakerAVoice] = useState<string>('');
    const [speakerBVoice, setSpeakerBVoice] = useState<string>('');
    const [selectedLanguage, setSelectedLanguage] = useState<string>('English');

    const languageCodes: Record<string, string> = {
        'English': 'en',
        'Spanish': 'es',
        'German': 'de',
        'French': 'fr',
        'Hindi': 'hi',
        'Chinese': 'zh',
        'Japanese': 'ja',
    };
    
    // Flashcard State
    const [cardIndex, setCardIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);

    // Quiz State
    const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);
    const [quizScore, setQuizScore] = useState<number | null>(null);
    const [savedResult, setSavedResult] = useState<QuizResult | null>(
        upload.quiz_results.length > 0 ? upload.quiz_results[0] : null
    );

    // AI Tutor State
    const [messages, setMessages] = useState(upload.chat_history || []);
    const [inputMessage, setInputMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const chatEndRef = useRef<HTMLDivElement>(null);

    // Scroll chat history to bottom
    useEffect(() => {
        if (activeTab === 'tutor') {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, activeTab]);

    // Sync active room state
    const syncRoom = async (action?: string, details?: string) => {
        try {
            const response = await axios.post(`/study/${upload.id}/room-sync`, {
                action,
                details
            });
            setRoomState(response.data);
        } catch (error) {
            console.error("Room sync failed", error);
        }
    };

    // Low latency room sync polling loop
    useEffect(() => {
        syncRoom();
        const interval = setInterval(() => {
            syncRoom();
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    // Also sync active tab changes
    useEffect(() => {
        syncRoom('switched_tab', activeTab);
        if (activeTab === 'concept-graph' && !conceptGraph) {
            fetchConceptGraph();
        }
    }, [activeTab]);

    // Fetch Concept Graph
    const fetchConceptGraph = async () => {
        setIsLoadingGraph(true);
        try {
            const response = await axios.get(`/study/${upload.id}/concept-graph`);
            setConceptGraph(response.data);
        } catch (error) {
            console.error("Failed to load concept graph", error);
        } finally {
            setIsLoadingGraph(false);
        }
    };

    // Review flashcard rating using SM-2
    const handleReviewCard = async (rating: number) => {
        const currentCard = flashcards[cardIndex];
        try {
            const response = await axios.post(`/study/${upload.id}/flashcards/${currentCard.id}/review`, {
                score: rating
            });
            const updatedCard = response.data.flashcard;
            setFlashcards(prev => prev.map(fc => fc.id === updatedCard.id ? { ...fc, ...updatedCard } : fc));
            syncRoom('reviewed_flashcard', `Card #${cardIndex + 1} rated ${rating}/5`);
            alert(`Review saved! Next review in ${updatedCard.interval} days.`);
            handleNextCard();
        } catch (error) {
            console.error("Failed to submit review", error);
        }
    };

    const isDue = (card: Flashcard) => {
        if (!card.next_review_date) return true; // never reviewed
        const reviewDate = new Date(card.next_review_date);
        const today = new Date();
        reviewDate.setHours(0,0,0,0);
        today.setHours(0,0,0,0);
        return reviewDate <= today;
    };

    // Flashcard actions
    const handleNextCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCardIndex((prev) => (prev + 1) % flashcards.length);
            syncRoom('flipped_card', `Moved to Card #${((cardIndex + 1) % flashcards.length) + 1}`);
        }, 150);
    };

    const handlePrevCard = () => {
        setIsFlipped(false);
        setTimeout(() => {
            setCardIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
            syncRoom('flipped_card', `Moved to Card #${((cardIndex - 1 + flashcards.length) % flashcards.length) + 1}`);
        }, 150);
    };

    // Quiz actions
    const handleSelectOption = (quizId: number, optionLetter: string) => {
        if (quizSubmitted) return;
        setSelectedAnswers({
            ...selectedAnswers,
            [quizId]: optionLetter
        });
        syncRoom('selected_quiz_option', `Question #${quizId}`);
    };

    const handleQuizSubmit = async () => {
        if (quizSubmitted || upload.quizzes.length === 0) return;

        let correctCount = 0;
        upload.quizzes.forEach((quiz) => {
            const answer = selectedAnswers[quiz.id];
            if (answer && answer.toLowerCase() === quiz.correct_answer.toLowerCase()) {
                correctCount++;
            }
        });

        const scoreVal = round(correctCount / upload.quizzes.length * 100);
        setQuizScore(scoreVal);
        setQuizSubmitted(true);
        syncRoom('submitted_quiz', `Score: ${scoreVal}%`);

        try {
            const response = await axios.post(`/study/${upload.id}/quiz`, {
                correct_answers: correctCount,
                total_questions: upload.quizzes.length
            });
            setSavedResult(response.data.result);
        } catch (error) {
            console.error('Failed to submit quiz results', error);
        }
    };

    const handleQuizReset = () => {
        setSelectedAnswers({});
        setQuizSubmitted(false);
        setQuizScore(null);
        syncRoom('reset_quiz', 'Started retaking the quiz');
    };

    const round = (num: number) => Math.round(num);

    // Voice Mode & AI Tutor States
    const [isVoiceMode, setIsVoiceMode] = useState(false);
    const [tutorState, setTutorState] = useState<'idle' | 'listening' | 'thinking' | 'speaking'>('idle');
    const recognitionRef = useRef<any>(null);

    // Clean up voice synthesis and recognition
    useEffect(() => {
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, []);

    // Load available voices for podcast generator
    useEffect(() => {
        const loadVoices = () => {
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                const availableVoices = window.speechSynthesis.getVoices();
                setVoices(availableVoices);
            }
        };

        loadVoices();
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }
    }, []);

    // Automatically update Speaker A and B voices when language or available voices list changes
    useEffect(() => {
        if (voices.length === 0) return;

        const langCode = languageCodes[selectedLanguage] || 'en';
        const filteredVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCode));
        const listToUse = filteredVoices.length > 0 ? filteredVoices : voices;

        const maleVoice = listToUse.find(v => 
            v.name.toLowerCase().includes('male') || 
            v.name.toLowerCase().includes('david') || 
            v.name.toLowerCase().includes('google us english') ||
            v.name.toLowerCase().includes('microsoft david') ||
            v.name.toLowerCase().includes('natural')
        ) || listToUse[0];
        
        const femaleVoice = listToUse.find(v => 
            (v.name.toLowerCase().includes('female') || 
            v.name.toLowerCase().includes('zira') || 
            v.name.toLowerCase().includes('google uk english female') ||
            v.name.toLowerCase().includes('hazel') ||
            v.name.toLowerCase().includes('natural')) && v.name !== maleVoice.name
        ) || listToUse[1] || listToUse[0];

        setSpeakerAVoice(maleVoice.name);
        setSpeakerBVoice(femaleVoice.name);
    }, [selectedLanguage, voices]);

    // Stop speaking when switching tabs
    useEffect(() => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        setIsPlayingPodcast(false);
        setCurrentDialogueIndex(null);
        setTutorState('idle');
    }, [activeTab]);

    const playDialogue = (index: number) => {
        if (typeof window === 'undefined' || !window.speechSynthesis || podcastScript.length === 0) return;
        
        window.speechSynthesis.cancel();
        
        if (index >= podcastScript.length) {
            setIsPlayingPodcast(false);
            setCurrentDialogueIndex(null);
            return;
        }

        setCurrentDialogueIndex(index);
        
        const line = podcastScript[index];
        const utterance = new SpeechSynthesisUtterance(line.text);
        
        const voiceName = line.speaker === 'Speaker A' ? speakerAVoice : speakerBVoice;
        const selectedVoice = voices.find(v => v.name === voiceName);
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }

        utterance.rate = 1.0;
        utterance.pitch = line.speaker === 'Speaker A' ? 0.95 : 1.05;

        utterance.onend = () => {
            playDialogue(index + 1);
        };

        utterance.onerror = (event) => {
            console.error("Podcast Speech Synthesis error:", event);
            setIsPlayingPodcast(false);
            setCurrentDialogueIndex(null);
        };

        window.speechSynthesis.speak(utterance);
    };

    const handlePlayPodcast = () => {
        if (isPlayingPodcast) {
            window.speechSynthesis.pause();
            setIsPlayingPodcast(false);
        } else {
            setIsPlayingPodcast(true);
            if (window.speechSynthesis.paused && currentDialogueIndex !== null) {
                window.speechSynthesis.resume();
            } else {
                const startIndex = currentDialogueIndex !== null ? currentDialogueIndex : 0;
                playDialogue(startIndex);
            }
        }
    };

    const handlePausePodcast = () => {
        window.speechSynthesis.pause();
        setIsPlayingPodcast(false);
    };

    const handleStopPodcast = () => {
        window.speechSynthesis.cancel();
        setIsPlayingPodcast(false);
        setCurrentDialogueIndex(null);
    };

    const handleGeneratePodcast = async () => {
        setIsGeneratingPodcast(true);
        try {
            const response = await axios.post(`/study/${upload.id}/podcast`, {
                language: selectedLanguage
            });
            setPodcastScript(response.data.podcast_script);
        } catch (error) {
            console.error("Failed to generate podcast script", error);
            alert("Failed to generate podcast script. Please try again.");
        } finally {
            setIsGeneratingPodcast(false);
        }
    };

    const handleDownloadScript = () => {
        if (podcastScript.length === 0) return;
        const scriptText = podcastScript.map(line => `[${line.speaker}]: ${line.text}`).join('\n\n');
        const blob = new Blob([scriptText], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${upload.file_name.replace(/\.[^/.]+$/, "")}_podcast_script.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // Monitor changes to voice mode
    useEffect(() => {
        if (isVoiceMode) {
            startListening();
        } else {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            window.speechSynthesis.cancel();
            setTutorState('idle');
        }
    }, [isVoiceMode]);

    const startListening = () => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Web Speech API is not supported in this browser. Please use Chrome, Edge, or Safari.");
            setIsVoiceMode(false);
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = false;
            recognition.lang = 'en-US';

            recognition.onstart = () => {
                setTutorState('listening');
            };

            recognition.onresult = async (event: any) => {
                const transcript = event.results[0][0].transcript;
                if (transcript.trim()) {
                    setTutorState('thinking');
                    await submitMessage(transcript);
                }
            };

            recognition.onerror = (event: any) => {
                console.error("Speech recognition error:", event.error);
                if (event.error !== 'no-speech') {
                    setTutorState('idle');
                }
            };

            recognition.onend = () => {
                setTutorState((prev) => {
                    if (prev === 'listening') return 'idle';
                    return prev;
                });
            };

            recognitionRef.current = recognition;
        }

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Failed to start speech recognition:", e);
        }
    };

    const speakText = (text: string) => {
        window.speechSynthesis.cancel();

        if (recognitionRef.current) {
            recognitionRef.current.abort();
        }

        // Clean markdown format characters
        const cleanText = text
            .replace(/[\#\*\_`\-\>\d+\.]/g, '')
            .replace(/\s+/g, ' ')
            .trim();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        
        utterance.onstart = () => {
            setTutorState('speaking');
        };

        utterance.onend = () => {
            setTutorState('idle');
            // Hands-free continuous listening
            if (isVoiceMode) {
                setTimeout(() => {
                    startListening();
                }, 500);
            }
        };

        utterance.onerror = (e) => {
            console.error("Speech synthesis error:", e);
            setTutorState('idle');
            if (isVoiceMode) {
                startListening();
            }
        };

        window.speechSynthesis.speak(utterance);
    };

    const submitMessage = async (userMsg: string) => {
        setIsSending(true);

        const newMsgExchange = [
            ...messages,
            { role: 'user' as const, content: userMsg }
        ];
        setMessages(newMsgExchange);

        try {
            const response = await axios.post(`/study/${upload.id}/tutor`, {
                message: userMsg
            });
            const chatHistory = response.data.chat_history;
            setMessages(chatHistory);
            
            // Speak the tutor's response aloud
            const tutorResp = chatHistory[chatHistory.length - 1]?.content;
            if (tutorResp && isVoiceMode) {
                speakText(tutorResp);
            }
        } catch (error) {
            console.error('Tutor chat failed', error);
            const errMsg = 'Error: Could not generate a response from the study tutor. Please try again.';
            setMessages([
                ...newMsgExchange,
                { role: 'tutor' as const, content: errMsg }
            ]);
            if (isVoiceMode) {
                speakText(errMsg);
            }
        } finally {
            setIsSending(false);
        }
    };

    // AI Tutor actions
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputMessage.trim() || isSending) return;

        const userMsg = inputMessage;
        setInputMessage('');
        await submitMessage(userMsg);
    };

    const handleClearChat = async () => {
        if (!confirm('Clear tutoring chat history?')) return;
        try {
            await axios.post(`/study/${upload.id}/tutor/clear`);
            setMessages([]);
            window.speechSynthesis.cancel();
            setTutorState('idle');
        } catch (error) {
            console.error('Failed to clear chat history', error);
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title={`Study: ${upload.file_name}`} />

            <div className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4 sm:px-6 lg:px-8">
                <div className="max-w-6xl mx-auto space-y-6">
                    
                    {/* Back Link & Info */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <Link 
                            href="/dashboard" 
                            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors duration-150"
                        >
                            <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <span className="text-xs bg-indigo-950/40 text-indigo-400 border border-indigo-500/25 px-3 py-1 rounded-full font-medium">
                                {upload.category?.name || 'Subject'}
                            </span>
                            <span className="text-xs text-slate-500">
                                {upload.flashcards.length} Cards • {upload.quizzes.length} Questions
                            </span>
                        </div>
                    </div>

                    {/* Document title */}
                    <div className="border-b border-slate-800 pb-4">
                        <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
                            <FileText className="w-7 h-7 text-indigo-400" /> {upload.file_name}
                        </h1>
                    </div>

                    {/* Tabs navigation */}
                    <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-xl gap-1 flex-wrap md:flex-nowrap">
                        <button
                            onClick={() => setActiveTab('summary')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'summary' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <FileText className="w-4 h-4" /> Summary
                        </button>
                        <button
                            onClick={() => setActiveTab('flashcards')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'flashcards' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Layers className="w-4 h-4" /> Flashcards
                        </button>
                        <button
                            onClick={() => setActiveTab('quiz')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'quiz' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <HelpCircle className="w-4 h-4" /> Quiz
                        </button>
                        <button
                            onClick={() => setActiveTab('tutor')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'tutor' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <MessageSquare className="w-4 h-4" /> AI Tutor
                        </button>
                        <button
                            onClick={() => setActiveTab('podcast')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'podcast' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Headphones className="w-4 h-4" /> Podcast
                        </button>
                        <button
                            onClick={() => setActiveTab('concept-graph')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'concept-graph' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Workflow className="w-4 h-4" /> Concept Map
                        </button>
                        <button
                            onClick={() => setActiveTab('study-room')}
                            className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all duration-150 ${
                                activeTab === 'study-room' 
                                    ? 'bg-slate-950 text-indigo-400 shadow-sm border border-slate-800' 
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <Users className="w-4 h-4" /> Study Room
                        </button>
                    </div>

                    {/* Tab contents */}
                    <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 min-h-[400px] backdrop-blur-sm relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/2 via-transparent to-transparent pointer-events-none" />
                        
                        {/* A: SUMMARY TAB */}
                        {activeTab === 'summary' && (
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-2">
                                    <h2 className="text-lg font-bold text-slate-200">Lecture Summary</h2>
                                    <span className="text-xs text-indigo-400 flex items-center gap-1">
                                        <Sparkles className="w-3.5 h-3.5" /> Structured by Gemini
                                    </span>
                                </div>
                                <MarkdownRenderer content={upload.summary} />
                            </div>
                        )}                        {/* B: FLASHCARDS TAB */}
                        {activeTab === 'flashcards' && (
                            <div className="max-w-xl mx-auto flex flex-col items-center py-6">
                                {flashcards.length === 0 ? (
                                    <p className="text-slate-500 text-center">No flashcards available for this document.</p>
                                ) : (
                                    <div className="w-full space-y-6">
                                        {/* Card Count */}
                                        <div className="text-center text-xs text-slate-500 font-semibold uppercase tracking-wider flex justify-between items-center px-2">
                                            <span>Card {cardIndex + 1} of {flashcards.length}</span>
                                            {flashcards[cardIndex].next_review_date && (
                                                <span className="text-[10px] text-slate-400 italic">
                                                    Next review: {new Date(flashcards[cardIndex].next_review_date).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Flipping card container */}
                                        <div 
                                            onClick={() => setIsFlipped(!isFlipped)}
                                            className="h-64 w-full cursor-pointer relative perspective-1000"
                                        >
                                            <div className={`w-full h-full relative duration-500 transform-style-3d ${
                                                isFlipped ? 'rotate-y-180' : ''
                                            }`}>
                                                {/* Front Side */}
                                                <div className={`absolute inset-0 w-full h-full backface-hidden bg-slate-900 border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 ${
                                                    isDue(flashcards[cardIndex]) 
                                                        ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                                                        : 'border-slate-800'
                                                }`}>
                                                    <div className="flex justify-between items-center w-full">
                                                        <span className="text-[10px] bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-full font-semibold uppercase">
                                                            Question
                                                        </span>
                                                        {isDue(flashcards[cardIndex]) && (
                                                            <span className="text-[9px] bg-amber-950/60 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                Due for Review
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-center font-semibold text-slate-100 text-base md:text-lg flex-grow flex items-center justify-center px-4">
                                                        {flashcards[cardIndex].question}
                                                    </div>
                                                    <span className="text-center text-xs text-slate-500 select-none">
                                                        Click card to reveal answer
                                                    </span>
                                                </div>

                                                {/* Back Side */}
                                                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-slate-900/90 border border-indigo-500/20 rounded-2xl p-6 flex flex-col justify-between shadow-2xl">
                                                    <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded-full self-start font-semibold uppercase">
                                                        Answer / Explanation
                                                    </span>
                                                    <div className="text-center text-slate-300 text-sm md:text-base flex-grow flex items-center justify-center px-4 overflow-y-auto max-h-[140px] leading-relaxed">
                                                        {flashcards[cardIndex].answer}
                                                    </div>
                                                    <span className="text-center text-xs text-slate-500 select-none">
                                                        Click to flip back
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Spaced Repetition Rating Panel */}
                                        {isFlipped && (
                                            <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-4 text-center space-y-3 mt-4">
                                                <p className="text-xs font-bold text-slate-300">How well did you remember this card?</p>
                                                <div className="flex justify-center gap-1.5 flex-wrap">
                                                    {[1, 2, 3, 4, 5].map((rating) => {
                                                        const labels = ['Forgot', 'Hard', 'Medium', 'Good', 'Easy'];
                                                        return (
                                                            <button
                                                                key={rating}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleReviewCard(rating);
                                                                }}
                                                                className="px-2.5 py-1.5 bg-slate-900 hover:bg-indigo-650 border border-slate-800 hover:border-indigo-500 text-[10px] font-semibold text-slate-300 hover:text-white rounded-lg transition-all"
                                                                title={labels[rating - 1]}
                                                            >
                                                                {rating} - {labels[rating - 1]}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        {/* Slider Controls */}
                                        <div className="flex items-center justify-between gap-4 mt-6">
                                            <button
                                                onClick={handlePrevCard}
                                                className="p-2.5 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition-all duration-150"
                                            >
                                                <ArrowLeft className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => setIsFlipped(!isFlipped)}
                                                className="px-6 py-2 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/35 transition-colors duration-150"
                                            >
                                                Flip Card
                                            </button>
                                            <button
                                                onClick={handleNextCard}
                                                className="p-2.5 rounded-full bg-slate-850 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:text-white transition-all duration-150"
                                            >
                                                <ArrowRight className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* C: QUIZ TAB */}
                        {activeTab === 'quiz' && (
                            <div className="max-w-3xl mx-auto space-y-6">
                                {upload.quizzes.length === 0 ? (
                                    <p className="text-slate-500 text-center">No quiz questions available for this document.</p>
                                ) : (
                                    <>
                                        {/* Score summary */}
                                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-4">
                                            <div>
                                                <h2 className="text-lg font-bold text-slate-200">Interactive Quiz</h2>
                                                <p className="text-xs text-slate-500 mt-0.5">Test your recall of key terms and concepts.</p>
                                            </div>
                                            {savedResult && (
                                                <div className="bg-emerald-950/40 border border-emerald-500/20 rounded-xl px-4 py-2 text-xs flex items-center gap-2">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                                                    <div>
                                                        <span className="font-semibold text-slate-300">Previous best score: </span>
                                                        <strong className="text-emerald-400">{savedResult.score}%</strong>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Quiz Questions */}
                                        <div className="space-y-6">
                                            {upload.quizzes.map((quiz, qIdx) => {
                                                const selected = selectedAnswers[quiz.id];
                                                const isCorrect = selected?.toLowerCase() === quiz.correct_answer.toLowerCase();

                                                return (
                                                    <div 
                                                        key={quiz.id}
                                                        className="bg-slate-900 border border-slate-800/80 rounded-xl p-5 space-y-4"
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <h3 className="font-semibold text-slate-200 text-sm">
                                                                {qIdx + 1}. {quiz.question}
                                                            </h3>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-bold bg-slate-800 text-slate-400 border border-slate-700/50">
                                                                {quiz.difficulty}
                                                            </span>
                                                        </div>

                                                        {/* Options */}
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                                                            {['a', 'b', 'c', 'd'].map((opt) => {
                                                                const optionText = quiz[`option_${opt}` as keyof Quiz] as string;
                                                                const isOptionSelected = selected === opt;
                                                                
                                                                let optionStyle = 'bg-slate-950/50 border-slate-850 hover:bg-slate-950 text-slate-300';
                                                                
                                                                if (isOptionSelected) {
                                                                    if (quizSubmitted) {
                                                                        optionStyle = isCorrect
                                                                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                                                                            : 'bg-rose-950/40 border-rose-500/40 text-rose-300';
                                                                    } else {
                                                                        optionStyle = 'bg-indigo-950/40 border-indigo-500/40 text-indigo-300';
                                                                    }
                                                                } else if (quizSubmitted && opt.toLowerCase() === quiz.correct_answer.toLowerCase()) {
                                                                    optionStyle = 'bg-emerald-950/20 border-emerald-500/30 text-emerald-300';
                                                                }

                                                                return (
                                                                    <button
                                                                        key={opt}
                                                                        onClick={() => handleSelectOption(quiz.id, opt)}
                                                                        disabled={quizSubmitted}
                                                                        className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between gap-3 transition-all duration-150 font-medium ${optionStyle}`}
                                                                    >
                                                                        <span>
                                                                            <strong className="uppercase mr-2 font-bold text-slate-500">{opt}.</strong>
                                                                            {optionText}
                                                                        </span>
                                                                        {quizSubmitted && opt.toLowerCase() === quiz.correct_answer.toLowerCase() && (
                                                                            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
                                                                        )}
                                                                        {quizSubmitted && isOptionSelected && !isCorrect && (
                                                                            <XCircle className="w-4.5 h-4.5 text-rose-400 shrink-0" />
                                                                        )}
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Action Bar */}
                                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                                            {quizSubmitted ? (
                                                <div className="flex items-center gap-4 w-full justify-between">
                                                    <div className="text-sm font-semibold">
                                                        Your Score: <span className={quizScore && quizScore >= 80 ? 'text-emerald-400' : 'text-amber-400'}>{quizScore}%</span>
                                                    </div>
                                                    <button
                                                        onClick={handleQuizReset}
                                                        className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-850 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors duration-150"
                                                    >
                                                        <RefreshCw className="w-3.5 h-3.5" /> Retake Quiz
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={handleQuizSubmit}
                                                    disabled={Object.keys(selectedAnswers).length < upload.quizzes.length}
                                                    className={`px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all duration-150 ${
                                                        Object.keys(selectedAnswers).length < upload.quizzes.length
                                                            ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/30'
                                                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 border border-indigo-500/40 hover:scale-[1.01]'
                                                    }`}
                                                >
                                                    <Check className="w-4 h-4" /> Submit Quiz Answers
                                                </button>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}

                        {/* D: AI TUTOR TAB */}
                        {activeTab === 'tutor' && (
                            <div className="max-w-5xl mx-auto flex flex-col h-[520px]">
                                {/* Chat Header */}
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Bot className="w-5 h-5 text-indigo-400" />
                                        <div>
                                            <h2 className="font-bold text-slate-200 text-sm">StudyFlip Tutor</h2>
                                            <p className="text-[10px] text-slate-500 mt-0.5">Interactive live chat and voice learning experience.</p>
                                        </div>
                                    </div>
                                    {messages.length > 0 && (
                                        <button
                                            onClick={handleClearChat}
                                            className="text-xs text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-900/60 flex items-center gap-1 transition-all duration-150"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" /> Clear History
                                        </button>
                                    )}
                                </div>

                                <div className="flex-grow grid grid-cols-1 md:grid-cols-5 gap-6 min-h-0 mb-4">
                                    
                                    {/* Left: Animated Avatar & Voice controls */}
                                    <div className="md:col-span-2 bg-slate-950/60 border border-slate-850 rounded-2xl flex flex-col items-center justify-center p-4 relative overflow-hidden shrink-0 min-h-[220px]">
                                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/2 to-transparent pointer-events-none" />
                                        
                                        <button
                                            type="button"
                                            onClick={() => setIsVoiceMode(!isVoiceMode)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider mb-2 border transition-all duration-150 z-20 flex items-center gap-1.5 ${
                                                isVoiceMode
                                                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                                                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                                            }`}
                                        >
                                            <span className={`w-1.5 h-1.5 rounded-full ${isVoiceMode ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
                                            {isVoiceMode ? 'Voice Mode Active' : 'Enable Voice Mode'}
                                        </button>

                                        <TutorAvatar state={isVoiceMode ? tutorState : 'idle'} />
                                    </div>

                                    {/* Right: Conversational Message logs */}
                                    <div className="md:col-span-3 bg-slate-950/30 border border-slate-850 rounded-2xl p-4 flex flex-col min-h-0">
                                        <div className="flex-grow overflow-y-auto space-y-4 pr-1 mb-3 scrollbar-thin">
                                            {messages.length === 0 ? (
                                                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                                                    <Bot className="w-10 h-10 text-slate-700 animate-pulse" />
                                                    <p className="text-slate-400 text-xs font-semibold">Hello! I am your AI study tutor.</p>
                                                    <p className="text-slate-500 text-[10px] max-w-xs">Ask me to explain any terms or summarize parts of the document context.</p>
                                                </div>
                                            ) : (
                                                messages.map((msg, idx) => (
                                                    <div 
                                                        key={idx}
                                                        className={`flex gap-3.5 max-w-[90%] ${
                                                            msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''
                                                        }`}
                                                    >
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-md ${
                                                            msg.role === 'user' 
                                                                ? 'bg-indigo-600 border border-indigo-500/20 text-white' 
                                                                : 'bg-slate-800 border border-slate-750 text-indigo-400'
                                                        }`}>
                                                            {msg.role === 'user' ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                                                        </div>

                                                        <div className={`p-3 rounded-2xl text-[11px] leading-relaxed border ${
                                                            msg.role === 'user' 
                                                                ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-200 rounded-tr-none' 
                                                                : 'bg-slate-900 border-slate-850 text-slate-300 rounded-tl-none'
                                                        }`}>
                                                            {msg.content.split('\n').map((para, pIdx) => (
                                                                <p key={pIdx} className={pIdx > 0 ? 'mt-1.5' : ''}>{para}</p>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                            
                                            {isSending && (
                                                <div className="flex gap-3 max-w-[90%]">
                                                    <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-750 flex items-center justify-center shrink-0">
                                                        <Bot className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                                                    </div>
                                                    <div className="p-3 rounded-2xl bg-slate-900 border border-slate-850 rounded-tl-none flex items-center gap-1">
                                                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce" />
                                                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                                                        <span className="w-1 h-1 bg-slate-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={chatEndRef} />
                                        </div>

                                        {/* Form controls */}
                                        <form onSubmit={handleSendMessage} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={inputMessage}
                                                onChange={(e) => setInputMessage(e.target.value)}
                                                placeholder="Ask a question about the document..."
                                                disabled={isSending}
                                                className="flex-grow bg-slate-950 border border-slate-850 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                                            />
                                            <button
                                                type="submit"
                                                disabled={isSending || !inputMessage.trim()}
                                                className={`px-4 rounded-xl flex items-center justify-center transition-all ${
                                                    isSending || !inputMessage.trim()
                                                        ? 'bg-slate-900 text-slate-500 border border-slate-800/40 cursor-not-allowed'
                                                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/20 shadow-md'
                                                }`}
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                            </button>
                                        </form>
                                    </div>

                                </div>
                            </div>
                        )}

                        {/* E: PODCAST TAB */}
                        {activeTab === 'podcast' && (
                            <div className="max-w-4xl mx-auto space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                            <Headphones className="w-5 h-5 text-indigo-400" /> Automated Audio Lecture Podcast
                                        </h2>
                                        <p className="text-xs text-slate-500 mt-0.5">
                                            Listen to an educational, conversational review of the lecture material.
                                        </p>
                                    </div>
                                    {podcastScript.length > 0 && (
                                        <button
                                            onClick={handleDownloadScript}
                                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150"
                                        >
                                            <Download className="w-3.5 h-3.5" /> Download Script
                                        </button>
                                    )}
                                </div>

                                {podcastScript.length === 0 ? (
                                    <div className="text-center py-12 px-6 bg-slate-950/40 rounded-2xl border border-slate-850 space-y-4">
                                        <div className="w-16 h-16 bg-indigo-950/40 border border-indigo-500/20 rounded-full flex items-center justify-center mx-auto text-indigo-400">
                                            <Headphones className="w-8 h-8 animate-pulse" />
                                        </div>
                                        <div className="max-w-md mx-auto space-y-2">
                                            <h3 className="font-bold text-slate-200 text-sm">Generate conversational audio summary</h3>
                                            <p className="text-xs text-slate-400">
                                                Gemini will generate a detailed two-person podcast script based on this document. You can customize voices for both speakers and listen to the audio directly inside your browser.
                                            </p>
                                        </div>
                                        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                            <select
                                                value={selectedLanguage}
                                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                                className="bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-slate-355 focus:outline-none focus:border-indigo-500/50"
                                            >
                                                {Object.keys(languageCodes).map((lang) => (
                                                    <option key={lang} value={lang}>{lang}</option>
                                                ))}
                                            </select>
                                            <button
                                                onClick={handleGeneratePodcast}
                                                disabled={isGeneratingPodcast}
                                                className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-indigo-650 hover:bg-indigo-600 border border-indigo-500/35 transition-all duration-150 text-white shadow-lg shadow-indigo-600/15"
                                            >
                                                {isGeneratingPodcast ? (
                                                    <span className="flex items-center gap-2">
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Generating script...
                                                    </span>
                                                ) : "Generate Podcast"}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Player Controls & Voice Settings */}
                                        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            {/* Audio Action Buttons & Language Selector */}
                                            <div className="flex flex-wrap items-center gap-3">
                                                <button
                                                    onClick={handlePlayPodcast}
                                                    className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-all duration-150"
                                                    title={isPlayingPodcast ? "Pause" : "Play"}
                                                >
                                                    {isPlayingPodcast ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                                                </button>
                                                <button
                                                    onClick={handleStopPodcast}
                                                    className="p-3 rounded-full bg-slate-850 hover:bg-slate-805 text-slate-300 hover:text-white border border-slate-800 transition-all duration-150"
                                                    title="Stop"
                                                >
                                                    <Square className="w-5 h-5 fill-current" />
                                                </button>
                                                
                                                <div className="h-6 w-px bg-slate-800 hidden sm:block" />

                                                <select
                                                    value={selectedLanguage}
                                                    onChange={(e) => setSelectedLanguage(e.target.value)}
                                                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/50"
                                                >
                                                    {Object.keys(languageCodes).map((lang) => (
                                                        <option key={lang} value={lang}>{lang}</option>
                                                    ))}
                                                </select>

                                                <button
                                                    onClick={handleGeneratePodcast}
                                                    disabled={isGeneratingPodcast}
                                                    className="px-3 py-1.5 rounded-lg bg-indigo-900 hover:bg-indigo-850 text-indigo-200 border border-indigo-700/50 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150"
                                                >
                                                    {isGeneratingPodcast ? (
                                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                    ) : (
                                                        <RefreshCw className="w-3.5 h-3.5" />
                                                    )}
                                                    Regenerate
                                                </button>

                                                {isPlayingPodcast && (
                                                    <span className="text-xs text-indigo-400 flex items-center gap-1.5 ml-2 font-medium">
                                                        <Volume2 className="w-4 h-4 animate-bounce" /> Playing segment {currentDialogueIndex !== null ? currentDialogueIndex + 1 : 1} of {podcastScript.length}...
                                                    </span>
                                                )}
                                            </div>

                                            {/* Voice Pickers */}
                                            <div className="flex flex-wrap items-center gap-4 text-xs">
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speaker A Voice</label>
                                                    <select
                                                        value={speakerAVoice}
                                                        onChange={(e) => setSpeakerAVoice(e.target.value)}
                                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500/50 max-w-[200px]"
                                                    >
                                                        {voices.filter(v => v.lang.toLowerCase().startsWith(languageCodes[selectedLanguage] || 'en')).map((v, idx) => (
                                                            <option key={idx} value={v.name}>{v.name} ({v.lang})</option>
                                                        ))}
                                                        {voices.filter(v => v.lang.toLowerCase().startsWith(languageCodes[selectedLanguage] || 'en')).length === 0 && voices.map((v, idx) => (
                                                            <option key={idx} value={v.name}>{v.name} ({v.lang})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="block text-[10px] text-slate-500 font-bold uppercase tracking-wider">Speaker B Voice</label>
                                                    <select
                                                        value={speakerBVoice}
                                                        onChange={(e) => setSpeakerBVoice(e.target.value)}
                                                        className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-indigo-500/50 max-w-[200px]"
                                                    >
                                                        {voices.filter(v => v.lang.toLowerCase().startsWith(languageCodes[selectedLanguage] || 'en')).map((v, idx) => (
                                                            <option key={idx} value={v.name}>{v.name} ({v.lang})</option>
                                                        ))}
                                                        {voices.filter(v => v.lang.toLowerCase().startsWith(languageCodes[selectedLanguage] || 'en')).length === 0 && voices.map((v, idx) => (
                                                            <option key={idx} value={v.name}>{v.name} ({v.lang})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Dialogue list view */}
                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-thin">
                                            {podcastScript.map((line, idx) => {
                                                const isCurrent = currentDialogueIndex === idx;
                                                const isSpeakerA = line.speaker === 'Speaker A';

                                                return (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            setIsPlayingPodcast(true);
                                                            playDialogue(idx);
                                                        }}
                                                        className={`p-4 rounded-2xl cursor-pointer border transition-all duration-205 group relative flex gap-3 ${
                                                            isCurrent
                                                                ? 'bg-indigo-950/20 border-indigo-500/50 shadow-md shadow-indigo-650/5 scale-[1.005]'
                                                                : 'bg-slate-900/60 border-slate-850 hover:bg-slate-900 hover:border-slate-800'
                                                        } ${isSpeakerA ? 'mr-12' : 'ml-12 flex-row-reverse text-right'}`}
                                                    >
                                                        {/* Speaker Icon/Tag */}
                                                        <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center font-bold text-xs ${
                                                            isSpeakerA 
                                                                ? 'bg-indigo-900 border border-indigo-500/20 text-indigo-300' 
                                                                : 'bg-emerald-900 border border-emerald-500/20 text-emerald-300'
                                                        }`}>
                                                            {isSpeakerA ? 'A' : 'B'}
                                                        </div>

                                                        {/* Text Bubble */}
                                                        <div className="space-y-1">
                                                            <div className={`flex items-center gap-2 group-hover:text-slate-100 ${isSpeakerA ? 'justify-start' : 'justify-end'}`}>
                                                                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                                                    isSpeakerA ? 'text-indigo-400' : 'text-emerald-400'
                                                                }`}>
                                                                    {line.speaker}
                                                                </span>
                                                                {isCurrent && (
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                                                                )}
                                                            </div>
                                                            <p className={`text-xs leading-relaxed ${
                                                                isCurrent ? 'text-slate-100 font-medium' : 'text-slate-350'
                                                            }`}>
                                                                {line.text}
                                                            </p>
                                                        </div>
                                                        
                                                        {/* Quick Play hover tag */}
                                                        <div className={`absolute bottom-2 text-[9px] text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity duration-150 ${
                                                            isSpeakerA ? 'right-4' : 'left-4'
                                                        }`}>
                                                            Click to play from here
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* F: CONCEPT GRAPH TAB */}
                        {activeTab === 'concept-graph' && (
                            <div className="max-w-5xl mx-auto space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                            <Workflow className="w-5 h-5 text-indigo-400" /> Concept Graph Visualizer
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Explore concepts and their relationships dynamically. Click on any node to view details.
                                        </p>
                                    </div>
                                    <button
                                        onClick={fetchConceptGraph}
                                        className="px-3 py-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-semibold flex items-center gap-1.5 transition-all duration-150"
                                    >
                                        <RefreshCw className="w-3.5 h-3.5 animate-pulse" /> Refresh Graph
                                    </button>
                                </div>

                                {isLoadingGraph ? (
                                    <div className="flex items-center justify-center py-20">
                                        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
                                        <span className="ml-2 text-slate-400">Building Concept Graph...</span>
                                    </div>
                                ) : !conceptGraph || conceptGraph.nodes.length === 0 ? (
                                    <div className="text-center py-20 bg-slate-950/40 rounded-2xl border border-slate-850">
                                        <p className="text-slate-500">No concept graph generated yet.</p>
                                        <button
                                            onClick={fetchConceptGraph}
                                            className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold"
                                        >
                                            Generate Graph
                                        </button>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* SVG Visualizer */}
                                        <div className="lg:col-span-2 bg-slate-955 border border-slate-850 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[500px] relative overflow-hidden">
                                            <svg className="w-full h-[450px] border border-slate-800/40 rounded-xl bg-slate-950" viewBox="0 0 600 500">
                                                <defs>
                                                    <marker id="arrow" viewBox="0 0 10 10" refX="20" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                                                        <path d="M 0 0 L 10 5 L 0 10 z" fill="#4f46e5" />
                                                    </marker>
                                                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                                                        <feGaussianBlur stdDeviation="5" result="blur" />
                                                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                                                    </filter>
                                                </defs>

                                                {/* Edges / Links */}
                                                {(() => {
                                                    const radius = 160;
                                                    const centerX = 300;
                                                    const centerY = 240;
                                                    const nodesCount = conceptGraph.nodes.length;
                                                    const nodePositions = conceptGraph.nodes.reduce((acc, node, index) => {
                                                        const angle = (index / nodesCount) * 2 * Math.PI - Math.PI / 2;
                                                        acc[node.id] = {
                                                            x: centerX + radius * Math.cos(angle),
                                                            y: centerY + radius * Math.sin(angle)
                                                        };
                                                        return acc;
                                                    }, {} as Record<string, {x: number, y: number}>);

                                                    return (
                                                        <>
                                                            {conceptGraph.edges.map((edge, idx) => {
                                                                const sourcePos = nodePositions[edge.source];
                                                                const targetPos = nodePositions[edge.target];
                                                                if (!sourcePos || !targetPos) return null;

                                                                const midX = (sourcePos.x + targetPos.x) / 2;
                                                                const midY = (sourcePos.y + targetPos.y) / 2;

                                                                return (
                                                                    <g key={idx}>
                                                                        <line
                                                                            x1={sourcePos.x}
                                                                            y1={sourcePos.y}
                                                                            x2={targetPos.x}
                                                                            y2={targetPos.y}
                                                                            stroke="#4f46e5"
                                                                            strokeWidth="2"
                                                                            strokeOpacity="0.6"
                                                                            markerEnd="url(#arrow)"
                                                                        />
                                                                        <rect
                                                                            x={midX - 35}
                                                                            y={midY - 8}
                                                                            width="70"
                                                                            height="16"
                                                                            fill="#090d16"
                                                                            rx="4"
                                                                            stroke="#312e81"
                                                                            strokeWidth="0.5"
                                                                        />
                                                                        <text
                                                                            x={midX}
                                                                            y={midY + 4}
                                                                            fill="#818cf8"
                                                                            fontSize="8"
                                                                            fontWeight="bold"
                                                                            textAnchor="middle"
                                                                        >
                                                                            {edge.label}
                                                                        </text>
                                                                    </g>
                                                                );
                                                            })}

                                                            {/* Nodes */}
                                                            {conceptGraph.nodes.map((node, index) => {
                                                                const pos = nodePositions[node.id];
                                                                if (!pos) return null;

                                                                const isSelected = selectedNode?.id === node.id;

                                                                return (
                                                                    <g
                                                                        key={node.id}
                                                                        transform={`translate(${pos.x}, ${pos.y})`}
                                                                        onClick={() => setSelectedNode(node)}
                                                                        className="cursor-pointer group"
                                                                    >
                                                                        <circle
                                                                            r="24"
                                                                            fill={isSelected ? '#4f46e5' : '#1e1b4b'}
                                                                            stroke={isSelected ? '#818cf8' : '#4338ca'}
                                                                            strokeWidth={isSelected ? '3' : '2'}
                                                                            filter={isSelected ? 'url(#glow)' : ''}
                                                                            className="transition-all duration-150 group-hover:fill-indigo-950"
                                                                        />
                                                                        <text
                                                                            dy="4"
                                                                            fill="#f8fafc"
                                                                            fontSize="9"
                                                                            fontWeight="bold"
                                                                            textAnchor="middle"
                                                                            className="pointer-events-none select-none"
                                                                        >
                                                                            {node.label.length > 8 ? node.label.substring(0, 7) + '..' : node.label}
                                                                        </text>
                                                                        <title>{node.label}</title>
                                                                    </g>
                                                                );
                                                            })}
                                                        </>
                                                    );
                                                })()}
                                            </svg>
                                        </div>

                                        {/* Side Details Panel */}
                                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 h-[500px] overflow-y-auto scrollbar-thin">
                                            {selectedNode ? (
                                                <div className="space-y-4">
                                                    <div>
                                                        <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-905/30">Concept Detail</span>
                                                        <h3 className="text-lg font-bold text-slate-100 mt-2">{selectedNode.label}</h3>
                                                    </div>
                                                    
                                                    <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-850">
                                                        {selectedNode.summary}
                                                    </p>

                                                    {/* Related Flashcards */}
                                                    <div className="space-y-2.5">
                                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Layers className="w-3.5 h-3.5 text-indigo-400" /> Related Flashcards
                                                        </h4>
                                                        {(() => {
                                                            const related = flashcards.filter(f => 
                                                                f.question.toLowerCase().includes(selectedNode.label.toLowerCase()) || 
                                                                f.answer.toLowerCase().includes(selectedNode.label.toLowerCase())
                                                            );
                                                            if (related.length === 0) return <p className="text-[10px] text-slate-500 italic">No specific flashcard match found.</p>;
                                                            return (
                                                                <div className="space-y-2">
                                                                    {related.map(f => (
                                                                        <div key={f.id} className="bg-slate-955 border border-slate-850 p-2.5 rounded-lg text-[10px] space-y-1">
                                                                            <p className="font-bold text-slate-200">Q: {f.question}</p>
                                                                            <p className="text-slate-400">A: {f.answer}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    {/* Related Quizzes */}
                                                    <div className="space-y-2.5">
                                                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                                                            <HelpCircle className="w-3.5 h-3.5 text-indigo-400" /> Related Quiz Qs
                                                        </h4>
                                                        {(() => {
                                                            const related = upload.quizzes.filter(q => 
                                                                q.question.toLowerCase().includes(selectedNode.label.toLowerCase())
                                                            );
                                                            if (related.length === 0) return <p className="text-[10px] text-slate-500 italic">No direct quiz questions found.</p>;
                                                            return (
                                                                <div className="space-y-2">
                                                                    {related.map(q => (
                                                                        <div key={q.id} className="bg-slate-955 border border-slate-850 p-2.5 rounded-lg text-[10px] space-y-1">
                                                                            <p className="font-bold text-slate-200">Q: {q.question}</p>
                                                                            <p className="text-indigo-400/90">A: {q[`option_${q.correct_answer.toLowerCase()}` as keyof Quiz]}</p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 py-10">
                                                    <Info className="w-8 h-8 mb-2 text-slate-600" />
                                                    <p className="text-xs">Click on a concept node in the graph to view summary, related cards, and quizzes.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* G: STUDY ROOM TAB */}
                        {activeTab === 'study-room' && (
                            <div className="max-w-4xl mx-auto space-y-6 animate-[fadeIn_0.2s_ease-out]">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                                    <div>
                                        <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
                                            <Users className="w-5 h-5 text-indigo-400" /> Collaborative Live Study Room
                                        </h2>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            Study in real-time with other classmates. Your activity status is synchronized automatically.
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-xs text-emerald-400 font-semibold">Active Sync Mode</span>
                                    </div>
                                </div>

                                {/* Invite Link Sharing Panel */}
                                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                                        <div>
                                            <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                                                <Share2 className="w-4 h-4 text-indigo-400" /> Invite Classmates
                                            </h3>
                                            <p className="text-xs text-slate-400 mt-1">
                                                Share the session link with classmates to study together.
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3">
                                            <button
                                                onClick={handleCopyLink}
                                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-950 hover:bg-indigo-950/40 text-slate-200 border border-slate-850 hover:border-indigo-500/20 transition-all duration-200"
                                            >
                                                {copied ? (
                                                    <>
                                                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                        <span className="text-emerald-400">Copied!</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <LinkIcon className="w-3.5 h-3.5 text-slate-450" />
                                                        <span>Copy Invite Link</span>
                                                    </>
                                                )}
                                            </button>
                                            <a
                                                href={whatsappUrl}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-550 text-white transition-all duration-200"
                                            >
                                                <Share2 className="w-3.5 h-3.5" />
                                                <span>Share on WhatsApp</span>
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {/* Active Users List */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                                            <Users className="w-4 h-4 text-indigo-400" /> Active Students ({Object.keys(roomState.users).length})
                                        </h3>
                                        <div className="space-y-3">
                                            {Object.values(roomState.users).map((u: any, idx) => (
                                                <div key={idx} className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-start gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-indigo-900/60 border border-indigo-700/30 flex items-center justify-center font-bold text-xs text-indigo-200 uppercase">
                                                        {u.name.charAt(0)}
                                                    </div>
                                                    <div className="text-xs space-y-0.5">
                                                        <p className="font-bold text-slate-200">{u.name}</p>
                                                        <p className="text-[10px] text-slate-400 italic">
                                                            {u.action ? `${u.action.replace('_', ' ')}: ${u.details}` : 'Browsing materials'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Real-time Activity Logs */}
                                    <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
                                        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-350 flex items-center gap-1.5">
                                            <Smile className="w-4 h-4 text-indigo-400" /> Real-time Activity Feed
                                        </h3>
                                        <div className="bg-slate-955 border border-slate-850 rounded-xl p-4 h-[280px] overflow-y-auto space-y-3 scrollbar-thin text-xs">
                                            {roomState.history.length === 0 ? (
                                                <p className="text-slate-500 italic text-center py-10">No recent room actions yet. Try interacting with cards, tabs, or quiz answers!</p>
                                            ) : (
                                                roomState.history.map((log: any, idx) => (
                                                    <div key={idx} className="flex justify-between items-start gap-4 border-b border-slate-900 pb-2 last:border-b-0">
                                                        <p className="text-slate-300">
                                                            <strong className="text-indigo-400">{log.name}</strong>{' '}
                                                            {log.action === 'flipped_card' && 'flipped a flashcard'}
                                                            {log.action === 'switched_tab' && `switched to the ${log.details} tab`}
                                                            {log.action === 'selected_quiz_option' && `selected option on ${log.details}`}
                                                            {log.action === 'submitted_quiz' && `submitted the quiz (${log.details})`}
                                                            {log.action === 'reviewed_flashcard' && `reviewed a flashcard (${log.details})`}
                                                            {log.action === 'sent_reaction' && `sent reaction: ${log.details}`}
                                                            {log.action === 'reset_quiz' && 'reset the interactive quiz'}
                                                            {!['flipped_card', 'switched_tab', 'selected_quiz_option', 'submitted_quiz', 'reviewed_flashcard', 'sent_reaction', 'reset_quiz'].includes(log.action) && `${log.action} ${log.details}`}
                                                        </p>
                                                        <span className="text-[9px] text-slate-500 italic shrink-0">{log.time}</span>
                                                    </div>
                                                ))
                                            )}
                                        </div>

                                        {/* Quick Reactions */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Send Quick Reaction</label>
                                            <div className="flex gap-2">
                                                {['👍', '🔥', '💡', '🎉', '❓', '😮'].map((emoji) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => syncRoom('sent_reaction', emoji)}
                                                        className="px-3.5 py-1.5 bg-slate-950 hover:bg-indigo-950/40 border border-slate-850 hover:border-indigo-500/20 rounded-xl text-sm transition-all"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </AuthenticatedLayout>
    );
}
