import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import ReactMarkdown from 'react-markdown';

// Tailwind CSS helper
const cn = (...classes) => twMerge(clsx(...classes));

// --- ICONS ---
const CheckCircle = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const Loader = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M21 12a9 9 0 11-6.219-8.56"/>
  </svg>
);

const Search = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.3-4.3"/>
  </svg>
);

const AlertCircle = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

const Shield = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

const ChevronDown = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ChevronUp = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="18 15 12 9 6 15"/>
  </svg>
);

const CopyIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg className={className} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

// --- COMPONENTS ---

const StatusBadge = ({ status, children }) => {
  const variants = {
    verified: 'bg-green-50 text-green-700 border-green-200',
    false: 'bg-red-50 text-red-700 border-red-200',
    researching: 'bg-blue-50 text-blue-700 border-blue-200',
    verifying: 'bg-amber-50 text-amber-700 border-amber-200',
    default: 'bg-slate-50 text-slate-700 border-slate-200'
  };

  return (
    <span className={cn(
      'inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border',
      variants[status] || variants.default
    )}>
      {status === 'verified' && <CheckCircle className="w-4 h-4 mr-1" />}
      {status === 'false' && <AlertCircle className="w-4 h-4 mr-1" />}
      {status === 'researching' && <Loader className="w-4 h-4 mr-1 animate-spin" />}
      {status === 'verifying' && <Search className="w-4 h-4 mr-1" />}
      {children}
    </span>
  );
};

// Updated FactCard component with better data handling
const FactCard = ({ fact, index }) => {
  const isVerified = fact.status === 'VERIFIED';
  
  // Check if evidence and reason are the same - if so, only show one
  const hasDuplicateContent = fact.evidence && fact.reason && 
    fact.evidence.trim() === fact.reason.trim();
  
  // Use evidence if available, otherwise use reason for the analysis section
  const analysisContent = fact.evidence || fact.reason;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={cn(
        'rounded-3xl border-2 p-6 shadow-xl backdrop-blur-sm',
        isVerified 
          ? 'border-green-200 bg-white' 
          : 'border-red-200 bg-white'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <h3 className="font-bold text-slate-900 text-lg leading-tight flex-1">
          {fact.claim}
        </h3>
        <StatusBadge status={isVerified ? 'verified' : 'false'}>
          {fact.status}
        </StatusBadge>
      </div>
      
      <div className="space-y-4">
        {/* Analysis/Evidence Section - Show only if we have content */}
        {analysisContent && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">
              {fact.evidence ? 'Evidence Found' : 'Analysis'}
            </h4>
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                {analysisContent}
              </p>
            </div>
          </div>
        )}
        
        {/* Reasoning Section - Only show if it's different from evidence */}
        {fact.reason && !hasDuplicateContent && (
          <div>
            <h4 className="text-sm font-semibold text-slate-700 mb-2">Reasoning</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              {fact.reason}
            </p>
          </div>
        )}
        
        {/* Correction Section */}
        {!isVerified && fact.correction && (
          <div className="bg-red-50 rounded-2xl p-4 border border-red-100">
            <h4 className="text-sm font-semibold text-red-800 mb-2">Correction</h4>
            <p className="text-red-700 text-sm leading-relaxed">
              {fact.correction}
            </p>
          </div>
        )}
        
        {/* Source Section */}
        {fact.source && (
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Source</h4>
            <p className="text-slate-600 text-sm break-words">
              {fact.source}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Markdown renderer for evidence snippets using react-markdown
const EvidenceRenderer = ({ text }) => {
  if (!text) return null;

  return (
    <div className="text-sm text-slate-700 markdown-content">
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 ml-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 ml-4 space-y-1 list-decimal">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          a: ({ href, children }) => (
            <a 
              href={href} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-blue-600 hover:text-blue-800 underline break-all"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => <strong className="font-bold text-slate-900">{children}</strong>,
          em: ({ children }) => <em className="italic text-slate-800">{children}</em>,
        }}
      >
        {text}
      </ReactMarkdown>
    </div>
  );
};

const ThinkingStep = ({ step, status, data, index }) => {
  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isPending = status === 'pending';
  const [isExpanded, setIsExpanded] = useState(false);

  const hasData = data && (Array.isArray(data) ? data.length > 0 : data.trim() !== '');

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.2 }}
      className="flex items-start space-x-4"
    >
      <div className={cn(
        'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center border-2',
        isCompleted 
          ? 'bg-green-500 border-green-500 text-white' 
          : isActive
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 border-transparent text-white'
          : 'border-slate-300 text-slate-400'
      )}>
        {isCompleted && <CheckCircle className="w-4 h-4" />}
        {isActive && <Loader className="w-4 h-4 animate-spin" />}
        {isPending && <span className="text-sm font-bold">{index + 1}</span>}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between">
          <h3 className={cn(
            'font-bold text-lg mb-2',
            isCompleted ? 'text-green-700' : 
            isActive ? 'text-slate-900' : 
            'text-slate-400'
          )}>
            {step.title}
          </h3>
          
          {(isCompleted || isActive) && hasData && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="ml-2 p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-slate-500" />
              ) : (
                <ChevronDown className="w-5 h-5 text-slate-500" />
              )}
            </button>
          )}
        </div>
        
        {isActive && step.description && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-slate-600 mb-3"
          >
            {step.description}
          </motion.p>
        )}
        
        {(isActive || (isCompleted && isExpanded)) && data && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-2"
          >
            {Array.isArray(data) ? (
              data.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 border border-slate-200"
                >
                  {item}
                </motion.div>
              ))
            ) : (
              <div className="bg-slate-50 rounded-xl px-3 py-2 text-sm text-slate-700 border border-slate-200">
                <EvidenceRenderer text={data} />
              </div>
            )}
          </motion.div>
        )}
        
        {isCompleted && hasData && !isExpanded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2"
          >
            <button
              onClick={() => setIsExpanded(true)}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center space-x-1"
            >
              <span>Show details</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          </motion.div>
        )}
        
        {isActive && step.showProgress && (
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 2, repeat: Infinity }}
            className="h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mt-3"
          />
        )}
      </div>
    </motion.div>
  );
};

