/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, Github, Loader2, ArrowRight, AlertCircle, FileText, Info, Lightbulb, History, Target, Layers, Code, Play, Shield, Zap, MessageSquare, Send, X, Map, ChevronLeft, Settings, User, BookOpen, Layout, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { analyzeArchitecture, ArchitectureAnalysis, RepoNode, askCodebase } from './services/geminiService';
import { Graph } from './components/Graph';
import { DEMO_REPOS, DemoRepo } from './constants/demos';

export default function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<ArchitectureAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [view, setView] = useState<'landing' | 'analysis' | 'login' | 'signup' | 'role-selection' | 'developer-setup' | 'demo-playground' | 'analyze-repository'>('landing');
  const [role, setRole] = useState<'developer' | 'contributor' | null>(null);
  const [activeTab, setActiveTab] = useState<'new' | 'expert'>('new');
  const [drillDownLevel, setDrillDownLevel] = useState<'overview' | 'component' | 'implementation'>('overview');
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [expertQuery, setExpertQuery] = useState('');
  const [user, setUser] = useState<{ name: string; email: string } | null>(null);
  const [demosUsed, setDemosUsed] = useState<string[]>([]);
  const [analysesUsed, setAnalysesUsed] = useState<string[]>([]);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitType, setLimitType] = useState<'demo' | 'analysis'>('demo');
  const [isDemo, setIsDemo] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'ai'; text: string }[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'project-overview' | 'overview' | 'architecture' | 'contribution' | 'developer' | 'settings' | 'feature-search'>('project-overview');
  const [featureSearchQuery, setFeatureSearchQuery] = useState('');

  const handleBack = () => {
    if (view === 'analysis') {
      if (drillDownLevel === 'implementation') {
        setDrillDownLevel('component');
      } else if (drillDownLevel === 'component') {
        setDrillDownLevel('overview');
        setSelectedNode(null);
      } else {
        setView(isDemo ? 'demo-playground' : 'analyze-repository');
      }
    } else if (view === 'login' || view === 'signup' || view === 'demo-playground' || view === 'analyze-repository' || view === 'role-selection') {
      setView('landing');
    } else if (view === 'developer-setup') {
      setView('role-selection');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ name: 'Developer One', email: 'dev@example.com' });
    setView('role-selection');
  };

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setUser({ name: 'New User', email: 'new@example.com' });
    setView('role-selection');
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    if (!user && analysesUsed.length >= 3 && !analysesUsed.includes(url)) {
      setLimitType('analysis');
      setShowLimitModal(true);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);
    setIsDemo(false);
    setView('analysis');

    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl: url }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to fetch repository');

      if (!analysesUsed.includes(url)) {
        setAnalysesUsed([...analysesUsed, url]);
      }

      const architecture = await analyzeArchitecture(data.tree, data.recentCommits);
      setAnalysis(architecture);
      setSidebarTab('overview');
      setDrillDownLevel('overview');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (demo: DemoRepo) => {
    if (!user && demosUsed.length >= 3 && !demosUsed.includes(demo.id)) {
      setLimitType('demo');
      setShowLimitModal(true);
      return;
    }

    if (!demosUsed.includes(demo.id)) {
      setDemosUsed([...demosUsed, demo.id]);
    }

    setAnalysis(demo.analysis);
    setIsDemo(true);
    setUrl(`demo://${demo.id}`);
    setSidebarTab('overview');
    setDrillDownLevel('overview');
    setView('analysis');
  };

  const handleNodeClick = (nodeName: string) => {
    setSelectedNode(nodeName);
    setDrillDownLevel('component');
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setDrillDownLevel('implementation');
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !analysis || isAsking) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAsking(true);

    try {
      const response = await askCodebase(userMsg, analysis);
      setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch (err) {
      setChatMessages(prev => [...prev, { role: 'ai', text: "Sorry, I encountered an error while analyzing the codebase." }]);
    } finally {
      setIsAsking(false);
    }
  };

  const activeComponent = analysis?.components.find(c => c.name === selectedNode);

  const LimitModal = () => (
    <AnimatePresence>
      {showLimitModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-parchment/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="bg-surface border border-white/20 p-12 rounded-[48px] max-w-lg w-full text-center shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-accent via-secondary to-accent animate-gradient-x" />
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-8">
              <Shield className="text-accent w-10 h-10" />
            </div>
            <h2 className="text-4xl font-serif italic text-white mb-4">{limitType === 'demo' ? 'Demo' : 'Analysis'} Limit Reached</h2>
            <p className="text-white/60 text-sm leading-relaxed mb-12 font-serif italic">
              You've explored the {limitType === 'demo' ? 'demo repositories' : 'free analysis limit'}. <br />
              <b>Sign up</b> to analyze your own repositories and unlock the full potential of DevFlow.
            </p>
            
            <div className="space-y-4">
              <button 
                onClick={() => { setShowLimitModal(false); setView('signup'); }}
                className="w-full bg-accent hover:bg-accent/90 text-white py-5 rounded-3xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all flex items-center justify-center gap-3 shadow-lg shadow-accent/20"
              >
                <Github className="w-4 h-4" /> Sign up with GitHub
              </button>
              <button 
                onClick={() => { setShowLimitModal(false); setView('signup'); }}
                className="w-full bg-white/5 hover:bg-white/10 text-white py-5 rounded-3xl font-bold uppercase tracking-[0.3em] text-[10px] transition-all border border-white/10"
              >
                Continue with Google
              </button>
            </div>

            <button 
              onClick={() => setShowLimitModal(false)}
              className="mt-8 text-[10px] font-mono uppercase tracking-widest text-white/20 hover:text-white transition-colors"
            >
              Maybe Later
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (view === 'login' || view === 'signup') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-8 relative overflow-hidden selection:bg-accent selection:text-ink">
        {/* Immersive Atmospheric Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              x: [0, 50, 0],
              y: [0, -30, 0]
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] bg-accent/30 blur-[140px] rounded-full" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.3, 1],
              x: [0, -60, 0],
              y: [0, 40, 0]
            }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear", delay: 1 }}
            className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-secondary/20 blur-[140px] rounded-full" 
          />
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute top-[20%] right-[10%] w-[40%] h-[40%] bg-deep/40 blur-[120px] rounded-full" 
          />
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-lg relative z-10"
        >
          <div className="bg-surface border border-white/20 p-16 rounded-[48px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] relative overflow-hidden group">
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-12">
                <div className="w-12 h-12 bg-accent flex items-center justify-center rounded-2xl rotate-12 group-hover:rotate-0 transition-transform duration-500">
                  <Github className="text-white w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-3xl font-serif italic text-white tracking-tight">{view === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                  <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent/60">DevFlow Visualizer</p>
                </div>
              </div>

              <form onSubmit={view === 'login' ? handleLogin : handleSignup} className="space-y-6">
                {view === 'signup' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 ml-4">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="John Doe"
                      className="w-full bg-white/[0.02] border border-white/5 rounded-3xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 font-mono text-sm"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 ml-4">Email Address</label>
                  <input
                    type="email"
                    required
                    placeholder="dev@example.com"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-3xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 font-mono text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 ml-4">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    className="w-full bg-white/[0.02] border border-white/5 rounded-3xl px-8 py-5 text-white placeholder:text-white/10 focus:outline-none focus:border-accent/50 focus:bg-white/[0.04] transition-all duration-300 font-mono text-sm"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-accent hover:bg-accent/90 text-white py-6 rounded-3xl font-bold uppercase tracking-[0.3em] text-xs transition-all duration-300 shadow-lg shadow-accent/20 active:scale-[0.98] mt-4"
                >
                  {view === 'login' ? 'Sign In' : 'Create Account'}
                </button>
              </form>

              <button 
                onClick={handleBack}
                className="mt-8 w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white transition-colors"
              >
                <ChevronLeft className="w-3 h-3" /> Back to Home
              </button>

              <div className="mt-12 flex flex-col items-center gap-6">
                <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-white/30">
                  <div className="w-8 h-px bg-white/10" />
                  <span>Or continue with</span>
                  <div className="w-8 h-px bg-white/10" />
                </div>
                
                <button className="flex items-center gap-3 px-8 py-4 bg-white/5 border border-white/5 rounded-2xl text-[10px] font-mono uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                  <Github className="w-4 h-4" /> Github
                </button>

                <div className="mt-4 text-[10px] font-mono uppercase tracking-widest">
                  <span className="text-white/30">{view === 'login' ? "Don't have an account?" : "Already have an account?"}</span>
                  <button 
                    onClick={() => setView(view === 'login' ? 'signup' : 'login')}
                    className="ml-2 text-accent hover:underline"
                  >
                    {view === 'login' ? 'Sign Up' : 'Sign In'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <motion.button 
            onClick={() => setView('landing')}
            whileHover={{ x: -5 }}
            className="mt-12 flex items-center gap-3 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-colors mx-auto"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            Back to Landing
          </motion.button>
        </motion.div>
      </div>
    );
  }

  if (view === 'role-selection') {
    return (
      <div className="min-h-screen bg-parchment flex items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-deep/20" />
        <div className="max-w-4xl w-full relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-6xl font-serif italic text-white mb-4 tracking-tight">Choose Your Path</h2>
            <p className="text-accent/60 font-mono uppercase tracking-[0.3em] text-xs">How would you like to explore the codebase?</p>
          </div>
          
          <div className="grid grid-cols-2 gap-8">
            <motion.button
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => { setRole('developer'); setView('analyze-repository'); }}
              className="group bg-surface border border-white/20 p-12 rounded-[48px] text-left hover:border-accent transition-all shadow-xl"
            >
              <div className="w-16 h-16 bg-accent rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Code className="text-white w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif italic text-white mb-4">As Developer</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                Deep dive into architecture, find specific sections, and get guided implementation plans for your next feature.
              </p>
              <div className="flex items-center gap-2 text-accent text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
                Enter Workspace <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>

            <motion.button
              whileHover={{ y: -10, scale: 1.02 }}
              onClick={() => { setRole('contributor'); setView('analyze-repository'); }}
              className="group bg-surface border border-white/20 p-12 rounded-[48px] text-left hover:border-secondary transition-all shadow-xl"
            >
              <div className="w-16 h-16 bg-secondary rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Target className="text-white w-8 h-8" />
              </div>
              <h3 className="text-3xl font-serif italic text-white mb-4">As Contributor</h3>
              <p className="text-white/50 text-sm leading-relaxed mb-8">
                Discover open entry points, understand project goals, and start your open-source journey with ease.
              </p>
              <div className="flex items-center gap-2 text-secondary text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
                Explore Gaps <ArrowRight className="w-4 h-4" />
              </div>
            </motion.button>
          </div>

          <button 
            onClick={handleBack}
            className="mt-16 w-full flex items-center justify-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-3 h-3" /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (view === 'demo-playground') {
    return (
      <div className="min-h-screen bg-parchment flex flex-col selection:bg-accent selection:text-ink">
        <header className="p-8 flex justify-between items-center bg-surface/30 backdrop-blur-sm border-b border-white/5">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="w-10 h-10 bg-white flex items-center justify-center rounded-xl hover:bg-white/90 transition-all shadow-lg active:scale-95">
              <ChevronLeft className="text-parchment w-6 h-6" />
            </button>
            <div className="text-white">
              <h1 className="text-2xl font-serif italic tracking-tight">Demo Playground</h1>
              <p className="text-[8px] font-mono uppercase tracking-[0.3em] text-accent font-bold">Explore Pre-Generated Analysis</p>
            </div>
          </div>
          <button 
            onClick={() => setView('analyze-repository')}
            className="px-8 py-3 bg-accent rounded-full text-[10px] font-mono uppercase tracking-[0.3em] text-white font-bold hover:shadow-lg transition-all"
          >
            Analyze Your Own Repo
          </button>
        </header>

        <main className="flex-1 max-w-6xl mx-auto w-full p-12 py-24">
          <div className="text-center mb-20">
            <span className="col-header mb-4 block text-accent tracking-[0.4em]">Interactive Samples</span>
            <h2 className="text-6xl font-serif italic text-white mb-6 tracking-tight">Experience the Power</h2>
            <p className="text-white/40 max-w-2xl mx-auto leading-relaxed font-serif italic text-lg">
              Select a repository below to see how DevFlow deconstructs complex codebases into actionable architectural maps.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {DEMO_REPOS.map((demo) => (
              <motion.div
                key={demo.id}
                whileHover={{ y: -10 }}
                className="group bg-surface border border-white/10 rounded-[40px] p-10 flex flex-col h-full hover:border-accent/50 transition-all shadow-2xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                  {demo.icon === 'Layers' && <Layers className="w-24 h-24 text-white" />}
                  {demo.icon === 'Target' && <Target className="w-24 h-24 text-white" />}
                  {demo.icon === 'Code' && <Code className="w-24 h-24 text-white" />}
                </div>

                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-accent/20 transition-colors">
                  {demo.icon === 'Layers' && <Layers className="w-6 h-6 text-accent" />}
                  {demo.icon === 'Target' && <Target className="w-6 h-6 text-accent" />}
                  {demo.icon === 'Code' && <Code className="w-6 h-6 text-accent" />}
                </div>

                <h3 className="text-2xl font-serif italic text-white mb-4">{demo.title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-12 flex-1">
                  {demo.description}
                </p>

                <button
                  onClick={() => handleDemoClick(demo)}
                  className="w-full py-4 bg-white text-parchment rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-3 hover:bg-accent hover:text-white transition-all shadow-lg"
                >
                  Explore Demo <Play className="w-3 h-3 fill-current" />
                </button>
              </motion.div>
            ))}
          </div>

          <div className="mt-40 max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <span className="col-header mb-4 block text-accent tracking-[0.4em]">In-Depth Guide</span>
              <h2 className="text-5xl font-serif italic text-white mb-6 tracking-tight">How to Use DevFlow</h2>
              <p className="text-white/40 max-w-xl mx-auto font-serif italic">A technical breakdown of our analysis pipeline and how you can leverage it.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { step: '01', title: 'Input & Discovery', desc: 'Paste the URL of any public GitHub repository. Our system supports all major languages and frameworks, automatically identifying project boundaries.', icon: Github },
                { step: '02', title: 'Semantic Analysis', desc: 'The Gemini 3.1 Pro engine scans the file tree, recent activity, and code patterns to build a comprehensive semantic model of the project.', icon: Search },
                { step: '03', title: 'Layered Visualization', desc: 'Interact with the dynamic graph to see how components talk to each other across different architectural layers, from Frontend to Infrastructure.', icon: Layers },
                { step: '04', title: 'Actionable Insights', desc: 'Use the "Section Navigator" or "Contribution Gaps" to get specific file paths, modification guides, and implementation plans.', icon: Target }
              ].map((item) => (
                <div key={item.step} className="group p-10 bg-surface/40 rounded-[40px] border border-white/5 hover:bg-surface/60 hover:border-blue-500/20 transition-all duration-500 relative overflow-hidden">
                  <div className="absolute -right-4 -top-4 text-[140px] font-serif italic text-white/[0.02] group-hover:text-blue-500/[0.06] transition-colors pointer-events-none select-none">
                    {item.step}
                  </div>
                  <div className="flex gap-8 items-start relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-500">
                      <item.icon className="w-7 h-7 text-blue-400" />
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif italic text-white mb-3">{item.title}</h4>
                      <p className="text-white/50 leading-relaxed font-serif italic">
                        {item.desc}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-24 p-12 bg-accent/5 border border-accent/10 rounded-[48px] flex items-center justify-between">
            <div className="flex items-center gap-8">
              <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center">
                <Shield className="text-accent w-8 h-8" />
              </div>
              <div>
                <h4 className="text-xl font-serif italic text-white mb-1">Ready to analyze your own code?</h4>
                <p className="text-white/40 text-sm font-serif italic">Connect any public GitHub repository and get instant insights.</p>
              </div>
            </div>
            <button 
              onClick={() => setView('analyze-repository')}
              className="px-10 py-4 bg-white text-parchment rounded-2xl font-bold uppercase tracking-[0.3em] text-[10px] hover:bg-accent hover:text-white transition-all shadow-xl"
            >
              Start Free Analysis
            </button>
          </div>
        </main>
        <LimitModal />
      </div>
    );
  }

  if (view === 'analyze-repository') {
    return (
      <div className="min-h-screen bg-parchment flex flex-col items-center justify-center p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-deep/40" />
        
        {/* Technical Surround */}
        <div className="absolute top-12 left-12 flex flex-col gap-1 opacity-30">
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white">System Status: Ready</div>
          <div className="text-[8px] font-mono uppercase tracking-[0.2em] text-accent">Gemini 3.1 Pro Engine Active</div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-4xl relative z-10"
        >
          <div className="text-center mb-12">
            <h2 className="text-5xl font-serif italic text-white mb-4 tracking-tight">Analyze Repository</h2>
            <p className="text-white/40 font-mono uppercase tracking-[0.4em] text-[10px]">
              Enter a GitHub URL to deconstruct its architecture
            </p>
          </div>

          <form onSubmit={handleAnalyze} className="bg-white rounded-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.8)] overflow-hidden flex items-stretch h-24 group focus-within:ring-4 ring-accent/20 transition-all">
            <div className="flex-1 relative flex items-center px-10">
              <Github className="w-6 h-6 text-parchment mr-6 opacity-40 group-focus-within:opacity-100 transition-opacity" />
              <input
                type="text"
                required
                placeholder="PASTE GITHUB REPOSITORY URL"
                className="w-full bg-transparent text-parchment placeholder:text-parchment/20 focus:outline-none font-mono text-lg tracking-tight"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="bg-ink hover:bg-ink/90 text-white px-12 flex items-center gap-4 font-bold uppercase tracking-[0.3em] text-xs transition-all active:scale-95 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  Start Analysis
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 flex items-center justify-between px-4">
            <button 
              onClick={handleBack}
              className="text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-white transition-colors flex items-center gap-2"
            >
              <ChevronLeft className="w-3 h-3" />
              Back to Home
            </button>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-accent" />
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/20">Multi-Layer Mapping</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-secondary" />
                <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/20">Actionable Gaps</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === 'landing') {
    return (
      <div className="min-h-screen bg-parchment flex flex-col selection:bg-accent selection:text-ink">
        <header className="sticky top-0 z-50 bg-surface/40 backdrop-blur-3xl border-b border-blue-500/10 px-8 py-6">
          <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
          <div className="max-w-7xl mx-auto flex justify-between items-center relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-accent flex items-center justify-center rounded-xl rotate-6">
                <Github className="text-white w-6 h-6" />
              </div>
              <h1 className="text-2xl font-serif italic tracking-tight text-white">DevFlow Visualizer</h1>
            </div>
            <div className="flex items-center gap-8">
              <a href="#how-to-use" className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50 hover:opacity-100 transition-opacity text-ink">How to Use</a>
              <a href="#features" className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50 hover:opacity-100 transition-opacity text-ink">Features</a>
              <div className="w-px h-4 bg-white/10" />
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-secondary flex items-center justify-center text-[10px] font-bold text-white">
                    {user.name[0]}
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50 text-ink">{user.name}</span>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <button 
                    onClick={() => setView('login')}
                    className="text-[10px] font-mono uppercase tracking-[0.3em] opacity-50 hover:opacity-100 transition-opacity font-bold text-ink"
                  >
                    Sign In
                  </button>
                  <button 
                    onClick={() => setView('signup')}
                    className="px-6 py-2 bg-accent rounded-full text-[10px] font-mono uppercase tracking-[0.3em] text-white font-bold hover:shadow-lg transition-all"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col">
          {/* Hero Section */}
          <section className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-[80vh] relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/10 blur-[120px] rounded-full" />
            </div>
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="max-w-5xl w-full relative z-10"
            >
              <span className="col-header mb-8 block text-accent tracking-[0.3em]">The Future of Codebase Onboarding</span>
              <h2 className="text-[120px] font-serif italic mb-12 leading-[0.85] tracking-tighter text-white">
                Structure. <br />
                Find. Modify.
              </h2>
              
              <p className="text-xl opacity-60 mb-16 max-w-2xl mx-auto leading-relaxed font-serif italic text-white/80">
                A <b>Developer Helping Agent</b> that transforms complex GitHub repositories into actionable architectural maps. 
                Bridging the gap between high-level structure and low-level implementation.
              </p>

              <div className="flex flex-col items-center gap-8">
                <div className="flex gap-6">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('demo-playground')}
                    className="px-12 py-5 rounded-full bg-white text-parchment text-[12px] uppercase tracking-[0.3em] font-bold hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all flex items-center gap-3"
                  >
                    <Play className="w-4 h-4 fill-current" /> Explore Demo
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setView('role-selection')}
                    className="px-12 py-5 rounded-full bg-accent text-white text-[12px] uppercase tracking-[0.3em] font-bold hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] transition-all flex items-center gap-3"
                  >
                    <Zap className="w-4 h-4" /> Analyze Your Repo
                  </motion.button>
                </div>

                {!user && (
                  <button 
                    onClick={() => setView('signup')}
                    className="text-[10px] font-mono uppercase tracking-[0.3em] text-white/40 hover:text-white transition-colors"
                  >
                    Or create an account to save your maps
                  </button>
                )}
              </div>
            </motion.div>
          </section>

          {/* How to Use Section */}
          <section id="how-to-use" className="py-32 px-8 bg-surface/40 relative overflow-hidden border-y border-white/10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.12),transparent_70%)]" />
            <div className="max-w-7xl mx-auto relative z-10">
              <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
                <div>
                  <span className="col-header mb-4 block text-accent tracking-[0.4em]">Quick Start Guide</span>
                  <h2 className="text-5xl font-serif italic text-white tracking-tight">How it Works</h2>
                </div>
                <p className="text-white/40 max-w-md font-serif italic text-lg leading-relaxed">
                  From URL to actionable insights in four simple steps. Deconstruct any codebase with ease.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { step: '01', title: 'Connect', desc: 'Paste any public GitHub repository URL into the analyzer.', icon: Github, color: 'text-white' },
                  { step: '02', title: 'Analyze', desc: 'Our Gemini-powered engine deconstructs the codebase architecture.', icon: Search, color: 'text-blue-400' },
                  { step: '03', title: 'Explore', desc: 'Navigate through layers, dependencies, and data flows visually.', icon: Layers, color: 'text-blue-400' },
                  { step: '04', title: 'Contribute', desc: 'Get actionable implementation plans for your next feature or fix.', icon: Target, color: 'text-blue-400' }
                ].map((item) => (
                  <motion.div 
                    key={item.step}
                    whileHover={{ y: -5 }}
                    className="group relative bg-surface/40 border border-white/5 p-10 rounded-[40px] overflow-hidden hover:bg-surface/60 hover:border-blue-500/20 transition-all duration-500"
                  >
                    <div className="absolute -right-4 -top-4 text-[120px] font-serif italic text-white/[0.03] group-hover:text-blue-500/[0.06] transition-colors pointer-events-none select-none">
                      {item.step}
                    </div>
                    
                    <div className={`w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                      <item.icon className={`w-6 h-6 ${item.color}`} />
                    </div>

                    <h4 className="text-2xl font-serif italic text-white mb-4">{item.title}</h4>
                    <p className="text-sm text-white/50 leading-relaxed font-serif italic">
                      {item.desc}
                    </p>

                    <div className="mt-8 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity">
                      Step {item.step} <ArrowRight className="w-3 h-3" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Features Section */}
          <section id="features" className="bg-surface border-y border-white/5 p-24">
            <div className="max-w-6xl mx-auto text-white">
              <div className="grid grid-cols-2 gap-24">
                <div className="space-y-8">
                  <div className="w-16 h-16 bg-secondary/10 flex items-center justify-center rounded-2xl">
                    <Target className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-4xl font-serif italic">For New Contributors</h3>
                  <p className="text-lg opacity-60 leading-relaxed">
                    We identify <b>"Open Source Entry Points"</b>—stable areas needing refactors or documentation—and provide step-by-step implementation plans to get you started. No more wandering through thousands of files.
                  </p>
                  <ul className="space-y-4 pt-4">
                    {['Automated Gap Detection', 'Difficulty Scoring', 'Step-by-Step Implementation'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] opacity-50">
                        <div className="w-1.5 h-1.5 bg-secondary rounded-full" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="space-y-8">
                  <div className="w-16 h-16 bg-accent/10 flex items-center justify-center rounded-2xl">
                    <Search className="w-8 h-8 text-accent" />
                  </div>
                  <h3 className="text-4xl font-serif italic">For Expert Developers</h3>
                  <p className="text-lg opacity-60 leading-relaxed">
                    Know what you want to change? Use our <b>"Find & Fix"</b> agent to locate exact files and get technical modification guides for any section. Reduce context-switching and jump straight to the logic.
                  </p>
                  <ul className="space-y-4 pt-4">
                    {['Intent-Based Search', 'File Path Mapping', 'Technical Modification Guides'].map(item => (
                      <li key={item} className="flex items-center gap-3 text-xs font-mono uppercase tracking-[0.3em] opacity-50">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full" /> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </section>

          {/* Market Section */}
          <section id="market" className="p-24 bg-parchment">
            <div className="max-w-6xl mx-auto text-white">
              <span className="col-header mb-12 block text-accent tracking-[0.3em]">Market Context & Unique Value</span>
              <div className="grid grid-cols-3 gap-16">
                <div className="p-8 border border-white/5 bg-surface/50 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-accent">The Competition</h4>
                  <p className="text-sm leading-relaxed opacity-60 italic font-serif">
                    Tools like <b>CodeSee</b> or <b>Sourcegraph</b> provide maps, while <b>Copilot</b> explains snippets. However, they often lack the "Contribution Gap" logic for newcomers.
                  </p>
                </div>
                <div className="p-8 border border-white/5 bg-accent text-white rounded-3xl space-y-4 shadow-xl shadow-accent/20">
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] opacity-50">Our Edge</h4>
                  <p className="text-sm leading-relaxed opacity-80 italic font-serif">
                    We combine <b>Architecture Mapping</b> with <b>Developer Intent</b>. We don't just show code; we tell you <i>why</i> to change it and <i>how</i> to start contributing.
                  </p>
                </div>
                <div className="p-8 border border-white/5 bg-surface/50 rounded-3xl space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-secondary">The "Helping Agent"</h4>
                  <p className="text-sm leading-relaxed opacity-60 italic font-serif">
                    By bridging the gap between high-level architecture and low-level file paths, we reduce onboarding time from days to minutes.
                  </p>
                </div>
              </div>
            </div>
          </section>
        </main>

        <footer className="p-12 border-t border-ink/10 flex justify-between items-center text-[10px] font-mono uppercase tracking-widest opacity-40 text-ink">
          <div>© 2026 DevFlow Visualizer • Built for the Future of OSS</div>
          <div className="flex gap-12">
            <span className="flex items-center gap-2"><Github className="w-3 h-3" /> Open Source Prototype</span>
            <span>Powered by Gemini 3.1 Pro</span>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-parchment selection:bg-accent selection:text-ink">
      {/* Header */}
      <header className="border-b border-white/20 p-6 flex justify-between items-center bg-surface sticky top-0 z-40 shadow-xl">
        <div className="flex items-center gap-6">
          <button onClick={() => setView('landing')} className="w-12 h-12 bg-white flex items-center justify-center rounded-2xl hover:bg-white/90 transition-all shadow-lg active:scale-95">
            <Github className="text-parchment w-6 h-6" />
          </button>
          <div className="text-white">
            <h1 className="text-2xl font-serif italic tracking-tight">DevFlow Visualizer</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-accent font-bold">System Online</span>
              <div className="w-1 h-1 rounded-full bg-white/20" />
              <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/40">Gemini 3.1 Pro</span>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="hidden md:flex flex-col items-end">
            <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-white font-bold flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_8px_#C084FC]" />
              {url.split('/').slice(-2).join('/')}
            </div>
            <span className="text-[8px] font-mono uppercase tracking-[0.3em] text-white/30 mt-1">Active Repository Analysis</span>
          </div>

          <div className="h-10 w-px bg-white/10" />

          <form onSubmit={handleAnalyze} className="flex bg-white rounded-xl overflow-hidden shadow-lg group focus-within:ring-2 ring-accent/50 transition-all">
            <div className="relative flex items-center px-4">
              <Search className="w-4 h-4 text-parchment opacity-30" />
              <input
                type="text"
                placeholder="SWITCH REPOSITORY"
                className="bg-transparent px-4 py-2 text-[10px] w-64 focus:outline-none font-mono text-parchment placeholder:text-parchment/20"
                value={url.startsWith('demo://') ? '' : url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>
            <button
              onClick={() => setView('analyze-repository')}
              type="button"
              className="bg-ink text-white px-6 py-2 text-[10px] uppercase tracking-widest font-bold hover:bg-ink/90 transition-all"
            >
              Switch
            </button>
          </form>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden bg-parchment">
        {/* Left Sidebar */}
        {analysis && (
          <div className="w-72 bg-surface border-r border-white/10 flex flex-col shrink-0 z-20">
            <div className="p-8 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-xl flex items-center justify-center text-white font-serif italic font-bold">A</div>
                <div>
                  <h1 className="text-xs font-bold text-white uppercase tracking-widest">Antigravity</h1>
                  <p className="text-[8px] text-white/40 font-mono uppercase tracking-tighter">Codebase Intelligence</p>
                </div>
              </div>
              <button 
                onClick={handleBack}
                className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                title="Back to Previous Page"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
              <div className="px-4 mb-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">Project Overview</span>
              </div>
              
              <button 
                onClick={() => { setSidebarTab('project-overview'); setDrillDownLevel('overview'); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${sidebarTab === 'project-overview' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Info className={`w-4 h-4 ${sidebarTab === 'project-overview' ? 'text-white' : 'text-accent group-hover:scale-110 transition-transform'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">General Summary</span>
              </button>

              <div className="px-4 pt-8 mb-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">Architecture Overview</span>
              </div>

              <button 
                onClick={() => { setSidebarTab('overview'); setDrillDownLevel('overview'); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${sidebarTab === 'overview' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Activity className={`w-4 h-4 ${sidebarTab === 'overview' ? 'text-white' : 'text-secondary group-hover:scale-110 transition-transform'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">System Analysis</span>
              </button>

              <div className="px-4 pt-8 mb-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">Architecture Diagram</span>
              </div>

              <button 
                onClick={() => { setSidebarTab('architecture'); setDrillDownLevel('overview'); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${sidebarTab === 'architecture' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Layers className={`w-4 h-4 ${sidebarTab === 'architecture' ? 'text-white' : 'text-secondary group-hover:scale-110 transition-transform'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">Visual Map</span>
              </button>

              <div className="px-4 pt-8 mb-4">
                <span className="text-[9px] font-mono uppercase tracking-[0.3em] text-white/20">For Developer</span>
              </div>

              <button 
                onClick={() => { setSidebarTab('contribution'); setDrillDownLevel('overview'); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${sidebarTab === 'contribution' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <BookOpen className={`w-4 h-4 ${sidebarTab === 'contribution' ? 'text-white' : 'text-emerald-400 group-hover:scale-110 transition-transform'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">Contribution Guide</span>
              </button>

              <button 
                onClick={() => { setSidebarTab('feature-search'); setDrillDownLevel('overview'); }}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${sidebarTab === 'feature-search' ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
              >
                <Search className={`w-4 h-4 ${sidebarTab === 'feature-search' ? 'text-white' : 'text-blue-400 group-hover:scale-110 transition-transform'}`} />
                <span className="text-xs font-bold uppercase tracking-widest">Feature Search</span>
              </button>

              {(role === 'developer' || !role) && (
                <button 
                  onClick={() => { setSidebarTab('developer'); setDrillDownLevel('overview'); }}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all group ${sidebarTab === 'developer' ? 'bg-ink border border-accent/30 text-white' : 'text-white/40 hover:bg-white/5 hover:text-white'}`}
                >
                  <Code className={`w-4 h-4 ${sidebarTab === 'developer' ? 'text-accent' : 'text-accent/40 group-hover:scale-110 transition-transform'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest">System Deep-Dive</span>
                </button>
              )}
            </div>

            <div className="p-6 border-t border-white/5 space-y-4">
              <button 
                onClick={() => setSidebarTab('settings')}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${sidebarTab === 'settings' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white'}`}
              >
                <Settings className="w-4 h-4" />
                <span className="text-[10px] font-mono uppercase tracking-widest">Settings</span>
              </button>
              
              <div className="flex items-center gap-3 px-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-accent to-secondary flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.name[0] || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold text-white truncate">{user?.name || 'Developer'}</p>
                  <p className="text-[8px] font-mono text-white/30 truncate">Pro Plan</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Breadcrumb / Navigation */}
          {analysis && sidebarTab === 'architecture' && (
            <div className="px-8 py-3 bg-ink text-parchment flex items-center justify-between border-b border-white/10">
            <div className="flex items-center gap-6">
              <button 
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-1 bg-white/5 hover:bg-white/10 rounded-lg transition-colors group"
              >
                <ChevronLeft className="w-3 h-3 text-accent group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold">Back</span>
              </button>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                <span className="text-[9px] font-mono uppercase tracking-[0.2em] font-bold">Live Analysis</span>
              </div>
              <div className="h-4 w-px bg-white/10" />
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    setDrillDownLevel('overview');
                    setSelectedNode(null);
                    setSelectedTask(null);
                  }}
                  className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${drillDownLevel === 'overview' ? 'text-white font-bold underline underline-offset-4' : 'text-white/40 hover:text-white'}`}
                >
                  Architecture Diagram
                </button>
                <ArrowRight className="w-3 h-3 opacity-20" />
                <button 
                  disabled={!selectedNode}
                  onClick={() => {
                    setDrillDownLevel('component');
                    setSelectedTask(null);
                  }}
                  className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${drillDownLevel === 'component' ? 'text-white font-bold underline underline-offset-4' : 'text-white/40 hover:text-white'} disabled:opacity-10`}
                >
                  {selectedNode || 'Component'}
                </button>
                <ArrowRight className="w-3 h-3 opacity-20" />
                <button 
                  disabled={!selectedTask}
                  className={`text-[10px] font-mono uppercase tracking-[0.2em] transition-all ${drillDownLevel === 'implementation' ? 'text-white font-bold underline underline-offset-4' : 'text-white/40'} disabled:opacity-10`}
                >
                  Plan
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[8px] font-mono uppercase tracking-[0.2em] opacity-30">Gemini 3.1 Pro Engine</span>
            </div>
          </div>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-parchment/80 z-30">
              <Loader2 className="w-12 h-12 animate-spin mb-4 text-ink" />
              <p className="text-sm font-mono uppercase tracking-widest animate-pulse text-ink">Deconstructing Codebase Architecture...</p>
              <p className="text-[10px] opacity-40 mt-2 font-mono text-ink">Mapping data flows and dependencies via Gemini 3.1 Pro</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-ink z-30 bg-parchment">
              <AlertCircle className="w-12 h-12 mb-4 text-accent" />
              <h2 className="text-xl font-serif italic mb-2">Analysis Failed</h2>
              <p className="text-sm font-mono uppercase opacity-60 tracking-[0.3em]">{error}</p>
              <button onClick={() => setView('landing')} className="mt-6 text-xs underline uppercase tracking-[0.3em] hover:text-accent transition-colors">Back to Landing</button>
            </div>
          )}

          <AnimatePresence mode="wait">
            {analysis && sidebarTab === 'architecture' && drillDownLevel === 'overview' && (
              <motion.div 
                key="overview-graph"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex-1 flex"
              >
                <div className="flex-1 relative min-h-[800px]">
                  <Graph data={analysis} onNodeClick={handleNodeClick} />
                </div>
                <div className="w-[400px] bg-surface border-l border-white/10 overflow-y-auto p-10">
                  <div className="flex items-center gap-2 mb-8">
                    <div className="w-1 h-4 bg-accent rounded-full" />
                    <span className="col-header text-white">Architecture Summary</span>
                  </div>
                  <div className="text-xs leading-relaxed markdown-body text-white/50 mb-12">
                    <Markdown>{analysis.summary}</Markdown>
                  </div>

                  <div className="pt-8 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-6">
                      <Zap className="w-4 h-4 text-accent" />
                      <span className="col-header text-white">System Hotspots</span>
                    </div>
                    <div className="space-y-4">
                      {analysis.bottlenecks.map((b, i) => (
                        <div key={i} className="p-4 bg-white/5 border border-white/5 rounded-2xl flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                          <span className="text-[10px] font-mono text-white/60">{b}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'architecture' && drillDownLevel === 'component' && activeComponent && (
              <motion.div 
                key="component-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex overflow-hidden"
              >
                <div className="flex-1 overflow-y-auto p-12 bg-parchment">
                  <div className="max-w-4xl mx-auto">
                    <div className="flex items-center justify-between mb-12">
                      <div>
                        <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-ink/40 mb-2 block">Component Deep-Dive</span>
                        <h2 className="text-6xl font-serif italic tracking-tighter text-ink uppercase">{selectedNode}</h2>
                      </div>
                      <div className="px-6 py-2 bg-ink text-parchment rounded-full text-[10px] font-mono uppercase tracking-[0.3em] font-bold">
                        {activeComponent.layer}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-16">
                      <div className="space-y-12">
                        <section>
                          <span className="col-header text-ink">Purpose & Logic</span>
                          <p className="mt-6 text-lg leading-relaxed text-ink/70 italic font-serif">{activeComponent.description}</p>
                        </section>

                        <section>
                          <span className="col-header text-ink">Core Responsibilities</span>
                          <div className="mt-8 grid grid-cols-1 gap-4">
                            {activeComponent.responsibilities.map((r, i) => (
                              <div key={i} className="flex items-start gap-4 p-4 bg-ink/5 rounded-2xl border border-ink/5">
                                <span className="text-[10px] font-mono opacity-30 mt-1">0{i+1}</span>
                                <p className="text-sm text-ink/80">{r}</p>
                              </div>
                            ))}
                          </div>
                        </section>
                      </div>

                      <div className="space-y-12">
                        <section>
                          <span className="col-header text-ink">Relevant Files</span>
                          <div className="mt-8 space-y-2">
                            {activeComponent.relevantFiles.map(file => (
                              <div key={file} className="group flex items-center justify-between p-4 bg-white border border-ink/10 rounded-xl hover:bg-ink hover:text-parchment transition-all cursor-default text-parchment">
                                <div className="flex items-center gap-3">
                                  <FileText className="w-4 h-4 opacity-30" />
                                  <span className="text-xs font-mono">{file}</span>
                                </div>
                                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                              </div>
                            ))}
                          </div>
                        </section>

                        <section>
                          <span className="col-header text-ink">Data Flow Context</span>
                          <div className="mt-8 space-y-4">
                            {analysis.dataFlow.filter(f => f.from === selectedNode || f.to === selectedNode).map((flow, i) => (
                              <div key={i} className="p-5 bg-white border border-ink/10 rounded-2xl shadow-sm text-parchment">
                                <div className="flex items-center gap-4 mb-3">
                                  <span className={`text-[10px] font-mono ${flow.from === selectedNode ? 'text-accent font-bold' : 'opacity-40'}`}>{flow.from}</span>
                                  <ArrowRight className="w-3 h-3 opacity-20" />
                                  <span className={`text-[10px] font-mono ${flow.to === selectedNode ? 'text-accent font-bold' : 'opacity-40'}`}>{flow.to}</span>
                                </div>
                                <p className="text-[11px] text-parchment/60 italic leading-relaxed">{flow.description}</p>
                              </div>
                            ))}
                          </div>
                        </section>

                        {activeComponent.blastRadius && activeComponent.blastRadius.length > 0 && (
                          <section>
                            <div className="flex items-center gap-2 mb-6">
                              <Zap className="w-4 h-4 text-accent" />
                              <span className="col-header text-ink">Impact Awareness (Blast Radius)</span>
                            </div>
                            <div className="p-6 bg-accent/5 border border-accent/10 rounded-3xl">
                              <p className="text-[11px] text-ink/60 mb-4 italic">Changes to this component might affect the following modules:</p>
                              <div className="flex flex-wrap gap-2">
                                {activeComponent.blastRadius.map(comp => (
                                  <span key={comp} className="px-3 py-1 bg-ink text-parchment text-[9px] font-mono uppercase tracking-widest rounded-full">
                                    {comp}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="w-[400px] bg-surface border-l border-white/10 p-8 overflow-y-auto">
                  <div className="flex items-center gap-2 mb-8">
                    <Code className="w-4 h-4 text-accent" />
                    <span className="col-header text-white">Modification Guide</span>
                  </div>
                  <div className="text-sm leading-relaxed markdown-body text-white/80 space-y-6">
                    <Markdown>{activeComponent.modificationGuide}</Markdown>
                  </div>
                  
                  <div className="mt-12 pt-12 border-t border-white/10">
                    <button 
                      onClick={handleBack}
                      className="w-full py-4 border border-white/20 rounded-2xl text-[10px] font-mono uppercase tracking-[0.3em] text-white/50 hover:bg-white/5 hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-3 h-3" /> Back to Overview
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'architecture' && drillDownLevel === 'implementation' && selectedTask && (
              <motion.div 
                key="implementation-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-12 bg-parchment overflow-y-auto"
              >
                <div className="max-w-3xl mx-auto w-full">
                  <div className="mb-16">
                    <div className="flex items-center gap-4 mb-6">
                      <span className={`text-[10px] px-4 py-1.5 rounded-full font-mono uppercase tracking-[0.3em] ${
                        selectedTask.difficulty === 'Easy' ? 'bg-secondary/10 text-secondary' :
                        selectedTask.difficulty === 'Medium' ? 'bg-accent/10 text-accent' :
                        'bg-red-500/10 text-red-400'
                      }`}>
                        {selectedTask.difficulty} Difficulty
                      </span>
                      <div className="h-px flex-1 bg-ink/10" />
                    </div>
                    <h2 className="text-5xl font-serif italic tracking-tight text-ink mb-6">{selectedTask.title}</h2>
                    <p className="text-xl text-ink/60 font-serif italic leading-relaxed">{selectedTask.description}</p>
                  </div>

                  <div className="space-y-12">
                    <section>
                      <div className="flex items-center gap-4 mb-8">
                        <div className="w-10 h-10 rounded-2xl bg-accent flex items-center justify-center text-white">
                          <Target className="w-5 h-5" />
                        </div>
                        <span className="col-header text-ink">Step-by-Step Implementation Plan</span>
                      </div>
                      <div className="space-y-6">
                        {selectedTask.suggestedSteps.map((step, i) => (
                          <div key={i} className="group flex gap-8 p-8 bg-white border border-ink/5 rounded-[32px] hover:border-accent/30 transition-all shadow-sm text-parchment">
                            <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-lg font-serif italic text-parchment/30 shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">
                              {i + 1}
                            </div>
                            <div className="pt-2">
                              <div className="text-sm leading-relaxed text-parchment/80 markdown-body-dark">
                                <Markdown>{step}</Markdown>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </section>
                  </div>

                  <div className="mt-20 pt-12 border-t border-ink/10 flex justify-between items-center">
                    <button 
                      onClick={handleBack}
                      className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink/40 hover:text-ink transition-colors flex items-center gap-2"
                    >
                      <ChevronLeft className="w-3 h-3" /> Back to Component
                    </button>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-mono uppercase tracking-[0.3em] text-ink/20">Gemini 3.1 Pro Implementation Guide</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'project-overview' && (
              <motion.div 
                key="project-essence"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col p-12 overflow-y-auto bg-parchment"
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="mb-16">
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-ink/40 mb-4 block">Project Essence</span>
                    <h2 className="text-7xl font-serif italic tracking-tighter text-ink mb-8">The Core Vision</h2>
                    <div className="text-2xl leading-relaxed markdown-body text-ink/80 font-serif italic border-l-4 border-accent pl-12 py-4">
                      <Markdown>{analysis.projectIdea}</Markdown>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-12">
                    <section className="p-12 bg-white border border-ink/5 rounded-[48px] shadow-sm text-parchment">
                      <div className="flex items-center gap-4 mb-8">
                        <History className="w-8 h-8 text-secondary" />
                        <h3 className="text-3xl font-serif italic text-parchment">Contribution History</h3>
                      </div>
                      <p className="text-xl text-parchment/60 font-serif italic leading-relaxed">
                        {analysis.contributionHistory}
                      </p>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'overview' && (
              <motion.div 
                key="arch-overview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col p-12 overflow-y-auto bg-parchment"
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="mb-16">
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-ink/40 mb-4 block">Architecture Overview</span>
                    <h2 className="text-7xl font-serif italic tracking-tighter text-ink mb-8">System Analysis</h2>
                  </div>

                  <div className="grid grid-cols-2 gap-12">
                    <section>
                      <div className="flex items-center gap-3 mb-8">
                        <div className="w-1 h-6 bg-secondary rounded-full" />
                        <span className="col-header text-ink">Architecture Summary</span>
                      </div>
                      <div className="text-lg leading-relaxed markdown-body-dark text-parchment/60 font-serif italic bg-white p-12 rounded-[48px] border border-ink/5 shadow-sm">
                        <Markdown>{analysis.summary}</Markdown>
                      </div>
                    </section>

                    <section className="space-y-8">
                      <div>
                        <div className="flex items-center gap-3 mb-6">
                          <Target className="w-5 h-5 text-accent" />
                          <span className="col-header text-ink">Quick Onboarding</span>
                        </div>
                        <div className="p-8 bg-ink text-parchment rounded-[40px] shadow-xl">
                          <p className="text-sm font-serif italic mb-6 opacity-60">Top recommended tasks for new contributors:</p>
                          <div className="space-y-4">
                            {analysis.contributionGaps.slice(0, 2).map((gap, i) => (
                              <button 
                                key={i}
                                onClick={() => { setSidebarTab('contribution'); handleTaskClick(gap); }}
                                className="w-full text-left p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
                              >
                                <div className="flex justify-between items-center">
                                  <span className="text-xs font-bold group-hover:text-accent transition-colors">{gap.title}</span>
                                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-8 bg-secondary/5 border border-secondary/10 rounded-[40px]">
                        <div className="flex items-center gap-3 mb-4">
                          <Zap className="w-4 h-4 text-secondary" />
                          <span className="col-header text-ink">System Health</span>
                        </div>
                        <p className="text-xs text-ink/40 font-serif italic">The codebase is currently optimized for {analysis.components.length} core modules with {analysis.dataFlow.length} active data pathways.</p>
                      </div>

                      <div className="p-8 bg-rose-500/5 border border-rose-500/10 rounded-[40px] text-parchment">
                        <div className="flex items-center gap-4 mb-6">
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                          <span className="col-header text-ink">System Bottlenecks</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.bottlenecks.map(b => (
                            <div key={b} className="px-4 py-2 bg-white border border-rose-500/20 rounded-xl text-[10px] font-bold text-slate-900 shadow-sm">
                              {b}
                            </div>
                          ))}
                        </div>
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'contribution' && (
              <motion.div 
                key="contribution-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col p-12 overflow-y-auto bg-parchment"
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="mb-16">
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-ink/40 mb-4 block">Contributor Hub</span>
                    <h2 className="text-7xl font-serif italic tracking-tighter text-ink mb-8">Start Your Journey</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-16">
                    {analysis.onboardingPath && (
                      <section>
                        <div className="flex items-center gap-3 mb-8">
                          <Map className="w-6 h-6 text-accent" />
                          <span className="col-header text-ink">Guided Contributor Path</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {analysis.onboardingPath.map((step, i) => (
                            <div key={i} className="flex gap-8 p-8 bg-white rounded-[32px] border border-ink/5 shadow-sm hover:border-accent/30 transition-all group text-parchment">
                              <div className="w-12 h-12 rounded-full bg-ink/5 flex items-center justify-center text-xl font-serif italic text-parchment/30 shrink-0 group-hover:bg-accent group-hover:text-white transition-colors">{i + 1}</div>
                              <div>
                                <div className="text-lg font-bold text-parchment mb-2">{step.file}</div>
                                <p className="text-sm text-parchment/50 leading-relaxed font-serif italic">{step.reason}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}

                    <section>
                      <div className="flex items-center gap-3 mb-8">
                        <Target className="w-6 h-6 text-secondary" />
                        <span className="col-header text-ink">Good First Issues</span>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        {analysis.contributionGaps.map((gap, i) => (
                          <button 
                            key={i} 
                            onClick={() => handleTaskClick(gap)}
                            className="text-left p-8 bg-white border border-ink/5 rounded-[40px] hover:border-secondary/50 transition-all group shadow-sm text-parchment"
                          >
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex flex-col gap-2">
                                <h4 className="text-lg font-bold text-parchment group-hover:text-secondary transition-colors">{gap.title}</h4>
                                <span className={`text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-full w-fit ${
                                  gap.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' :
                                  gap.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20' :
                                  'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                }`}>
                                  {gap.difficulty}
                                </span>
                              </div>
                              <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0 text-secondary" />
                            </div>
                            <p className="text-sm text-parchment/40 italic leading-relaxed line-clamp-3">{gap.description}</p>
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'developer' && (
              <motion.div 
                key="dev-tab"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col p-12 overflow-y-auto bg-parchment"
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="mb-16">
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-ink/40 mb-4 block">Developer Tools</span>
                    <h2 className="text-7xl font-serif italic tracking-tighter text-ink mb-8">System Deep-Dive</h2>
                  </div>

                  <div className="grid grid-cols-1 gap-12">
                    <div className="p-12 bg-ink text-parchment rounded-[48px] shadow-2xl">
                      <div className="flex items-center gap-4 mb-8">
                        <Code className="w-8 h-8 text-accent" />
                        <h3 className="text-3xl font-serif italic">Modification Guides</h3>
                      </div>
                      <div className="space-y-8">
                        {analysis.components.map((comp, i) => (
                          <div key={i} className="p-8 bg-white/5 rounded-3xl border border-white/5 hover:border-accent/30 transition-all">
                            <h4 className="text-lg font-bold text-white mb-4">{comp.name}</h4>
                            <div className="text-sm leading-relaxed text-white/60 markdown-body">
                              <Markdown>{comp.modificationGuide}</Markdown>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'feature-search' && (
              <motion.div 
                key="feature-search-tab"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex-1 flex flex-col p-12 overflow-y-auto bg-parchment"
              >
                <div className="max-w-4xl mx-auto w-full">
                  <div className="mb-16">
                    <span className="text-[10px] font-mono uppercase tracking-[0.4em] text-ink/40 mb-4 block">System Explorer</span>
                    <h2 className="text-7xl font-serif italic tracking-tighter text-ink mb-8">Feature Search</h2>
                    
                    <div className="relative group">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-ink/20 group-focus-within:text-accent transition-colors" />
                      <input 
                        type="text"
                        placeholder="Search components, data flows, or logic..."
                        className="w-full bg-white border border-ink/5 rounded-[32px] pl-16 pr-8 py-6 text-xl font-serif italic text-ink focus:outline-none focus:ring-4 ring-accent/10 transition-all shadow-sm"
                        value={featureSearchQuery}
                        onChange={(e) => setFeatureSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-12">
                    {/* Components Results */}
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <Code className="w-5 h-5 text-accent" />
                          <span className="col-header text-ink">Matching Components</span>
                        </div>
                        <span className="text-[10px] font-mono text-ink/30 uppercase tracking-widest">
                          {analysis.components.filter(c => 
                            c.name.toLowerCase().includes(featureSearchQuery.toLowerCase()) || 
                            c.description.toLowerCase().includes(featureSearchQuery.toLowerCase())
                          ).length} Found
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {analysis.components
                          .filter(c => 
                            c.name.toLowerCase().includes(featureSearchQuery.toLowerCase()) || 
                            c.description.toLowerCase().includes(featureSearchQuery.toLowerCase())
                          )
                          .map((comp, i) => (
                            <button 
                              key={i}
                              onClick={() => { setSelectedNode(comp.name); setSidebarTab('architecture'); setDrillDownLevel('component'); }}
                              className="flex items-center justify-between p-8 bg-white border border-ink/5 rounded-[32px] hover:border-accent/30 transition-all group shadow-sm text-left"
                            >
                              <div>
                                <h4 className="text-xl font-bold text-parchment mb-2 group-hover:text-accent transition-colors">{comp.name}</h4>
                                <p className="text-sm text-parchment/50 font-serif italic line-clamp-1">{comp.description}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-[9px] font-mono uppercase tracking-widest px-3 py-1 bg-ink/5 rounded-full text-parchment/40">{comp.layer}</span>
                                <ArrowRight className="w-5 h-5 text-accent opacity-0 group-hover:opacity-100 transition-all -translate-x-4 group-hover:translate-x-0" />
                              </div>
                            </button>
                          ))}
                      </div>
                    </section>

                    {/* Data Flow Results */}
                    <section>
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                          <Zap className="w-5 h-5 text-secondary" />
                          <span className="col-header text-ink">Related Data Flows</span>
                        </div>
                        <span className="text-[10px] font-mono text-ink/30 uppercase tracking-widest">
                          {analysis.dataFlow.filter(f => 
                            f.from.toLowerCase().includes(featureSearchQuery.toLowerCase()) || 
                            f.to.toLowerCase().includes(featureSearchQuery.toLowerCase()) ||
                            f.description.toLowerCase().includes(featureSearchQuery.toLowerCase())
                          ).length} Found
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {analysis.dataFlow
                          .filter(f => 
                            f.from.toLowerCase().includes(featureSearchQuery.toLowerCase()) || 
                            f.to.toLowerCase().includes(featureSearchQuery.toLowerCase()) ||
                            f.description.toLowerCase().includes(featureSearchQuery.toLowerCase())
                          )
                          .map((flow, i) => (
                            <div key={i} className="p-8 bg-white border border-ink/5 rounded-[32px] shadow-sm text-parchment">
                              <div className="flex items-center gap-4 mb-4">
                                <span className="text-xs font-bold text-accent">{flow.from}</span>
                                <ArrowRight className="w-4 h-4 text-ink/20" />
                                <span className="text-xs font-bold text-secondary">{flow.to}</span>
                              </div>
                              <p className="text-sm text-parchment/60 font-serif italic leading-relaxed">{flow.description}</p>
                            </div>
                          ))}
                      </div>
                    </section>
                  </div>
                </div>
              </motion.div>
            )}

            {analysis && sidebarTab === 'settings' && (
              <motion.div 
                key="settings-tab"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center p-12 bg-parchment"
              >
                <div className="max-w-md w-full text-center">
                  <div className="w-24 h-24 bg-ink/5 rounded-[40px] flex items-center justify-center mx-auto mb-8">
                    <Settings className="w-10 h-10 text-ink/20" />
                  </div>
                  <h2 className="text-4xl font-serif italic text-ink mb-4">Workspace Settings</h2>
                  <p className="text-sm text-ink/40 font-serif italic mb-12">Configure your analysis preferences and AI model parameters.</p>
                  
                  <div className="space-y-4">
                    <div className="p-6 bg-white border border-ink/5 rounded-3xl text-left flex justify-between items-center text-parchment">
                      <div>
                        <p className="text-xs font-bold text-parchment">Auto-Analyze on Push</p>
                        <p className="text-[10px] text-parchment/40">Sync with GitHub Webhooks</p>
                      </div>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center px-1">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                      </div>
                    </div>
                    <div className="p-6 bg-white border border-ink/5 rounded-3xl text-left flex justify-between items-center text-parchment">
                      <div>
                        <p className="text-xs font-bold text-parchment">Gemini 3.1 Pro Engine</p>
                        <p className="text-[10px] text-parchment/40">High-fidelity reasoning mode</p>
                      </div>
                      <div className="w-12 h-6 bg-emerald-500 rounded-full flex items-center px-1">
                        <div className="w-4 h-4 bg-white rounded-full ml-auto" />
                      </div>
                    </div>

                    <button 
                      onClick={() => setView('landing')}
                      className="w-full mt-8 py-4 bg-ink text-parchment rounded-2xl text-[10px] font-mono uppercase tracking-[0.3em] font-bold hover:bg-accent transition-all"
                    >
                      Close Workspace
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </main>

      {/* Component Detail Overlay - REMOVED as it's now part of the drill-down flow */}
      
      {/* Footer */}
      <footer className="border-t border-white/5 p-6 bg-surface flex justify-between items-center text-[10px] font-mono uppercase tracking-[0.3em] opacity-40 text-white">
        <div>© 2026 DevFlow Visualizer • Built for the Future of OSS</div>
        <div className="flex gap-12">
          <span className="flex items-center gap-2"><Github className="w-3 h-3" /> Open Source Prototype</span>
          <span>Powered by Gemini 3.1 Pro</span>
        </div>
      </footer>

      {/* Ask AI Floating Panel */}
      <AnimatePresence>
        {analysis && (
          <>
            <motion.button
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              onClick={() => setShowChat(!showChat)}
              className="fixed bottom-8 left-8 w-14 h-14 bg-accent text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-40"
            >
              {showChat ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
            </motion.button>

            {showChat && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                className="fixed bottom-24 left-8 w-96 h-[500px] bg-surface border border-white/10 rounded-[32px] shadow-2xl flex flex-col overflow-hidden z-40"
              >
                <div className="p-6 border-b border-white/10 bg-white/5 flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-bold text-white uppercase tracking-[0.2em]">Ask the Codebase</h3>
                    <p className="text-[10px] text-white/40 mt-1">AI Assistant Contextual Guide</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                  {chatMessages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                      <MessageSquare className="w-8 h-8" />
                      <p className="text-[10px] font-mono uppercase tracking-widest">Ask me anything about the repository structure or logic</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-xs leading-relaxed ${msg.role === 'user' ? 'bg-accent text-white rounded-tr-none' : 'bg-white/5 text-white/80 rounded-tl-none border border-white/10'}`}>
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    </div>
                  ))}
                  {isAsking && (
                    <div className="flex justify-start">
                      <div className="bg-white/5 p-4 rounded-2xl border border-white/10 flex gap-2">
                        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce" />
                        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1 h-1 bg-white/40 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleAsk} className="p-4 bg-white/5 border-t border-white/10 flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about auth, routes, logic..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-accent/50"
                  />
                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isAsking}
                    className="w-10 h-10 bg-accent text-white rounded-xl flex items-center justify-center disabled:opacity-50 hover:bg-accent/80 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>

      <LimitModal />
    </div>
  );
}
