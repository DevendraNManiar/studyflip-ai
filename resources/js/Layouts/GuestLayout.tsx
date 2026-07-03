import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { PropsWithChildren } from 'react';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="flex min-h-screen flex-col items-center bg-[#07090e] pt-6 sm:justify-center sm:pt-0 relative overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-900/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center mb-6">
                <Link href="/" className="flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-indigo-950/40 border border-indigo-500/20 rounded-2xl flex items-center justify-center shadow-lg">
                        <ApplicationLogo className="h-8 w-8 text-indigo-500 fill-none" />
                    </div>
                    <span className="font-extrabold text-white text-xl tracking-wide mt-2">StudyFlip</span>
                </Link>
            </div>

            <div className="relative z-10 w-full overflow-hidden bg-[#0b0e14] border border-[#151a24] px-8 py-8 shadow-xl sm:max-w-md sm:rounded-2xl">
                {children}
            </div>
        </div>
    );
}