// Copy Button Component
const CopyButton = ({ text, className }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'inline-flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-200',
        copied 
          ? 'bg-green-100 text-green-700 border border-green-200' 
          : 'bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200'
      )}
    >
      {copied ? (
        <>
          <CheckIcon className="w-4 h-4" />
          <span>Copied!</span>
        </>
      ) : (
        <>
          <CopyIcon className="w-4 h-4" />
          <span>Copy Text</span>
        </>
      )}
    </button>
  );
};

// --- MAIN APP ---

const App = () => {
  const [inputText, setInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [streamData, setStreamData] = useState({
    claims: [],
    queries: [],
    evidence: '',
    report: null,
    final: ''
  });
  const [thinkingSteps, setThinkingSteps] = useState([
    { 
      title: 'Extracting Claims', 
      description: 'Identifying factual claims from your text...',
      status: 'pending',
      showProgress: false
    },
    { 
      title: 'Researching', 
      description: 'Searching for reliable sources...',
      status: 'pending',
      showProgress: true
    },
    { 
      title: 'Verifying', 
      description: 'Cross-referencing evidence...',
      status: 'pending',
      showProgress: true
    }
  ]);

  const textareaRef = useRef(null);

  const handleAnalyze = async () => {
    if (!inputText.trim() || isAnalyzing) return;

    setIsAnalyzing(true);
    setStreamData({ claims: [], queries: [], evidence: '', report: null, final: '' });
    setThinkingSteps(steps => steps.map(step => ({ ...step, status: 'pending' })));

    try {
      console.log('Starting analysis...');
      
      const response = await fetch('https://factzod.onrender.com/stream_analyze', { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText }),
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      if (!response.body) {
        throw new Error('ReadableStream not supported in this browser');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          console.log('Stream completed normally');
          setIsAnalyzing(false);
          break;
        }

        // Decode and add to buffer
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;

        // Process complete SSE messages
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const jsonStr = line.slice(6).trim();
              if (!jsonStr) continue;
              
              const data = JSON.parse(jsonStr);
              console.log('Received:', data.type, data.content);
              
              switch (data.type) { 
                case 'claims':
                  setStreamData(prev => ({ ...prev, claims: data.content }));
                  setThinkingSteps(steps => steps.map((step, i) => 
                    i === 0 ? { ...step, status: 'completed' } : 
                    i === 1 ? { ...step, status: 'active' } : step
                  ));
                  break;
                  
                case 'queries':
                  setStreamData(prev => ({ ...prev, queries: data.content }));
                  break;
                  
                case 'evidence':
                  setStreamData(prev => ({ ...prev, evidence: data.content }));
                  setThinkingSteps(steps => steps.map((step, i) => 
                    i === 1 ? { ...step, status: 'completed' } : 
                    i === 2 ? { ...step, status: 'active' } : step
                  ));
                  break;
                  
                case 'report':
                  console.log('Received report:', data.content);
                  setStreamData(prev => ({ ...prev, report: data.content }));
                  setThinkingSteps(steps => steps.map((step, i) => 
                    i === 2 ? { ...step, status: 'completed' } : step
                  ));
                  break;
                  
                case 'final':
                  setStreamData(prev => ({ ...prev, final: data.content }));
                  setIsAnalyzing(false);
                  console.log('Analysis completed successfully');
                  break;
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e, 'Line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error streaming analysis:', error);
      setIsAnalyzing(false);
      alert("Error: " + error.message);
    }
  };

  // Extract fact check results from the report - handle both possible structures
  const factCheckResults = React.useMemo(() => {
    if (!streamData.report) return [];
    
    console.log('Raw report data:', streamData.report);
    
    // Handle different possible structures
    if (Array.isArray(streamData.report)) {
      return streamData.report;
    } else if (streamData.report.fact_check_report) {
      return streamData.report.fact_check_report;
    } else if (streamData.report.results) {
      return streamData.report.results;
    }
    
    return [];
  }, [streamData.report]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white font-sans text-slate-900">
      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative py-16 px-4 text-center bg-white border-b border-slate-200"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-indigo-600/5" />
        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center space-x-3 mb-6"
          >
            <Shield className="w-12 h-12 text-blue-600" />
            <h1 className="text-5xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              FactZod
            </h1>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-600 mb-2 font-medium"
          >
            Kneel before the Truth
          </motion.p>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-slate-500 max-w-2xl mx-auto"
          >
            AI-powered fact-checking agent that extracts, researches, and verifies claims with military precision
          </motion.p>
        </div>
      </motion.section>

      {/* Main Content - Single Column Layout */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Input Area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8"
        >
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Analyze Your Text
          </h2>
          
          <div className="space-y-4">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste the text you want to fact-check here... (articles, statements, claims, etc.)"
              className="w-full h-48 px-6 py-4 rounded-2xl border-2 border-slate-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 resize-none transition-all duration-200 text-slate-700 placeholder-slate-400 focus:outline-none"
              disabled={isAnalyzing}
            />
            
            <motion.button
              whileHover={{ scale: isAnalyzing ? 1 : 1.02 }}
              whileTap={{ scale: isAnalyzing ? 1 : 0.98 }}
              onClick={handleAnalyze}
              disabled={!inputText.trim() || isAnalyzing}
              className={cn(
                'w-full py-4 px-8 rounded-2xl font-bold text-white text-lg shadow-lg transition-all duration-200',
                isAnalyzing 
                  ? 'bg-slate-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-xl'
              )}
            >
              {isAnalyzing ? (
                <span className="flex items-center justify-center">
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Analyzing...
                </span>
              ) : (
                'Verify Facts'
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Thinking Timeline */}
        <AnimatePresence>
          {(isAnalyzing || streamData.claims.length > 0) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8 overflow-hidden"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Verification Process
              </h2>
              
              <div className="space-y-8">
                {thinkingSteps.map((step, index) => (
                  <ThinkingStep
                    key={step.title}
                    step={step}
                    status={step.status}
                    data={
                      index === 0 ? streamData.claims :
                      index === 1 ? streamData.queries :
                      index === 2 ? streamData.evidence : null
                    }
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fact Check Results */}
        <AnimatePresence>
          {factCheckResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8"
            >
              <h2 className="text-2xl font-bold text-slate-900 mb-6">
                Fact Check Report
              </h2>
              
              <div className="space-y-6">
                {factCheckResults.map((fact, index) => (
                  <FactCard
                    key={index}
                    fact={fact}
                    index={index}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Final Rewrite */}
        <AnimatePresence>
          {streamData.final && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl border border-slate-200 p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-slate-900">
                  Verified Version
                </h2>
                <CopyButton text={streamData.final} />
              </div>
              
              <div className="prose prose-slate max-w-none">
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                  <p className="text-slate-700 leading-relaxed whitespace-pre-wrap break-words">
                    {streamData.final}
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default App;