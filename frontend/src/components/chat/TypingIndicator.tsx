export function TypingIndicator() {
    return (
        <div className="flex justify-start mb-4">
            <div className="max-w-3xl rounded-2xl px-6 py-4 shadow-soft chat-ai mr-12">
                <div className="flex items-center mb-3">
                    <div className="w-6 h-6 gradient-primary rounded-lg flex items-center justify-center mr-3">
                        <span className="text-black font-bold text-xs">AVAI</span>
                    </div>
                    <span className="text-sm font-medium text-muted-foreground">Assistant</span>
                </div>

                <div className="flex items-center space-x-1">
                    <span className="text-muted-foreground mr-2">Thinking</span>
                    <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-primary rounded-full animate-typing" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-typing" style={{ animationDelay: '200ms' }}></div>
                        <div className="w-2 h-2 bg-primary rounded-full animate-typing" style={{ animationDelay: '400ms' }}></div>
                    </div>
                </div>
            </div>
        </div>
    );
}