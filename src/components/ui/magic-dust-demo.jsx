import React from "react";
import { MagicDust } from "./magic-dust-shader";
import { Globe } from "lucide-react";

export default function MagicDustDemo() {
    return (
        <div className="relative w-full h-[600px] bg-black overflow-hidden font-sans rounded-xl border border-white/5 flex flex-col items-center justify-end group">

            <a 
                href="https://uithefactory.com/gallery" 
                target="_blank" 
                rel="noopener noreferrer"
                className="absolute top-5 right-5 z-20 pointer-events-auto flex items-center justify-center w-10 h-10 bg-white text-black rounded-full hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                title="View more components on The UI Factory"
            >
                <Globe strokeWidth={2} className="w-5 h-5" />
            </a>
    
            <div className="absolute inset-0 z-0">
             <MagicDust />
            </div>
            
            <div className="absolute inset-0 z-5 pointer-events-none bg-gradient-to-t from-black via-black/50 to-transparent" />

            <div className="relative z-10 pointer-events-none pb-10 md:pb-12 px-6 flex flex-col items-center text-center">
                
                <h1 className="text-7xl md:text-[85px] font-bold tracking-tighter leading-[0.85] text-white text-center">
                    Magic<br/>
                    <span className="bg-gradient-to-b from-white via-white/80 to-white/10 text-transparent bg-clip-text">
                        Dust.
                    </span>
                </h1>
                
                <p className="mt-6 text-zinc-400 font-medium max-w-sm text-sm md:text-base leading-relaxed text-center">
                    100% editable via React Props. Pass any text array or 3D geometry and watch it materialize instantly.
                </p>
                
            </div>
        </div>
    );
}
