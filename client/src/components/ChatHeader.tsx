export function ChatHeader() {
  return (
    <div className="w-full max-w-2xl mx-auto px-4 pt-8 pb-4 flex flex-col items-center">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-12 h-12 bg-[var(--accent-blue)] rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-2xl font-black">∞</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">AI Mentor</h1>
      </div>
      <p className="text-[var(--text-secondary)] text-base text-center max-w-xl">
        Get practical, personalized management advice and scenario practice. Your chat is private and always evolving with new content.
      </p>
    </div>
  );
}