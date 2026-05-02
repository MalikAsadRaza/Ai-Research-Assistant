import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Send, Sparkles, BookOpen, Microscope, BrainCircuit, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const SYSTEM_INSTRUCTION = `You are an Advanced AI Research Assistant designed to help with academic, technical, and professional research.

Your responsibilities include:
1. Understanding complex research queries.
2. Breaking down the topic into structured subtopics.
3. Providing accurate, up-to-date, and well-organized information.
4. Summarizing research papers and articles.
5. Generating literature reviews with proper structure.
6. Suggesting research gaps and future work.
7. Providing citations in APA/MLA format where applicable.
8. Explaining concepts in simple terms when requested.

When responding:
- Start with a clear overview of the topic.
- Provide structured sections (Introduction, Key Concepts, Analysis, Conclusion).
- Use bullet points and headings where helpful.
- Include examples and real-world applications.
- Suggest datasets, tools, or frameworks if relevant.
- Highlight limitations and challenges.
- If the topic is technical, include pseudocode or formulas if needed.

Tone:
- Professional and academic
- Clear and concise
- Avoid unnecessary fluff

If the user query is vague:
- Ask clarifying questions before proceeding.

If the user asks for a research paper:
- Provide a structured format including Abstract, Introduction, Methodology, Results, and Conclusion.

Always aim to assist like a university-level research expert.
- Suggest ML models and algorithms
- Provide evaluation metrics (accuracy, precision, recall)
- Recommend datasets (Kaggle, UCI, etc.)
- Ensure plagiarism-free content
- Maintain formal academic tone
- Include proper referencing`;

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const chatSessionRef = useRef<any>(null);

  useEffect(() => {
    chatSessionRef.current = ai.chats.create({
      model: 'gemini-3.1-pro-preview',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.2,
      }
    });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      if (!chatSessionRef.current) {
        throw new Error('Chat session not initialized');
      }

      const modelMessageId = (Date.now() + 1).toString();
      setMessages((prev) => [...prev, { id: modelMessageId, role: 'model', content: '' }]);

      const streamResponse = await chatSessionRef.current.sendMessageStream({
        message: userMessage.content
      });

      for await (const chunk of streamResponse) {
        if (chunk.text) {
          setMessages((prev) => 
            prev.map(msg => 
              msg.id === modelMessageId 
                ? { ...msg, content: msg.content + chunk.text }
                : msg
            )
          );
        }
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages((prev) => [...prev, { 
        id: Date.now().toString(), 
        role: 'model', 
        content: '**Error:** Failed to generate response. Please check your API key and connection.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const suggestQueries = [
    {
      title: "Literature Review",
      description: "Outline the effects of microplastics on marine ecosystems.",
      icon: <BookOpen className="w-5 h-5 text-blue-500" />
    },
    {
      title: "Model Capabilities",
      description: "Explain Retrieval-Augmented Generation (RAG) architecture.",
      icon: <BrainCircuit className="w-5 h-5 text-indigo-500" />
    },
    {
      title: "Research Proposal",
      description: "Structure a proposal for federated learning in healthcare.",
      icon: <Microscope className="w-5 h-5 text-teal-500" />
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50 font-sans">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-gray-200 flex flex-col pt-6 pb-4 px-4 hidden md:flex shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="font-semibold text-gray-900 tracking-tight">AI Research Assistant</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
            Capabilities
          </h2>
          <ul className="space-y-1">
            {['Literature Reviews', 'Paper Summarization', 'Research Gaps', 'Methodology Design', 'Citation Generation'].map((item, i) => (
              <li key={i} className="text-sm text-gray-600 py-2 px-2 rounded-md hover:bg-gray-50 cursor-default flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>
                {item}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="mt-auto px-2">
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
            <p className="font-medium mb-1">Academic rigor applied.</p>
            <p className="text-blue-600/80 text-xs">Powered by Gemini 3.1 Pro for complex reasoning tasks.</p>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full bg-white relative max-w-5xl mx-auto shadow-sm border-x border-gray-100">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-center p-4 border-b border-gray-100 bg-white z-10">
           <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-1 rounded-md text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <h1 className="font-semibold text-gray-900">Research Assistant</h1>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto py-10 px-4 text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-sm border border-blue-100">
                <Sparkles className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-3 tracking-tight">How can I assist your research today?</h2>
              <p className="text-gray-500 mb-10 max-w-lg leading-relaxed">
                I am trained to break down complex queries, summarize papers, generate academic reviews, and provide structured, insightful analyses.
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {suggestQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => setInput(query.description)}
                    className="flex flex-col text-left p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-300 hover:shadow-sm hover:ring-1 hover:ring-blue-100 transition-all group"
                  >
                    <div className="mb-3 bg-gray-50 p-2 w-fit rounded-lg group-hover:bg-blue-50 transition-colors">
                      {query.icon}
                    </div>
                    <h3 className="font-medium text-gray-900 text-sm mb-1">{query.title}</h3>
                    <p className="text-xs text-gray-500 leading-snug">{query.description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-8 pb-10">
              {messages.map((message) => (
                <div 
                  key={message.id} 
                  className={`flex gap-4 p-1 \${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'model' && (
                    <div className="w-8 h-8 shrink-0 bg-blue-100 border border-blue-200 text-blue-700 rounded-full flex items-center justify-center mt-1">
                      <Sparkles className="w-4 h-4" />
                    </div>
                  )}
                  
                  <div className={`max-w-[85%] \${
                    message.role === 'user' 
                      ? 'bg-gray-100 text-gray-900 px-5 py-3.5 rounded-2xl rounded-tr-sm' 
                      : 'text-gray-800'
                  }`}>
                    {message.role === 'model' ? (
                      <div className="markdown-body">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap font-medium">{message.content}</p>
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 shrink-0 bg-gray-200 border border-gray-300 text-gray-600 rounded-full flex items-center justify-center mt-1">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role === 'user' && (
                <div className="flex gap-4 p-1 justify-start">
                  <div className="w-8 h-8 shrink-0 bg-blue-100 border border-blue-200 text-blue-700 rounded-full flex items-center justify-center mt-1">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="max-w-[85%] flex items-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 rounded-tl-sm text-gray-500 text-sm">
                    <span className="flex items-center gap-2">
                       <span className="animate-pulse h-2 w-2 bg-blue-400 rounded-full"></span>
                       <span className="animate-pulse h-2 w-2 bg-blue-400 rounded-full delay-75"></span>
                       <span className="animate-pulse h-2 w-2 bg-blue-400 rounded-full delay-150"></span>
                    </span>
                    <span className="ml-3 font-medium animate-pulse">Synthesizing research...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 sm:p-6 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto relative">
            <form onSubmit={handleSubmit} className="relative shadow-sm rounded-xl border border-gray-200 focus-within:ring-2 focus-within:ring-blue-100 focus-within:border-blue-400 transition-all bg-white">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message Research Assistant..."
                className="w-full pl-4 pr-14 py-4 bg-transparent rounded-xl focus:outline-none resize-none max-h-48 min-h-[56px] text-gray-900 placeholder-gray-400 text-base"
                rows={1}
                style={{ height: "auto" }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = "auto";
                  target.style.height = Math.min(target.scrollHeight, 200) + "px";
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 bottom-2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:bg-gray-200 disabled:text-gray-400 transition-colors"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-[11px] text-gray-400 font-medium tracking-wide">
                AI responses may contain inaccuracies. Verify critical research.
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
