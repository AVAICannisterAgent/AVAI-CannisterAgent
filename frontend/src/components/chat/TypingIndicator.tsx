export const TypingIndicator = () => {
  return (
    <div className="flex gap-4 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </div>

      <div className="flex flex-col max-w-[80%] lg:max-w-[70%] items-start">
        <div className="message-ai rounded-bl-md border border-border px-4 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-1">
            <span className="text-sm text-muted-foreground">AI is thinking</span>
            <div className="flex space-x-1 ml-2">
              <div className="w-1 h-1 bg-current rounded-full animate-typing-dots"></div>
              <div className="w-1 h-1 bg-current rounded-full animate-typing-dots" style={{ animationDelay: '0.2s' }}></div>
              <div className="w-1 h-1 bg-current rounded-full animate-typing-dots" style={{ animationDelay: '0.4s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};