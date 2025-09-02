export const TypingIndicator = () => {
  return (
    <div className="flex gap-4 justify-start">
      <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0 mt-1 animate-pulse">
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443a55.38 55.38 0 0 1 5.25 2.882V15" />
        </svg>
      </div>

      <div className="flex flex-col max-w-[80%] lg:max-w-[70%] items-start">
        <div className="message-ai rounded-bl-md border border-border px-4 py-3 rounded-2xl shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">AVAI is diagnosing</span>
            <span className="text-xs">🩺</span>
            <div className="flex space-x-1 ml-1">
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