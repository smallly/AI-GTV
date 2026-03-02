/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { 
  Users, 
  Calendar, 
  Send, 
  Mic, 
  Plus, 
  ChevronRight,
  BrainCircuit,
  Dumbbell,
  FileText,
  Search,
  CheckCircle2,
  ChevronLeft,
  MoreHorizontal,
  Sparkles,
  ChevronDown,
  PhoneCall,
  History,
  MessageCircle,
  Keyboard,
  TrendingUp,
  LayoutGrid,
  Pause,
  Play,
  Menu,
  VolumeX,
  Upload,
  X
} from 'lucide-react';
import { User, Project, Plan, ChatMessage } from './types';
import { processNLU } from './services/nluService';
import { analyzeProject, getDrillFeedback, getChatResponse } from './services/geminiService';

type RecordingScenario = 'all_connected' | 'gtv_only' | 'unbound_gtv';

// --- Components ---

const ActionCard = ({ icon: Icon, label, onClick }: { icon: any, label: string, onClick: () => void }) => (
  <button 
    onClick={onClick}
    className="flex flex-col items-center gap-1.5 p-1 transition-all active:scale-95"
  >
    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500">
      <Icon size={20} />
    </div>
    <span className="text-[11px] font-medium text-slate-600">{label}</span>
  </button>
);

const GTVBindingCard = ({ onBind, isBound }: { onBind: () => void, isBound?: boolean }) => (
  <div className="bg-white rounded-xl p-5 border border-slate-200 mt-2">
    <div className="flex items-center gap-3 mb-3">
      <div className="w-10 h-10 rounded-xl overflow-hidden border border-slate-100 flex items-center justify-center bg-white">
        <img src="/liyeyun-logo.png" alt="立业云" className="w-full h-full object-contain" />
      </div>
      <div className="flex flex-col">
        <h4 className="font-semibold text-slate-900 text-base">立业云 GTV 请求授权</h4>
      </div>
    </div>
    <p className="text-sm text-slate-400 leading-relaxed mb-5">
      使用你的手机号查询、绑定立业云GTV账号，完成后即可为你查询立业云GTV相关数据，并提供对应服务。
    </p>
    <button
      onClick={onBind}
      disabled={isBound}
      className={`w-full py-3 font-semibold text-sm rounded-xl transition-colors ${
        isBound
          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
          : 'bg-[#2141d6]/10 text-[#2141d6] hover:bg-[#2141d6]/20'
      }`}
    >
      {isBound ? '已授权' : '去授权'}
    </button>
  </div>
);

const TranscriptionCard = () => (
  <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
      >
        <BrainCircuit size={20} />
      </motion.div>
    </div>
    <div className="flex-1">
      <p className="text-sm font-bold text-slate-800">录音转写上传中...</p>
      <p className="text-[11px] text-slate-400 mt-0.5">AI 正在为您解析对话内容，请稍候</p>
    </div>
  </div>
);

