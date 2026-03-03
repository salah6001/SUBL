import { useEffect, useState, useRef } from 'react';
import { 
  Brain, Activity, Shield, Zap, Eye, Lock, 
  TrendingUp, BarChart3, Cpu, ChevronDown,
  Play, Pause, RotateCcw, Keyboard, Heart, AlertCircle,
  CheckCircle, Sparkles, Menu, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// Navigation Component
function Navigation() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', href: '#hero' },
    { label: 'Features', href: '#features' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Analysis', href: '#analysis' },
    { label: 'Demo', href: '#demo' },
  ];

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? 'bg-background/90 backdrop-blur-lg border-b border-border/50' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <a href="#" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Subl</span>
          </a>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </a>
            ))}
            <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500">
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border/50">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
              <Button size="sm" className="bg-gradient-to-r from-blue-500 to-cyan-400">
                Get Started
              </Button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

// Hero Section
function HeroSection() {
  return (
    <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-transparent to-cyan-500/10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
          <Sparkles className="w-4 h-4 mr-2" />
          AI-Powered Cognitive Wellness
        </Badge>
        
        <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
          <span className="gradient-text">Subl</span>
          <br />
          <span className="text-foreground">Your Silent Companion</span>
        </h1>
        
        <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10">
          Revolutionary AI that detects stress and cognitive states through typing patterns. 
          No cameras, no surveys, just silent awareness.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" className="bg-gradient-to-r from-blue-500 to-cyan-400 hover:from-blue-600 hover:to-cyan-500 text-lg px-8">
            <Play className="w-5 h-5 mr-2" />
            Try Demo
          </Button>
          <Button size="lg" variant="outline" className="text-lg px-8">
            Learn More
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
          {[
            { value: '77%', label: 'Detection Accuracy', icon: TrendingUp },
            { value: '5', label: 'Cognitive States', icon: Brain },
            { value: '100%', label: 'Privacy First', icon: Shield },
          ].map((stat, index) => (
            <div key={index} className="glass rounded-2xl p-6">
              <stat.icon className="w-8 h-8 mx-auto mb-4 text-blue-400" />
              <div className="text-4xl font-bold gradient-text">{stat.value}</div>
              <div className="text-muted-foreground mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      <a href="#features" className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <ChevronDown className="w-8 h-8 text-muted-foreground" />
      </a>
    </section>
  );
}

// Features Section
function FeaturesSection() {
  const features = [
    {
      icon: Eye,
      title: 'Invisible Monitoring',
      description: 'Works silently in the background. No interruptions, no pop-ups, just continuous awareness.',
      color: 'from-blue-500 to-blue-600'
    },
    {
      icon: Brain,
      title: '5 Cognitive States',
      description: 'Detects Optimal Flow, Managed Pressure, High Stress, Cognitive Fatigue, and Burnout Risk.',
      color: 'from-cyan-500 to-cyan-600'
    },
    {
      icon: Lock,
      title: 'Privacy First',
      description: 'All processing happens locally. No keystroke content is ever stored or transmitted.',
      color: 'from-purple-500 to-purple-600'
    },
    {
      icon: Zap,
      title: 'Real-time Alerts',
      description: 'Get timely interventions during natural transition points, not during deep work.',
      color: 'from-yellow-500 to-orange-500'
    },
    {
      icon: Activity,
      title: 'Pattern Learning',
      description: 'Adapts to your unique typing patterns and improves accuracy over time.',
      color: 'from-green-500 to-emerald-600'
    },
    {
      icon: Cpu,
      title: 'ML-Powered',
      description: 'Advanced machine learning models trained on validated datasets like EmoSurv.',
      color: 'from-pink-500 to-rose-600'
    }
  ];

  return (
    <section id="features" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Features</Badge>
          <h2 className="text-4xl font-bold mb-4">Why Choose <span className="gradient-text">Subl</span>?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Unlike intrusive monitoring tools or forgetful wellness apps, Subl occupies a unique intersection: 
            invisible until needed, intelligent without being intrusive, preventive rather than evaluative.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:scale-105 transition-all duration-300 border-border/50 bg-card/50">
              <CardHeader>
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:animate-pulse-glow`}>
                  <feature.icon className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-xl">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

// How It Works Section
function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Data Collection',
      description: 'Captures typing dynamics: key hold times, flight times, and rhythm patterns in real-time.',
      icon: Keyboard
    },
    {
      number: '02',
      title: 'Pattern Analysis',
      description: 'ML models analyze 12+ behavioral features to detect deviations from your baseline.',
      icon: BarChart3
    },
    {
      number: '03',
      title: 'State Detection',
      description: 'Identifies cognitive states: Normal, Calm, High Stress, Angry, or Sad with 77% accuracy.',
      icon: Brain
    },
    {
      number: '04',
      title: 'Smart Interventions',
      description: 'Delivers contextual suggestions: breathing exercises, break reminders, or session insights.',
      icon: Heart
    }
  ];

  return (
    <section id="how-it-works" className="py-24 relative bg-gradient-to-b from-transparent to-blue-500/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">How It Works</Badge>
          <h2 className="text-4xl font-bold mb-4">The Science Behind <span className="gradient-text">Subl</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our system listens to the hidden language of your fingers—hesitation before complex problems, 
            accelerated pace during deadlines, fragmented rhythm of distraction.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="glass rounded-2xl p-6 h-full">
                <div className="text-6xl font-bold text-muted-foreground/20 mb-4">{step.number}</div>
                <step.icon className="w-10 h-10 text-blue-400 mb-4" />
                <h3 className="text-xl font-bold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-to-r from-blue-500 to-cyan-400" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Analysis Section
function AnalysisSection() {
  const insights = [
    {
      title: 'Muscle Tension Phenomenon',
      description: 'Hold time (D1U1) increases under stress, indicating muscle tension. The stressed person presses keys harder and longer.',
      metric: '+2.4%',
      metricLabel: 'Hold Time Increase',
      image: '/images/01_emotion_analysis.png'
    },
    {
      title: 'Broken Rhythm Pattern',
      description: 'Flight time variance changes dramatically under stress. The rhythm becomes irregular with unpredictable pauses.',
      metric: 'Variable',
      metricLabel: 'Rhythm Instability',
      image: '/images/04_advanced_patterns.png'
    },
    {
      title: 'Error Correction Patterns',
      description: 'Delete key usage and left arrow navigation patterns reveal cognitive load and error-prone states.',
      metric: '-18.6%',
      metricLabel: 'Delete Usage Change',
      image: '/images/03_error_patterns.png'
    }
  ];

  return (
    <section id="analysis" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Data Analysis</Badge>
          <h2 className="text-4xl font-bold mb-4">Key <span className="gradient-text">Insights</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our analysis of typing behavior datasets reveals measurable relationships between 
            keystroke patterns and emotional states.
          </p>
        </div>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-8">
            <TabsTrigger value="insights">Key Insights</TabsTrigger>
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {insights.map((insight, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <Card className="cursor-pointer hover:scale-105 transition-all duration-300 border-border/50 bg-card/50 overflow-hidden">
                      <div className="h-48 overflow-hidden">
                        <img 
                          src={insight.image} 
                          alt={insight.title}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                      <CardHeader>
                        <div className="flex items-center justify-between mb-2">
                          <CardTitle className="text-lg">{insight.title}</CardTitle>
                          <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                            {insight.metric}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </CardHeader>
                    </Card>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>{insight.title}</DialogTitle>
                    </DialogHeader>
                    <img src={insight.image} alt={insight.title} className="w-full rounded-lg" />
                    <p className="text-muted-foreground mt-4">{insight.description}</p>
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="visualizations">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { src: '/images/01_emotion_analysis.png', title: 'Emotion Analysis' },
                { src: '/images/02_correlation_analysis.png', title: 'Correlation Analysis' },
                { src: '/images/03_error_patterns.png', title: 'Error Patterns' },
                { src: '/images/04_advanced_patterns.png', title: 'Advanced Patterns' },
                { src: '/images/05_distributions.png', title: 'Distribution Analysis' },
                { src: '/images/06_model_analysis.png', title: 'Model Performance' },
                { src: '/images/07_comprehensive_dashboard.png', title: 'Comprehensive Dashboard' },
                { src: '/images/08_realtime_simulation.png', title: 'Real-time Simulation' },
              ].map((viz, index) => (
                <Dialog key={index}>
                  <DialogTrigger asChild>
                    <div className="cursor-pointer overflow-hidden rounded-xl border border-border/50 hover:border-blue-500/50 transition-all">
                      <img 
                        src={viz.src} 
                        alt={viz.title}
                        className="w-full hover:scale-105 transition-transform duration-500"
                      />
                      <div className="p-4 bg-card/50">
                        <p className="font-medium">{viz.title}</p>
                      </div>
                    </div>
                  </DialogTrigger>
                  <DialogContent className="max-w-5xl">
                    <DialogHeader>
                      <DialogTitle>{viz.title}</DialogTitle>
                    </DialogHeader>
                    <img src={viz.src} alt={viz.title} className="w-full rounded-lg" />
                  </DialogContent>
                </Dialog>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

// Demo Section
function DemoSection() {
  const [isTyping, setIsTyping] = useState(false);
  const [stressLevel, setStressLevel] = useState(25);
  const [detectedState, setDetectedState] = useState('Normal');
  const [keyCount, setKeyCount] = useState(0);
  const [holdTime, setHoldTime] = useState(100);
  const [flightTime, setFlightTime] = useState(300);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startSimulation = () => {
    setIsTyping(true);
    setKeyCount(0);
    intervalRef.current = setInterval(() => {
      setKeyCount(prev => prev + Math.floor(Math.random() * 5) + 1);
      setHoldTime(95 + Math.random() * 20);
      setFlightTime(280 + Math.random() * 50);
      
      // Simulate stress detection
      if (keyCount > 50 && keyCount < 150) {
        setStressLevel(35 + Math.random() * 15);
        setDetectedState('Slightly Elevated');
      } else if (keyCount >= 150) {
        setStressLevel(65 + Math.random() * 20);
        setDetectedState('High Stress');
      }
    }, 200);
  };

  const stopSimulation = () => {
    setIsTyping(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const resetSimulation = () => {
    stopSimulation();
    setStressLevel(25);
    setDetectedState('Normal');
    setKeyCount(0);
    setHoldTime(100);
    setFlightTime(300);
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const getStressColor = (level: number) => {
    if (level < 40) return 'bg-green-500';
    if (level < 70) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getStateIcon = (state: string) => {
    if (state === 'Normal') return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (state === 'Slightly Elevated') return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    return <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <section id="demo" className="py-24 relative bg-gradient-to-b from-blue-500/5 to-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge variant="secondary" className="mb-4">Live Demo</Badge>
          <h2 className="text-4xl font-bold mb-4">Experience <span className="gradient-text">Subl</span></h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See how Subl detects stress in real-time through typing pattern analysis.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Typing Simulator */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Keyboard className="w-5 h-5" />
                Typing Simulator
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg min-h-[120px] font-mono text-sm">
                  {isTyping ? (
                    <span className="typing-effect">
                      The quick brown fox jumps over the lazy dog. 
                      Programming is both an art and a science...
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Click "Start Typing" to begin simulation...</span>
                  )}
                </div>

                <div className="flex gap-2">
                  {!isTyping ? (
                    <Button onClick={startSimulation} className="flex-1 bg-gradient-to-r from-blue-500 to-cyan-400">
                      <Play className="w-4 h-4 mr-2" />
                      Start Typing
                    </Button>
                  ) : (
                    <Button onClick={stopSimulation} variant="outline" className="flex-1">
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  <Button onClick={resetSimulation} variant="outline">
                    <RotateCcw className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Metrics */}
          <Card className="border-border/50 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Real-time Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stress Level */}
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Stress Level</span>
                    <span className="text-sm font-bold">{stressLevel.toFixed(0)}%</span>
                  </div>
                  <Progress value={stressLevel} className="h-3">
                    <div className={`h-full transition-all duration-300 ${getStressColor(stressLevel)}`} 
                         style={{ width: `${stressLevel}%` }} />
                  </Progress>
                </div>

                {/* Detected State */}
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm text-muted-foreground">Detected State</span>
                  <div className="flex items-center gap-2">
                    {getStateIcon(detectedState)}
                    <span className={`font-bold ${
                      detectedState === 'Normal' ? 'text-green-500' :
                      detectedState === 'Slightly Elevated' ? 'text-yellow-500' : 'text-red-500'
                    }`}>{detectedState}</span>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-2xl font-bold gradient-text">{keyCount}</div>
                    <div className="text-xs text-muted-foreground">Keys Pressed</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-2xl font-bold gradient-text">{holdTime.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Avg Hold Time (ms)</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-2xl font-bold gradient-text">{flightTime.toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Avg Flight Time (ms)</div>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg text-center">
                    <div className="text-2xl font-bold gradient-text">{(60000/(holdTime+flightTime)).toFixed(0)}</div>
                    <div className="text-xs text-muted-foreground">Keys/Min</div>
                  </div>
                </div>

                {/* Alert */}
                {stressLevel > 60 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="w-5 h-5 text-red-500" />
                      <span className="font-bold text-red-500">Intervention Suggested</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      High stress detected. Consider taking a 5-minute break or try deep breathing exercises.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

// Footer
function Footer() {
  return (
    <footer className="py-12 border-t border-border/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold gradient-text">Subl</span>
            </div>
            <p className="text-muted-foreground max-w-md">
              Revolutionary AI that detects stress and cognitive states through typing patterns. 
              Protecting cognitive resources that enable meaningful work across careers, not just sprints.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#how-it-works" className="hover:text-foreground transition-colors">How It Works</a></li>
              <li><a href="#demo" className="hover:text-foreground transition-colors">Demo</a></li>
              <li><a href="#analysis" className="hover:text-foreground transition-colors">Analysis</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">About</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Research</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>
        
        <Separator className="mb-8" />
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            © 2025 Subl. All rights reserved. Built with AI-powered analysis.
          </p>
          <div className="flex gap-4">
            <Badge variant="outline" className="text-xs">
              <Lock className="w-3 h-3 mr-1" />
              Privacy First
            </Badge>
            <Badge variant="outline" className="text-xs">
              <Cpu className="w-3 h-3 mr-1" />
              ML Powered
            </Badge>
          </div>
        </div>
      </div>
    </footer>
  );
}

// Main App
function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navigation />
      <main>
        <HeroSection />
        <FeaturesSection />
        <HowItWorksSection />
        <AnalysisSection />
        <DemoSection />
      </main>
      <Footer />
    </div>
  );
}

export default App;
