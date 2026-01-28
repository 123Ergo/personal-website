import MatchTerminal from "@/components/MatchTerminal";
import ChatTerminal from "@/components/ChatTerminal";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center bg-[#121212] selection:bg-white selection:text-black overflow-y-auto relative pb-40">
      <div className="relative z-10 text-center px-4 mt-20 mb-20">
        <h1 className="font-editorial text-7xl md:text-[12rem] lg:text-[16rem] leading-none tracking-tighter text-white uppercase opacity-90">
          Erik Goldhar
        </h1>
        <p className="mt-8 text-neutral-500 tracking-[0.3em] font-medium uppercase text-[10px] sm:text-xs">
          Mastering the Digital Twin
        </p>
      </div>

      <div className="relative z-20 w-full px-4 mb-20">
        <MatchTerminal />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-50 p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
        <ChatTerminal />
      </div>

      {/* Subtle Grain Overlay for texture */}
      <div className="pointer-events-none fixed inset-0 z-50 opacity-[0.03] mix-blend-overlay bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

      {/* Background radial gradient for depth */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-white/[0.02] rounded-full blur-[120px] pointer-events-none" />
    </main>
  );
}