const HistorySidebar = ({ 
  isOpen, 
  onClose, 
  sessions, 
  onSelectSession 
}: { 
  isOpen: boolean, 
  onClose: () => void, 
  sessions: any[], 
  onSelectSession: (session: any) => void 
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[60]"
        />
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 bottom-0 w-[280px] bg-[#FAFAFA] z-[70] shadow-2xl flex flex-col"
        >
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h3 className="font-bold text-slate-800">历史会话</h3>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <Plus size={20} className="rotate-45" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
            {sessions.map((s) => (
              <button 
                key={s.id}
                onClick={() => {
                  onSelectSession(s);
                  onClose();
                }}
                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group"
              >
                <p className="text-sm font-medium text-slate-700 truncate group-hover:text-indigo-600">{s.title}</p>
                <p className="text-[10px] text-slate-400 mt-1">{s.date}</p>
              </button>
            ))}
          </div>
          <div className="p-4 border-t border-slate-50">
            <button 
              onClick={() => {
                onSelectSession({ messages: [] });
                onClose();
              }}
              className="w-full py-3 bg-indigo-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-100 flex items-center justify-center gap-2"
            >
              <Plus size={18} /> 新建会话
            </button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [isRecordingView, setIsRecordingView] = useState(false);
  const [isRecordingActive, setIsRecordingActive] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [isProjectSelectionView, setIsProjectSelectionView] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const [visibleProjectCount, setVisibleProjectCount] = useState(10);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDrilling, setIsDrilling] = useState(false);
  const [currentDrillProject, setCurrentDrillProject] = useState<Project | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isBindingView, setIsBindingView] = useState(false);
  const [bindingPhone, setBindingPhone] = useState('');
  const [bindingSmsCode, setBindingSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [isBindingLoading, setIsBindingLoading] = useState(false);
  const [isBindingError, setIsBindingError] = useState(false);
  const [isBindingDemo, setIsBindingDemo] = useState(false);
  const [isScenarioPickerOpen, setIsScenarioPickerOpen] = useState(false);
  const [recordingScenario, setRecordingScenario] = useState<RecordingScenario>('all_connected');
  const [sessions, setSessions] = useState<{id: string, title: string, date: string, messages: ChatMessage[]}[]>([
    {
      id: '1',
      title: '关于芯动科技的拜访计划',
      date: '2024-02-27',
      messages: [
        { role: 'user', content: '帮我制定一个拜访芯动科技的计划' },
        { role: 'assistant', content: '好的，根据芯动科技的情况，我建议...' }
      ]
    },
    {
      id: '2',
      title: '房源匹配咨询',
      date: '2024-02-26',
      messages: [
        { role: 'user', content: '新余高新区有合适的厂房吗？' },
        { role: 'assistant', content: '有的，目前有以下几个推荐...' }
      ]
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Mock Login on Mount
  useEffect(() => {
    const login = async () => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'broker@example.com' })
      });
      const data = await res.json();
      setUser(data.user);
      fetchData(data.user.id);
    };
    login();
  }, []);

  useEffect(() => {
    let interval: any;
    if (isRecordingActive && !isRecordingPaused) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecordingActive, isRecordingPaused]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchData = async (userId: number) => {
    const [pRes, plRes] = await Promise.all([
      fetch(`/api/projects?userId=${userId}`),
      fetch(`/api/plans?userId=${userId}`)
    ]);
    setProjects(await pRes.json());
    setPlans(await plRes.json());
  };

  const handleProjectScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50 && !isFetchingMore && projectSearch === '' && visibleProjectCount < projects.length) {
      setIsFetchingMore(true);
      setTimeout(() => {
        setVisibleProjectCount(prev => Math.min(prev + 10, projects.length));
        setIsFetchingMore(false);
      }, 1000);
    }
  };

  const closeProjectSelection = () => {
    setIsProjectSelectionView(false);
    setProjectSearch('');
  };

  const openRecordingScenarioPicker = () => {
    setIsScenarioPickerOpen(true);
  };

  const enterProjectSelectionWithScenario = (scenario: RecordingScenario) => {
    setRecordingScenario(scenario);
    setIsScenarioPickerOpen(false);
    setProjectSearch('');
    setVisibleProjectCount(10);
    setIsProjectSelectionView(true);
  };

  const handleSend = async (customInput?: string) => {
    const text = customInput || input;
    if (!text.trim() || !user) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      if (text === '开启AI录音') {
        openRecordingScenarioPicker();
        setLoading(false);
        return;
      }

      if (isDrilling) {
        const drillProjectInfo = currentDrillProject ? {
          name: currentDrillProject.name,
          industry: currentDrillProject.industry,
          area: currentDrillProject.area,
          region: currentDrillProject.region,
          type: currentDrillProject.type,
          clientName: currentDrillProject.client_name,
          stage: currentDrillProject.stage,
          remarks: currentDrillProject.remarks
        } : undefined;
        
        const content = await getChatResponse([...messages, userMsg], true, drillProjectInfo);
        setMessages(prev => [...prev, { role: 'assistant', content: content || "抱歉，我暂时无法回应。", type: 'drill' }]);
        setLoading(false);
        return;
      }

      const nlu = await processNLU(text, { currentTab: 'chat' });
      
      // Check for GTV binding requirement
      if ((nlu.intent === 'FOLLOW_UP_PLAN' || text.includes('拜访计划') || text.includes('跟进策略')) && !user.crm_bound) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: '您目前还未绑定立业云GTV账号，请先完成账号绑定，以便我们为您提供更好的服务。',
          type: 'gtv_binding'
        }]);
        setLoading(false);
        return;
      }
      
      if (nlu.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: nlu.response }]);
      } else if (nlu.intent === 'FOLLOW_UP_PLAN') {
        const projectInfo = nlu.params; 
        if (projectInfo && projectInfo.industry) {
          const analysis = await analyzeProject({
            name: projectInfo.name || "新项目",
            industry: projectInfo.industry,
            area: projectInfo.area || "未知面积",
            region: projectInfo.region || "未知区域",
            type: projectInfo.type || "厂房",
            clientName: projectInfo.clientName || "客户",
            stage: "初接触"
          });
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `已为你生成项目分析报告：\n\n**行业特征**: ${analysis.industryAnalysis}\n\n**建议策略**: ${analysis.strategy}`,
            type: 'analysis',
            metadata: analysis
          }]);

          const pRes = await fetch('/api/projects', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: user.id,
              name: projectInfo.name || "新项目",
              industry: projectInfo.industry,
              area: projectInfo.area || "未知面积",
              region: projectInfo.region || "未知区域",
              type: projectInfo.type || "厂房",
              client_name: projectInfo.clientName || "客户",
              stage: "未推进"
            })
          });
          const { id: projectId } = await pRes.json();
          
          for (const plan of analysis.plans) {
            await fetch('/api/plans', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                project_id: projectId,
                user_id: user.id,
                ...plan
              })
            });
          }
          fetchData(user.id);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: '请提供更多项目信息，例如行业、面积和区域，以便我为你制定计划。' }]);
        }
      } else if (nlu.intent === 'INFO_QUERY') {
        const query = nlu.params?.query || nlu.params?.name || text;
        const matchedProjects = projects.filter(p => 
          p.name.includes(query) || 
          p.industry.includes(query) || 
          p.client_name.includes(query)
        );

        if (matchedProjects.length > 0) {
          const projectInfo = matchedProjects.map(p => `
**项目名称**: ${p.name}
**行业领域**: ${p.industry}
**选址需求概要**:
- 意向面积: ${p.area}
- 意向区域: ${p.region}
- 载体类型: ${p.type}
- 当前阶段: ${p.stage}
- 客户姓名: ${p.client_name}
- 备注: ${p.remarks || '无'}
          `).join('\n---\n');
          
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `找到以下相关项目信息：\n${projectInfo}` 
          }]);
        } else {
          setMessages(prev => [...prev, { role: 'assistant', content: nlu.response || '抱歉，我没有找到相关的项目或信息。' }]);
        }
      } else if (nlu.intent === 'MATCH_PROPERTY') {
        const params = nlu.params || {};
        const hasRequirements = params.region || params.area || params.type;
        
        if (hasRequirements) {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `正在为您匹配符合以下需求的房源：\n- 区域：${params.region || '新余'}\n- 面积：${params.area || '不限'}\n- 类型：${params.type || '不限'}\n\n正在为您筛选数据库...` 
          }]);
          // Here you would normally call a property matching service
        } else {
          setMessages(prev => [...prev, { 
            role: 'assistant', 
            content: `目前我还没有了解到您的选址需求(例如:区域、面积、载体类型等)\n\n为了给您推荐最匹配的载体，请告诉我:\n\n1.您想找哪种类型的空间?\n例如:厂房、仓库、办公)\n\n2.优先考虑哪个区域?\n(初始默认为新余，您可指定其他城市/区县)\n\n3.对面积、层高、预算等是否有初步要求?\n\n我会根据您的需求，从数据库中为您筛选精准方案。期待为您服务!` 
          }]);
        }
      } else if (nlu.intent === 'SIMULATION_DRILL') {
        setIsDrilling(true);
        setMessages(prev => [...prev, { role: 'assistant', content: '好的，演练开始！我是某电子制造企业的采购经理，我们最近在寻找5000平的厂房。请问你们园区的供电和防静电措施怎么样？', type: 'drill' }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，我还没完全理解你的意思。你可以试着说“分析我的新项目”或者“开始演练”。' }]);
      }
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'assistant', content: '抱歉，处理请求时出错了。' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setToast(`已选择文件: ${file.name}，正在上传并分析...`);
      
      // Simulate analysis delay
      setTimeout(() => {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `文件 **${file.name}** 已上传成功并完成初步分析。\n\n**分析结论**: 该文件包含项目相关的关键信息。建议将其关联至对应项目以获取更深入的 AI 洞察。` 
        }]);
      }, 2000);
    }
  };

  const handleBindGTV = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Mock binding API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updatedUser = { ...user, crm_bound: true };
      setUser(updatedUser);
      setMessages(prev => [...prev, { role: 'assistant', content: '绑定成功！现在您可以查询您的拜访计划和跟进策略了。' }]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (smsCountdown <= 0) return;
    const timer = setInterval(() => setSmsCountdown(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [smsCountdown]);

  const handleSendSms = () => {
    if (bindingPhone.length !== 11 || smsCountdown > 0) return;
    setSmsSent(true);
    setSmsCountdown(60);
  };

  const handleConfirmBinding = () => {
    if (!user || bindingSmsCode.length === 0) return;
    setIsBindingDemo(true);
  };

  const handleBindSuccess = async () => {
    if (!user) return;
    setIsBindingDemo(false);
    setIsBindingLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setUser({ ...user, crm_bound: true });
    setRecordingScenario('all_connected');
    setIsBindingView(false);
    setBindingPhone('');
    setBindingSmsCode('');
    setSmsSent(false);
    setSmsCountdown(0);
    setIsBindingLoading(false);
    setToast('授权成功');
    setTimeout(() => setToast(null), 2000);
  };

  const handleBindFail = () => {
    setIsBindingDemo(false);
    setIsBindingError(true);
  };

  return (
    <div className="flex h-screen bg-[#FAFAFA] overflow-hidden font-sans">
      <AnimatePresence>
        {isProjectSelectionView && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 z-50 bg-[#FAFAFA] flex flex-col"
          >
            <header className="flex items-center justify-between px-4 py-4 border-b border-slate-50">
              <button onClick={closeProjectSelection} className="p-2 text-slate-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="font-bold text-slate-800">选择项目</h2>
              <div className="w-10" />
            </header>
            
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="搜索项目名称、编号或客户姓名"
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 shadow-sm transition-all"
                />
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto p-4 pt-0 space-y-1.5 custom-scrollbar"
              onScroll={handleProjectScroll}
            >
              <p className="text-[11px] text-slate-400 mb-1 px-1">请选择本次录音关联的项目，以便后续自动归档分析</p>
              {(projectSearch === '' 
                ? projects.slice(0, visibleProjectCount) 
                : projects.filter(p => 
                    p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                    p.client_name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                    `XM211023${p.id.toString().padStart(4, '0')}`.includes(projectSearch)
                  )
              ).map((p) => {
                const isCurrentRecording = isRecordingActive && selectedProjectId === p.id;
                return (
                  <button 
                    key={p.id}
                    onClick={() => {
                      if (isRecordingActive) {
                        if (selectedProjectId === p.id) {
                          setIsProjectSelectionView(false);
                          setIsRecordingView(true);
                        } else {
                          setToast('已有进行中的录音，请结束后再开启新录音');
                          setTimeout(() => setToast(null), 2000);
                        }
                      } else {
                        setSelectedProjectId(p.id);
                        setIsProjectSelectionView(false);
                        setProjectSearch('');
                        setVisibleProjectCount(10);
                        setIsRecordingActive(true);
                        setIsRecordingView(true);
                      }
                    }}
                    className={`group w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${
                      isCurrentRecording 
                        ? 'bg-indigo-50 border-indigo-200' 
                        : 'bg-white border-slate-200 shadow-sm active:bg-slate-50'
                    }`}
                  >
                    <div className="flex-1 min-w-0 mr-3 text-left">
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-slate-800 text-sm truncate">{p.name}</p>
                        {isCurrentRecording && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-indigo-600 text-[9px] text-white rounded-md animate-pulse">
                            <div className="w-1 h-1 bg-white rounded-full" />
                            录音中
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        XM211023{p.id.toString().padStart(4, '0')} · {p.client_name} · {p.stage}
                      </p>
                    </div>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      isCurrentRecording 
                        ? 'bg-indigo-600 text-white' 
                        : 'bg-indigo-50 text-indigo-400 group-active:bg-indigo-100'
                    }`}>
                      <Mic size={16} />
                    </div>
                  </button>
                );
              })}
              {isFetchingMore && (
                <div className="py-6 flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-[10px] text-slate-400">正在加载更多项目...</p>
                </div>
              )}
              {(projectSearch !== '' && projects.filter(p => 
                p.name.toLowerCase().includes(projectSearch.toLowerCase()) || 
                p.client_name.toLowerCase().includes(projectSearch.toLowerCase()) ||
                `XM211023${p.id.toString().padStart(4, '0')}`.includes(projectSearch)
              ).length === 0) && (
                <div className="py-12 text-center">
                  <p className="text-sm text-slate-400">未找到相关项目</p>
                </div>
              )}
            </div>

            <AnimatePresence>
              {recordingScenario === 'unbound_gtv' && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/35 backdrop-blur-sm z-20"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-30 shadow-2xl"
                  >
                    <div className="relative mb-3 min-h-10 flex items-center justify-center">
                      <button
                        onClick={closeProjectSelection}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                      <p className="text-base text-slate-500 text-center">未绑定GTV，无法开启A1录音</p>
                    </div>
                    <GTVBindingCard onBind={() => setIsBindingView(true)} isBound={false} />
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            <AnimatePresence>
              {recordingScenario === 'gtv_only' && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/35 backdrop-blur-sm z-20"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="absolute left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-30 shadow-2xl"
                  >
                    <div className="relative mb-3 min-h-10 flex items-center justify-center">
                      <button
                        onClick={closeProjectSelection}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                      >
                        <X size={18} />
                      </button>
                      <h3 className="text-[22px] leading-snug font-semibold text-slate-900 text-center px-10">
                        设备未连接，无法开启录音
                      </h3>
                    </div>
                    <p className="text-[14px] leading-7 text-slate-500 text-center mb-4">
                      设备未连接，无法在线开启录音。请先连接设备或长按设备录音键2秒抬手开始录音。
                    </p>
                    <div className="bg-slate-50 rounded-3xl p-4 mb-4 border border-slate-100">
                      <div className="h-14 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <div className="w-12 h-12 rounded-full border-[3px] border-blue-400 bg-white flex items-center justify-center text-blue-500">
                          <Mic size={20} />
                        </div>
                      </div>
                      <p className="text-center text-slate-500 text-[14px] leading-6">长按录音键2秒后抬手开始录音</p>
                    </div>
                    <button
                      onClick={closeProjectSelection}
                      className="w-full py-3 rounded-full bg-blue-50 text-blue-600 text-lg font-semibold"
                    >
                      确定
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {isRecordingView && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 bg-white flex flex-col"
          >
            <header className="flex items-center justify-between px-4 py-4 border-b border-slate-50">
              <button onClick={() => setIsRecordingView(false)} className="p-2 text-slate-600">
                <ChevronLeft size={24} />
              </button>
              <h2 className="font-bold text-slate-800">{isRecordingPaused ? '录音已暂停' : 'AI 录音中'}</h2>
              <div className="w-10" />
            </header>

            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <div className="relative mb-12">
                {/* Animated Waves */}
                {!isRecordingPaused && [1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      scale: [1, 1.5, 1],
                      opacity: [0.5, 0, 0.5],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                    className="absolute inset-0 bg-indigo-100 rounded-full"
                  />
                ))}
                <div className={`relative w-32 h-32 ${isRecordingPaused ? 'bg-slate-400' : 'bg-indigo-600'} rounded-full flex items-center justify-center shadow-xl shadow-indigo-200 transition-colors`}>
                  <Mic size={48} className="text-white" />
                </div>
              </div>

              <div className="text-4xl font-mono font-bold text-slate-800 mb-4">
                {formatTime(recordingTime)}
              </div>
              <p className="text-slate-400 text-sm">{isRecordingPaused ? '录音已暂停，点击下方按钮继续' : '正在为您实时记录对话内容...'}</p>
            </div>

            <footer className="p-8 pb-12 flex items-center justify-center gap-12">
              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => setIsRecordingPaused(!isRecordingPaused)}
                  className={`w-16 h-16 ${isRecordingPaused ? 'bg-indigo-600' : 'bg-slate-100'} rounded-full flex items-center justify-center ${isRecordingPaused ? 'text-white' : 'text-slate-600'} shadow-lg active:scale-90 transition-all`}
                >
                  {isRecordingPaused ? <Play size={28} fill="currentColor" /> : <Pause size={28} fill="currentColor" />}
                </button>
                <span className="text-xs text-slate-400 font-medium">{isRecordingPaused ? '继续' : '暂停'}</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <button 
                  onClick={() => {
                    const projectId = selectedProjectId;
                    setIsRecordingActive(false);
                    setIsRecordingPaused(false);
                    setIsRecordingView(false);
                    setRecordingTime(0);
                    
                    const transcriptionMsgId = Date.now();
                    setMessages(prev => [...prev, { 
                      id: transcriptionMsgId,
                      role: 'assistant', 
                      content: '', 
                      type: 'transcription' 
                    }]);

                    setTimeout(() => {
                      setMessages(prev => prev.map(m => 
                        m.id === transcriptionMsgId 
                          ? { 
                              ...m, 
                              type: 'chat', 
                              content: `录音已转写完成！以下是本次对话的摘要：\n\n**项目**: ${projects.find(p => p.id === projectId)?.name}\n**摘要**: 客户对园区配套设施表示满意，重点关注了电力供应稳定性。建议下次拜访时携带详细的配电方案。` 
                            } 
                          : m
                      ));
                    }, 3000);
                  }}
                  className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-red-100 active:scale-90 transition-transform"
                >
                  <div className="w-6 h-6 bg-white rounded-sm" />
                </button>
                <span className="text-xs text-slate-400 font-medium">结束</span>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>

      {/* GTV Binding View */}
      <AnimatePresence>
        {isBindingView && (
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50 flex flex-col bg-white"
          >
            <header className="flex items-center px-2 py-4">
              <button onClick={() => setIsBindingView(false)} className="p-2 text-slate-700">
                <ChevronLeft size={24} />
              </button>
            </header>

            <div className="flex-1 flex flex-col px-6 pt-4 pb-10">
              {/* Logo + 标题 */}
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-50 flex items-center justify-center">
                  <img src="/liyeyun-logo.png" alt="立业云" className="w-12 h-12 object-contain" />
                </div>
              </div>
              <h2 className="text-xl font-bold text-slate-900 text-center mb-1">绑定立业云 GTV</h2>
              <p className="text-sm text-slate-400 text-center mb-10">绑定后即可查询 GTV 相关数据并获得对应服务</p>

              {/* 输入区 */}
              <div className="space-y-4 mb-8">
                {/* 手机号 */}
                <input
                  type="tel"
                  maxLength={11}
                  value={bindingPhone}
                  onChange={(e) => setBindingPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="请输入手机号"
                  className="w-full bg-[#F5F5F5] rounded-full px-6 py-4 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
                />
                {/* 验证码（内联获取按钮） */}
                <div className="flex items-center bg-[#F5F5F5] rounded-full px-6 py-4">
                  <input
                    type="text"
                    value={bindingSmsCode}
                    onChange={(e) => setBindingSmsCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="请输入验证码"
                    className="flex-1 bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none tracking-widest"
                  />
                  <button
                    onClick={handleSendSms}
                    disabled={bindingPhone.length !== 11 || smsCountdown > 0}
                    className={`font-semibold text-sm whitespace-nowrap transition-colors disabled:cursor-not-allowed ${bindingPhone.length === 11 && smsCountdown === 0 ? 'text-[#165DFF]' : 'text-slate-400'}`}
                  >
                    {smsCountdown > 0 ? `${smsCountdown}s` : '获取验证码'}
                  </button>
                </div>
              </div>

              {/* 确认按钮 */}
              <button
                onClick={handleConfirmBinding}
                disabled={bindingPhone.length !== 11 || bindingSmsCode.length === 0 || isBindingLoading}
                className="w-full py-4 bg-[#2141d6] text-white font-bold text-base rounded-full disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed hover:bg-[#1935b8] active:scale-[0.98] transition-all"
              >
                {isBindingLoading ? '绑定中...' : '确认绑定'}
              </button>
            </div>

            {/* 演示选择弹窗 */}
            <AnimatePresence>
              {isBindingDemo && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"
                    onClick={() => setIsBindingDemo(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-6 right-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-20 shadow-xl"
                  >
                    <p className="text-xs text-slate-400 text-center mb-1">演示模式</p>
                    <p className="text-sm font-semibold text-slate-700 text-center mb-5">选择绑定结果</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleBindFail}
                        className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold text-sm rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        绑定失败
                      </button>
                      <button
                        onClick={handleBindSuccess}
                        className="flex-1 py-3 bg-[#2141d6] text-white font-semibold text-sm rounded-xl hover:bg-[#1935b8] transition-colors"
                      >
                        绑定成功
                      </button>
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>

            {/* 绑定失败弹窗 */}
            <AnimatePresence>
              {isBindingError && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/30 backdrop-blur-sm z-10"
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute left-6 right-6 top-1/2 -translate-y-1/2 bg-white rounded-2xl p-6 z-20 shadow-xl"
                  >
                    <p className="text-sm font-semibold text-slate-800 text-center mb-3">未找到账号</p>
                    <p className="text-sm text-slate-500 text-center leading-relaxed mb-6">
                      立业云GTV中未找到相关账号，无法完成关联，请联系人工客服。
                    </p>
                    <button
                      onClick={() => setIsBindingError(false)}
                      className="w-full py-3 bg-[#2141d6] text-white font-semibold text-sm rounded-xl hover:bg-[#1935b8] transition-colors"
                    >
                      知道了
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Mobile Header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-[#FAFAFA] sticky top-0 z-30 border-b border-slate-50">
          <button 
            onClick={() => {
              setMessages([]);
              setIsDrilling(false);
              setCurrentDrillProject(null);
            }} 
            className={`p-2 -ml-2 text-slate-600 transition-opacity ${messages.length <= 0 ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
          >
            <ChevronLeft size={24} />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm">
              <img src="https://picsum.photos/seed/landscape/200/200" alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="font-bold text-slate-800 text-sm flex items-center gap-1">
              AI金牌经纪人
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 text-slate-600"><VolumeX size={20} /></button>
            {user?.crm_bound && (
              <button
                onClick={() => setUser(u => u ? { ...u, crm_bound: false } : u)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 text-slate-500 text-[11px] font-medium hover:bg-red-50 hover:text-red-500 transition-colors"
              >
                <img src="/liyeyun-logo.png" className="w-3.5 h-3.5 object-contain" />
                已授权
              </button>
            )}
            <button className="p-2 text-slate-600" onClick={() => setIsHistoryOpen(true)}><Menu size={20} /></button>
          </div>
        </header>

        <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full overflow-hidden relative bg-[#FAFAFA]">
          {messages.length <= 0 ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
              {/* Hero Section */}
              <div className="relative pt-4 pb-2">
                <div className="max-w-[70%]">
                  <h2 className="text-2xl font-bold text-slate-900 leading-tight mb-3">
                    AI金牌经纪人，<br />您的随身军师！
                  </h2>
                  <div className="flex flex-wrap gap-4 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      产业选址行业垂直大模型
                    </span>
                  </div>
                </div>
                {/* 3D Avatar Placeholder */}
                <div className="absolute right-0 top-0 w-20 h-28 pointer-events-none">
                  <img 
                    src="https://picsum.photos/seed/workspace/400/600" 
                    alt="AI Broker" 
                    className="w-full h-full object-cover rounded-3xl opacity-90 shadow-2xl"
                    referrerPolicy="no-referrer"
                  />
                </div>
              </div>

              {/* Action Grid */}
              <div className="bg-white rounded-3xl p-3 shadow-sm border border-white">
                <div className="grid grid-cols-3 gap-1">
                  <ActionCard icon={FileText} label="制定拜访计划" onClick={() => handleSend('制定拜访计划')} />
                  <ActionCard icon={TrendingUp} label="生成跟进策略" onClick={() => handleSend('生成跟进策略')} />
                  <ActionCard icon={LayoutGrid} label="匹配房源" onClick={() => handleSend('匹配房源')} />
                </div>
              </div>

              {/* Expand Conversation */}
              <div className="flex justify-center py-2">
                <button 
                  onClick={() => {
                    if (sessions.length > 0) {
                      setMessages(sessions[0].messages);
                    } else {
                      setIsKeyboardMode(true);
                    }
                  }}
                  className="text-xs text-slate-400 flex items-center gap-1 hover:text-indigo-600 transition-colors"
                >
                  展开对话 <ChevronDown size={14} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col p-4 lg:p-6 overflow-hidden">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 lg:space-y-6 pr-1 lg:pr-4 custom-scrollbar">
                <AnimatePresence initial={false}>
                  {messages.map((msg, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`${msg.role === 'user' ? 'max-w-[85%] lg:max-w-[75%]' : 'max-w-full'} rounded-2xl ${
                        msg.type === 'transcription' ? '' : 'p-3 lg:p-4'
                      } ${
                        msg.role === 'user' 
                          ? 'bg-[#EEEFF1] text-slate-800 shadow-sm rounded-tr-none' 
                          : msg.type === 'drill'
                            ? 'bg-amber-50 border border-amber-100 text-amber-900 rounded-tl-none'
                            : msg.type === 'transcription'
                              ? ''
                              : 'bg-transparent text-slate-800'
                      }`}>
                        {msg.type === 'transcription' ? (
                          <TranscriptionCard />
                        ) : (
                          <div className="markdown-body prose prose-sm max-w-none leading-relaxed">
                            <Markdown>{msg.content}</Markdown>
                          </div>
                        )}
                        {msg.type === 'gtv_binding' && (
                          <GTVBindingCard onBind={() => setIsBindingView(true)} isBound={user?.crm_bound} />
                        )}
                        {msg.type === 'drill' && i === messages.length - 1 && (
                          <div className="mt-3 flex justify-end">
                            <button 
                              onClick={() => {
                                setIsDrilling(false);
                                setMessages(prev => [...prev, { role: 'assistant', content: '演练已结束。需要我为你刚才的表现提供反馈吗？' }]);
                              }}
                              className="text-[10px] bg-amber-200 text-amber-800 px-2 py-1 rounded-lg font-bold hover:bg-amber-300 transition-colors"
                            >
                              结束演练
                            </button>
                          </div>
                        )}
                        {msg.type === 'analysis' && msg.metadata && (
                          <div className="mt-4 pt-4 border-t border-slate-100">
                            <h4 className="font-bold text-sm mb-2 flex items-center gap-2">
                              <Calendar size={14} /> 推荐跟进计划
                            </h4>
                            <div className="space-y-3">
                              {msg.metadata.plans.map((p: any, pi: number) => (
                                <div key={pi} className="bg-slate-50 p-3 rounded-xl text-xs">
                                  <div className="flex justify-between font-bold text-slate-700 mb-1">
                                    <span>{p.time}</span>
                                    <span className="text-indigo-600">{p.action}</span>
                                  </div>
                                  <p className="text-slate-500">话题: {p.topic}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-100 p-3 lg:p-4 rounded-2xl rounded-tl-none shadow-sm">
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="p-4 bg-[#FAFAFA]">
            {/* Bottom Quick Actions */}
            <div className="flex gap-2 mb-3">
              <button
                onClick={openRecordingScenarioPicker}
                className="bg-white px-4 py-2 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-100 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <Mic size={14} className="text-indigo-500" /> 开启AI录音
              </button>
              <button
                onClick={() => handleSend('联系我们')}
                className="bg-white px-4 py-2 rounded-full text-xs font-medium text-slate-600 shadow-sm border border-slate-100 flex items-center gap-1.5 active:scale-95 transition-all"
              >
                <PhoneCall size={14} className="text-indigo-500" /> 联系我们
              </button>
            </div>

            {/* Main Input Button/Field */}
            <div className="bg-white border border-slate-100 rounded-full shadow-lg p-1 flex items-center gap-2 transition-all duration-300">
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                onChange={handleFileChange}
                accept="audio/*,video/*,.pdf,.doc,.docx,.txt"
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <Plus size={24} className="border border-slate-300 rounded-full p-0.5" />
              </button>
              
              <input 
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="发消息或按住说话..."
                className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-slate-800 py-2 text-sm selection:bg-indigo-100"
              />

              <button 
                onClick={() => handleSend()}
                className="p-2 text-slate-600 hover:text-indigo-600 transition-colors"
              >
                <Mic size={24} />
              </button>
            </div>
          </div>
        </div>
      </main>
      <AnimatePresence>
        {isScenarioPickerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsScenarioPickerOpen(false)}
              className="fixed inset-0 bg-black/35 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              className="fixed left-4 right-4 top-1/2 -translate-y-1/2 bg-white rounded-3xl p-5 z-[90] shadow-2xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900">选择录音场景</h3>
                <button
                  onClick={() => setIsScenarioPickerOpen(false)}
                  className="w-9 h-9 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center"
                >
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                <button
                  onClick={() => enterProjectSelectionWithScenario('all_connected')}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900">1. GTV、A1都已连接</p>
                  <p className="text-xs text-slate-500 mt-1">可直接进入项目列表并开启录音</p>
                </button>
                <button
                  onClick={() => enterProjectSelectionWithScenario('gtv_only')}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900">2. 已绑定GTV，且A1未连接</p>
                  <p className="text-xs text-slate-500 mt-1">在项目列表展示设备未连接提示</p>
                </button>
                <button
                  onClick={() => enterProjectSelectionWithScenario('unbound_gtv')}
                  className="w-full p-3 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 transition-colors"
                >
                  <p className="text-sm font-semibold text-slate-900">3. 未绑定GTV</p>
                  <p className="text-xs text-slate-500 mt-1">在项目列表展示GTV授权提示</p>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[100] px-4 py-2 bg-slate-800/90 text-white text-xs rounded-full shadow-xl backdrop-blur-sm whitespace-nowrap"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <HistorySidebar 
        isOpen={isHistoryOpen} 
        onClose={() => setIsHistoryOpen(false)} 
        sessions={sessions} 
        onSelectSession={(s) => setMessages(s.messages)} 
      />
    </div>
  );
}
