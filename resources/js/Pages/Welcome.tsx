import { Head, Link } from '@inertiajs/react';
import ApplicationLogo from '@/Components/ApplicationLogo';
import React from 'react';
import { 
    BookOpen, 
    Sparkles, 
    Layers, 
    Users, 
    Workflow, 
    ArrowRight, 
    MessageSquare, 
    Zap,
    Play
} from 'lucide-react';

interface WelcomeProps {
    auth: {
        user?: {
            name: string;
        }
    }
}

export default function Welcome({ auth }: WelcomeProps) {
    return (
        <div className="min-h-screen bg-[#07090e] text-[#94a3b8] font-sans overflow-x-hidden selection:bg-indigo-600/30 selection:text-white relative">
            <Head title="Welcome to StudyFlip" />
            
            {/* Glowing background highlights */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px] pointer-events-none" />

            {/* HEADER NAV */}
            <header className="max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-[#151a24] relative z-10">
                <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-indigo-950/40 border border-indigo-500/20 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/5">
                        <ApplicationLogo className="w-6 h-6 text-indigo-500 fill-none" />
                    </div>
                    <span className="font-bold text-white tracking-wide text-lg">StudyFlip</span>
                </div>

                <nav className="flex items-center gap-4">
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all duration-150 shadow-md shadow-indigo-600/10 hover:shadow-indigo-500/20 hover:scale-[1.01]"
                        >
                            Enter Dashboard →
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={route('login')}
                                className="text-slate-400 hover:text-white font-semibold text-xs uppercase tracking-wider px-3 py-2 transition-colors"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="bg-indigo-650 hover:bg-indigo-600 text-white font-bold px-5 py-2.5 rounded-xl text-xs tracking-wider uppercase transition-all duration-150 shadow-md shadow-indigo-650/10 hover:shadow-indigo-600/20 hover:scale-[1.01]"
                            >
                                Sign Up Free
                            </Link>
                        </>
                    )}
                </nav>
            </header>

            {/* HERO SECTION */}
            <section className="max-w-5xl mx-auto px-6 pt-24 pb-16 text-center space-y-8 relative z-10">
                <div className="inline-flex items-center gap-2 bg-[#12161f] border border-[#202735] px-4 py-2 rounded-full text-[10px] font-bold text-slate-300 uppercase tracking-widest">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Next-Gen Educational Technology Platform
                </div>

                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
                    Turn Static PDFs Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">Interactive Study Decks</span> Instantly
                </h1>

                <p className="text-sm md:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
                    StudyFlip extracts core concepts from your lecture files to auto-generate active recall flashcards, SVG concept maps, multilingual lecture podcasts, and customizable quizzes.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
                    {auth.user ? (
                        <Link
                            href={route('dashboard')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/25"
                        >
                            Go to your workspace
                        </Link>
                    ) : (
                        <>
                            <Link
                                href={route('register')}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all shadow-lg shadow-indigo-600/25 flex items-center gap-2 hover:scale-[1.01]"
                            >
                                Start Learning Now <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link
                                href={route('login')}
                                className="bg-[#0b0e14] border border-[#151a24] hover:border-slate-700 text-white font-bold px-8 py-4 rounded-xl text-xs uppercase tracking-widest transition-all"
                            >
                                Sign In
                            </Link>
                        </>
                    )}
                </div>
            </section>

            {/* FEATURES GRID */}
            <section className="max-w-7xl mx-auto px-6 py-20 relative z-10 border-t border-[#151a24]/50">
                <div className="text-center space-y-2 mb-16">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Pedagogical Framework</span>
                    <h2 className="text-3xl font-extrabold text-white">Active Retrieval Practices</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Feature 1 */}
                    <div className="bg-[#0b0e14] border border-[#151a24] p-8 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
                        <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-500/25 rounded-xl flex items-center justify-center text-indigo-400">
                            <Layers className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-lg">SM-2 Spaced Repetition</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Rate your memory recall quality (1-5 scale). The system calculates retention intervals and schedules review times right before you forget.
                        </p>
                    </div>

                    {/* Feature 2 */}
                    <div className="bg-[#0b0e14] border border-[#151a24] p-8 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
                        <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-500/25 rounded-xl flex items-center justify-center text-indigo-400">
                            <Workflow className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-lg">SVG Concept Mapping</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Explore dynamic structure charts linking related ideas. Click any graph node to open relevant flashcards and quiz questions instantly.
                        </p>
                    </div>

                    {/* Feature 3 */}
                    <div className="bg-[#0b0e14] border border-[#151a24] p-8 rounded-2xl space-y-4 hover:border-slate-800 transition-colors">
                        <div className="w-10 h-10 bg-indigo-950/60 border border-indigo-500/25 rounded-xl flex items-center justify-center text-indigo-400">
                            <Users className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-white text-lg">Collaborative Study Rooms</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                            Study with classmates in real time. Share emoji reactions, monitor progress logs, and coordinate study sessions via direct WhatsApp sharing.
                        </p>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="max-w-7xl mx-auto px-6 py-12 text-center text-[10px] text-slate-600 border-t border-[#151a24] relative z-10">
                <p>© 2026 StudyFlip. Built for the Educational Technology Course.</p>
                <div className="flex justify-center gap-4 mt-3 font-medium text-slate-500">
                    <span>Jaimin Panchal</span>
                    <span>•</span>
                    <span>Purvisha Desani</span>
                    <span>•</span>
                    <span>Jaydeep Leva</span>
                    <span>•</span>
                    <span>Pal Dhameliya</span>
                </div>
            </footer>
        </div>
    );
}
