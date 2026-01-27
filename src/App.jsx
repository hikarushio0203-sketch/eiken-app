import React, { useState, useEffect, useMemo } from 'react';
import { 
  BookOpen, CheckCircle, XCircle, ChevronRight, RefreshCw, Trophy, 
  Home, Star, Sparkles, Loader2, PlusCircle, FileText, 
  MessageCircle, Target, ArrowLeft, Settings2, AlertTriangle, User
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithCustomToken, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

/**
 * ==========================================
 * 設定 & 初期化
 * ==========================================
 */
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// appIdのサニタイズ：スラッシュが含まれるとFirestoreのパスが壊れるため、英数字以外を除去
// これにより「Invalid document reference」エラーを解決します
const rawAppId = typeof __app_id !== 'undefined' ? __app_id : 'eiken-pro-app';
const appId = rawAppId.replace(/[^a-zA-Z0-9_-]/g, '_');

const getApiKey = () => {
  const canvasKey = ""; 
  if (canvasKey && canvasKey.length > 10) return canvasKey;
  try {
    // Vercelに設定した環境変数を読み込みます
    return import.meta.env.VITE_GEMINI_API_KEY || "";
  } catch (e) {
    return "";
  }
};
const apiKey = getApiKey();

// 全級 25問を完全に網羅した初期データ
const INITIAL_DATABASE = {
  "3級": [
    { id: "3-v1", category: 'vocab', question: "I want to ______ a doctor in the future.", options: ["come", "become", "go", "make"], answer: 1, explanation: "～になる、は become です。" },
    { id: "3-v2", category: 'vocab', question: "The sky is very ______ today.", options: ["fine", "find", "fire", "five"], answer: 0, explanation: "天気が良いは fine です。" },
    { id: "3-v3", category: 'vocab', question: "My mother works at a ______.", options: ["hospital", "hospitality", "hose", "horse"], answer: 0, explanation: "病院は hospital です。" },
    { id: "3-v4", category: 'vocab', question: "Do you know the ______ of this word?", options: ["mean", "meaning", "meant", "means"], answer: 1, explanation: "意味は meaning です。" },
    { id: "3-v5", category: 'vocab', question: "She bought a pair of ______.", options: ["shoe", "shoes", "show", "shown"], answer: 1, explanation: "靴(複数形)は shoes です。" },
    { id: "3-i1", category: 'idiom', question: "Please turn ______ the lights.", options: ["in", "at", "off", "of"], answer: 2, explanation: "消すは turn off です。" },
    { id: "3-i2", category: 'idiom', question: "I am interested ______ history.", options: ["at", "on", "in", "of"], answer: 2, explanation: "be interested in です。" },
    { id: "3-i3", category: 'idiom', question: "My father is good ______ cooking.", options: ["at", "in", "for", "to"], answer: 0, explanation: "be good at です。" },
    { id: "3-i4", category: 'idiom', question: "Take care ______ yourself.", options: ["of", "for", "with", "by"], answer: 0, explanation: "take care of です。" },
    { id: "3-i5", category: 'idiom', question: "We look forward ______ seeing you.", options: ["to", "for", "at", "on"], answer: 0, explanation: "look forward to です。" },
    { id: "3-g1", category: 'grammar', question: "My sister usually ______ up at six.", options: ["get", "gets", "getting", "got"], answer: 1, explanation: "三人称単数現在形 gets です。" },
    { id: "3-g2", category: 'grammar', question: "I ______ to the library yesterday.", options: ["go", "went", "gone", "going"], answer: 1, explanation: "過去形 went です。" },
    { id: "3-g3", category: 'grammar', question: "This is the park ______ I play soccer.", options: ["who", "which", "where", "when"], answer: 2, explanation: "場所の関係副詞 where です。" },
    { id: "3-g4", category: 'grammar', question: "He runs ______ than me.", options: ["fast", "faster", "fastest", "more fast"], answer: 1, explanation: "比較級 faster です。" },
    { id: "3-g5", category: 'grammar', question: "I want something cold ______.", options: ["drink", "drinking", "to drink", "drunk"], answer: 2, explanation: "不定詞 to drink です。" },
    { id: "3-c1", category: 'conversation', question: "A: Can you help me?\nB: ______", options: ["Yes, I am.", "Sure, no problem.", "I'm a student.", "I like homework."], answer: 1, explanation: "依頼への承諾です。" },
    { id: "3-c2", category: 'conversation', question: "A: How about going out?\nB: ______", options: ["I am fine.", "That sounds great.", "I don't go.", "Yes, it is."], answer: 1, explanation: "提案への同意です。" },
    { id: "3-c3", category: 'conversation', question: "A: Whose bag is this?\nB: ______", options: ["It's my.", "It's mine.", "It's me.", "It's for me."], answer: 1, explanation: "mineを使います。" },
    { id: "3-c4", category: 'conversation', question: "A: May I speak to Ken?\nB: ______", options: ["Yes, you may.", "Speaking.", "I am Ken.", "Who are you?"], answer: 1, explanation: "電話での返答表現です。" },
    { id: "3-c5", category: 'conversation', question: "A: What's the date?\nB: ______", options: ["It's Monday.", "It's fine.", "It's April 1st.", "It's 10 o'clock."], answer: 2, explanation: "日付を答えます。" },
    { id: "3-r1", category: 'reading', passage: "Ken likes fish. Every morning, he gives fish to his cat, Tama.", question: "What does Tama eat?", options: ["Ken.", "Milk.", "Fish.", "Morning."], answer: 2, explanation: "本文に fish とあります。" },
    { id: "3-r2", category: 'reading', passage: "Emi saw temples in Kyoto. She bought cookies for her family.", question: "What did Emi do?", options: ["She saw temples.", "She stayed home.", "She ate family.", "She saw Kyoto."], answer: 0, explanation: "saw temples とあります。" },
    { id: "3-r3", category: 'reading', passage: "It was rainy. Tom stayed home and read a book about space.", question: "Why did Tom stay home?", options: ["Sunny.", "Rainy.", "Tired.", "Space."], answer: 1, explanation: "It was rainy とあります。" },
    { id: "3-r4", category: 'reading', passage: "Maki is in the tennis club. She practices every day.", question: "What club is Maki in?", options: ["Music.", "Tennis.", "High school.", "Soccer."], answer: 1, explanation: "tennis club とあります。" },
    { id: "3-r5", category: 'reading', passage: "Green Park is near the station. People walk dogs there.", question: "Where is Green Park?", options: ["Near the station.", "In the dog.", "In the beautiful.", "Near the spring."], answer: 0, explanation: "near the station です。" }
  ],
  "準2級": [
    { id: "p2-v1", category: 'vocab', question: "Introduce the law.", options: ["introduce", "increase", "invite", "invent"], answer: 0, explanation: "導入する。" },
    { id: "p2-v2", category: 'vocab', question: "Improve skills.", options: ["improve", "import", "impress", "implore"], answer: 0, explanation: "向上させる。" },
    { id: "p2-v3", category: 'vocab', question: "Electric products.", options: ["electric", "election", "elegant", "element"], answer: 0, explanation: "電気の。" },
    { id: "p2-v4", category: 'vocab', question: "Broad knowledge.", options: ["broad", "board", "bored", "boat"], answer: 0, explanation: "幅広い。" },
    { id: "p2-v5", category: 'vocab', question: "Reduce pain.", options: ["reduce", "produce", "induce", "indict"], answer: 0, explanation: "和らげる。" },
    { id: "p2-i1", category: 'idiom', question: "Keep in mind.", options: ["in", "on", "at", "to"], answer: 0, explanation: "覚えておく。" },
    { id: "p2-i2", category: 'idiom', question: "Put off due to rain.", options: ["off", "on", "out", "away"], answer: 0, explanation: "延期する。" },
    { id: "p2-i3", category: 'idiom', question: "Run into a friend.", options: ["into", "onto", "out", "away"], answer: 0, explanation: "偶然出会う。" },
    { id: "p2-i4", category: 'idiom', question: "Deal with problems.", options: ["with", "to", "at", "by"], answer: 0, explanation: "対処する。" },
    { id: "p2-i5", category: 'idiom', question: "Show up at party.", options: ["up", "off", "on", "in"], answer: 0, explanation: "現れる。" },
    { id: "p2-g1", category: 'grammar', question: "That of Canada.", options: ["this", "that", "it", "one"], answer: 1, explanation: "代名詞 that。" },
    { id: "p2-g2", category: 'grammar', question: "To have been rich.", options: ["to be", "to have been", "being", "been"], answer: 1, explanation: "完了不定詞。" },
    { id: "p2-g3", category: 'grammar', question: "Typical of him.", options: ["of", "for", "to", "at"], answer: 0, explanation: "性質のof。" },
    { id: "p2-g4", category: 'grammar', question: "Unless you hurry.", options: ["hurry", "don't hurry", "will hurry", "hurried"], answer: 0, explanation: "接続詞unless。" },
    { id: "p2-g5", category: 'grammar', question: "Repairing my bike.", options: ["repair", "repaired", "repairing", "to repair"], answer: 1, explanation: "使役受動。" },
    { id: "p2-c1", category: 'conversation', question: "Sorry for late. ______", options: ["Don't worry.", "Welcome.", "Late.", "Pleasure."], answer: 0, explanation: "謝罪への返答。" },
    { id: "p2-c2", category: 'conversation', question: "Mind if I open? ______", options: ["No, go ahead.", "Yes, please.", "Open it.", "I mind."], answer: 0, explanation: "不許可でないならNo。" },
    { id: "p2-c3", category: 'conversation', question: "Way to the bank? ______", options: ["I'm new here.", "It's big.", "I'm a student.", "Go home."], answer: 0, explanation: "知らない場合。" },
    { id: "p2-c4", category: 'conversation', question: "What is your job? ______", options: ["I'm an engineer.", "Living here.", "I like work.", "By car."], answer: 0, explanation: "職業回答。" },
    { id: "p2-c5", category: 'conversation', question: "How is the steak? ______", options: ["Delicious.", "Fine.", "Beef.", "Yes."], answer: 0, explanation: "感想回答。" },
    { id: "p2-r1", category: 'reading', passage: "Travel is good.", question: "Benefit?", options: ["Culture.", "Money.", "Home.", "Car."], answer: 0, explanation: "文化習得。" },
    { id: "p2-r2", category: 'reading', passage: "Forests provide oxygen.", question: "Why important?", options: ["Oxygen.", "Cars.", "Computers.", "Humans."], answer: 0, explanation: "酸素供給。" },
    { id: "p2-r3", category: 'reading', passage: "Online is popular.", question: "Why popular?", options: ["Convenient.", "Fast.", "Cheap.", "Rain."], answer: 0, explanation: "便利だから。" },
    { id: "p2-r4", category: 'reading', passage: "Festivals have food.", question: "Feature?", options: ["Food.", "Tests.", "Rain.", "Old cars."], answer: 0, explanation: "食べ物。" },
    { id: "p2-r5", category: 'reading', passage: "Recycling helps.", question: "How help?", options: ["Reduce waste.", "Make waste.", "Buy paper.", "Clean."], answer: 0, explanation: "ゴミ削減。" }
  ],
  "2級": [
    { id: "2-v1", category: 'vocab', question: "Profits declined.", options: ["declined", "delivered", "destroyed", "deserted"], answer: 0, explanation: "減少する(decline)。" },
    { id: "2-v2", category: 'vocab', question: "Research into space.", options: ["research", "resource", "remind", "refund"], answer: 0, explanation: "研究(research)。" },
    { id: "2-v3", category: 'vocab', question: "Satellite ______ role.", options: ["vital", "violent", "vivid", "vocal"], answer: 0, explanation: "重要な役割(role)。" },
    { id: "2-v4", category: 'vocab', question: "Explore ______ sources.", options: ["energy", "egg", "end", "eat"], answer: 0, explanation: "エネルギー源。" },
    { id: "2-v5", category: 'vocab', question: "______ appropriate.", options: ["Hardly", "Hard", "Hardy", "Harden"], answer: 0, explanation: "ほとんど～ない。" },
    { id: "2-i1", category: 'idiom', question: "Take measures.", options: ["measures", "make", "do", "get"], answer: 0, explanation: "対策を講じる。" },
    { id: "2-i2", category: 'idiom', question: "Effect next month. ______", options: ["Come into", "Go out", "Make up", "Take off"], answer: 0, explanation: "施行される。" },
    { id: "2-i3", category: 'idiom', question: "Warn him ______ danger.", options: ["of", "at", "to", "for"], answer: 0, explanation: "warn A of B。" },
    { id: "2-i4", category: 'idiom', question: "Put up ______ noise.", options: ["with", "to", "on", "off"], answer: 0, explanation: "我慢する。" },
    { id: "2-i5", category: 'idiom', question: "Call ______ attention.", options: ["for", "to", "at", "on"], answer: 0, explanation: "要求する。" },
    { id: "2-g1", category: 'grammar', question: "If I ______ known.", options: ["had", "have", "has", "having"], answer: 0, explanation: "過去完了。" },
    { id: "2-g2", category: 'grammar', question: "______ being tired.", options: ["In spite of", "Although", "Because", "Unless"], answer: 0, explanation: "にもかかわらず。" },
    { id: "2-g3", category: 'grammar', question: "Stopped ______ able to leave.", options: ["were we", "we were", "we are", "are we"], answer: 0, explanation: "倒置。" },
    { id: "2-g4", category: 'grammar', question: "No sooner ______ arrived.", options: ["had he", "he has", "did he", "was he"], answer: 0, explanation: "～するとすぐに。" },
    { id: "2-g5", category: 'grammar', question: "Whatever he ______.", options: ["does", "do", "doing", "did"], answer: 0, explanation: "何をしたとしても。" },
    { id: "2-c1", category: 'conversation', question: "Will it work? ______", options: ["It remains to be seen.", "I hope so.", "I'm afraid.", "Yes."], answer: 0, explanation: "様子を見る必要がある。" },
    { id: "2-c2", category: 'conversation', question: "Tied up now. ______", options: ["Call back later.", "Tie it.", "Sorry.", "Late."], answer: 0, explanation: "忙しい時。" },
    { id: "2-c3", category: 'conversation', question: "Bring anything? ______", options: ["Just yourself.", "Yes.", "Nothing.", "Fine."], answer: 0, explanation: "手ぶらで。" },
    { id: "2-c4", category: 'conversation', question: "Movie? ______", options: ["Very moving.", "Found it.", "Didn't look.", "By bus."], answer: 0, explanation: "感想回答。" },
    { id: "2-c5", category: 'conversation', question: "Way? ______", options: ["Take subway.", "Long way.", "Going there.", "No."], answer: 0, explanation: "行き方。" },
    { id: "2-r1", category: 'reading', passage: "AI is fast but may replace jobs.", question: "Effect?", options: ["Replacing jobs.", "Fast.", "Changing.", "Cost."], answer: 0, explanation: "仕事代替。" },
    { id: "2-r2", category: 'reading', passage: "GPS leads safe travel.", question: "How used?", options: ["GPS.", "Space.", "Houses.", "Cars."], answer: 1, explanation: "GPS。" },
    { id: "2-r3", category: 'reading', passage: "Urbanization for jobs.", question: "Why move?", options: ["To find jobs.", "Heat.", "Nature.", "Avoid people."], answer: 0, explanation: "仕事のため。" },
    { id: "2-r4", category: 'reading', passage: "Diet prevents diseases.", question: "Benefit?", options: ["Prevents diseases.", "Causes.", "Expensive.", "Time."], answer: 0, explanation: "予防。" },
    { id: "2-r5", category: 'reading', passage: "Renewable storage.", question: "Challenge?", options: ["Storage issues.", "Interest.", "Warming.", "Workers."], answer: 0, explanation: "貯蔵問題。" }
  ]
};

export default function App() {
  const [user, setUser] = useState(null);
  const [dbState, setDbState] = useState(INITIAL_DATABASE);
  const [currentScreen, setCurrentScreen] = useState('menu'); 
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [userSelectedOption, setUserSelectedOption] = useState(null);
  const [masteredIds, setMasteredIds] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // カテゴリー定義（アイコンをコンポーネントとして格納）
  // React Childエラーを避けるため、アイコンをコンポーネント参照として定義
  const categoryConfig = {
    all: { name: "全分野", icon: Target },
    vocab: { name: "語彙", icon: BookOpen },
    idiom: { name: "熟語", icon: Sparkles },
    grammar: { name: "文法", icon: Star },
    conversation: { name: "会話", icon: MessageCircle },
    reading: { name: "読解", icon: FileText }
  };

  /**
   * Firebase Auth
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (e) {
        console.error("Auth failed", e);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  /**
   * Data Sync (Cloud Save)
   */
  useEffect(() => {
    if (!user) return;
    // docRefにパスの全階層を渡す。スラッシュが含まれないappIdを使用
    const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'studyData', 'state');
    
    const loadData = async () => {
      try {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const cloudData = snap.data();
          if (cloudData.db) setDbState(cloudData.db);
          if (cloudData.mastered) setMasteredIds(cloudData.mastered);
        }
      } catch (e) {
        console.error("Load failed", e);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [user]);

  const saveToCloud = async (newDb, newMastered) => {
    if (!user) return;
    try {
      const docRef = doc(db, 'artifacts', appId, 'users', user.uid, 'studyData', 'state');
      await setDoc(docRef, {
        db: newDb || dbState,
        mastered: newMastered || masteredIds,
        updatedAt: Date.now()
      }, { merge: true });
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const progress = useMemo(() => {
    const stats = {};
    Object.keys(dbState).forEach(level => {
      const levelQuestions = dbState[level];
      const masteredCount = levelQuestions.filter(q => masteredIds.includes(q.id)).length;
      const total = levelQuestions.length;
      const catStats = {};
      Object.keys(categoryConfig).forEach(cat => {
        if (cat === 'all') return;
        const catQ = levelQuestions.filter(q => (q.category || '').toLowerCase().trim().startsWith(cat.toLowerCase()));
        catStats[cat] = { mastered: catQ.filter(q => masteredIds.includes(q.id)).length, total: catQ.length };
      });
      stats[level] = { mastered: masteredCount, total, percent: total > 0 ? Math.round((masteredCount / total) * 100) : 0, categories: catStats };
    });
    return stats;
  }, [dbState, masteredIds]);

  const fetchNewQuestions = async (level) => {
    if (isGenerating || !user) return;
    setIsGenerating(true);
    setStatusMsg("AIが25問の新しい問題を作成中...");

    // 最新のGeminiモデルを指定し、エラーを防ぐため設定を安定版に固定
    const modelName = "gemini-1.5-flash"; 
    const systemPrompt = `You are an Eiken expert. Generate exactly 25 new Eiken ${level} exam questions. Provide 5 questions for each category: 'vocab', 'idiom', 'grammar', 'conversation', 'reading'. Format as JSON: { "questions": [ { "id": "unique", "category": "vocab/idiom/grammar/conversation/reading", "passage": "text", "question": "text", "options": ["A","B","C","D"], "answer": 0, "explanation": "Japanese explanation" } ] }`;

    try {
      // APIバージョンを v1beta にして最新の機能を使用
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "AI通信エラー");
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      
      const timestamp = Date.now();
      const processedBatch = parsed.questions.map((q, idx) => ({ ...q, id: `${level}-gen-${timestamp}-${idx}` }));
      const newDb = { ...dbState, [level]: [...dbState[level], ...processedBatch] };
      setDbState(newDb);
      await saveToCloud(newDb, null);
      setStatusMsg("成功！問題が追加されました。");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error(err);
      setStatusMsg(`エラー：${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const setupQuiz = (level, category) => {
    setUserSelectedOption(null);
    setShowExplanation(false);
    setCurrentQuestionIndex(0);
    setScore(0);
    const all = dbState[level];
    const pool = category === 'all' ? all : all.filter(q => (q.category || '').toLowerCase().trim().startsWith(category.toLowerCase()));
    if (pool.length === 0) return;
    const count = Math.min(5, pool.length);
    const selection = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
    setQuizQuestions(selection);
    setSelectedLevel(level);
    setSelectedCategory(category);
    setCurrentScreen('quiz');
  };

  const handleAnswer = async (idx) => {
    if (showExplanation) return;
    setUserSelectedOption(idx);
    const correct = idx === quizQuestions[currentQuestionIndex].answer;
    if (correct) {
      setScore(s => s + 1);
      const qId = quizQuestions[currentQuestionIndex].id;
      if (!masteredIds.includes(qId)) {
        const newMastered = [...masteredIds, qId];
        setMasteredIds(newMastered);
        await saveToCloud(null, newMastered);
      }
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    setShowExplanation(false);
    setUserSelectedOption(null);
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentScreen('result');
    }
  };

  if (!user || isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 text-center text-slate-800">
        <div className="animate-pulse">
          <Loader2 className="animate-spin mx-auto text-indigo-600 mb-4" size={40} />
          <p className="font-bold font-sans tracking-tight">データを同期中...</p>
        </div>
      </div>
    );
  }

  const renderMenu = () => (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center font-sans">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 relative overflow-hidden text-center text-slate-800">
        <div className="absolute top-0 right-0 p-4 opacity-30 text-[10px] font-mono"><User size={10} className="inline mr-1" />{user.uid.substring(0,8)}</div>
        <div className="flex items-center justify-center gap-3 mb-10 text-indigo-600">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg"><Settings2 size={24} /></div>
          <h1 className="text-2xl font-black tracking-tight italic uppercase">Eiken Pro</h1>
        </div>
        <div className="space-y-4 text-left">
          {Object.keys(dbState).map(level => (
            <button key={level} onClick={() => { setSelectedLevel(level); setCurrentScreen('category'); }} className="w-full bg-slate-50 border border-slate-100 hover:border-indigo-400 p-5 rounded-[2rem] flex justify-between items-center transition-all group shadow-sm active:scale-95">
              <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{level}</span>
                <div className="text-lg font-bold">学習開始</div>
              </div>
              <div className="flex flex-col items-end text-right">
                <div className="text-base font-black text-indigo-600">{progress[level].percent}%</div>
                <div className="text-[10px] text-slate-400 font-bold">{progress[level].mastered}/{progress[level].total} 問習得</div>
              </div>
            </button>
          ))}
        </div>
        {statusMsg && <div className="mt-8 p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold rounded-2xl animate-pulse">{statusMsg}</div>}
      </div>
    </div>
  );

  const renderCategorySelect = () => (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center font-sans text-slate-800">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 text-center">
        <button onClick={() => setCurrentScreen('menu')} className="mb-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-xs font-black"><ArrowLeft size={16} /> 戻る</button>
        <h2 className="text-xl font-black mb-8 uppercase tracking-tight">{selectedLevel} トレーニング</h2>
        <div className="grid grid-cols-2 gap-3 mb-10 text-slate-700">
          {Object.keys(categoryConfig).map(catKey => {
            const IconComp = categoryConfig[catKey].icon;
            const stats = progress[selectedLevel].categories[catKey];
            const isSelectable = catKey === 'all' || (stats && stats.total > 0);
            return (
              <button key={catKey} disabled={!isSelectable} onClick={() => setupQuiz(selectedLevel, catKey)} className={`p-5 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all ${isSelectable ? 'border-slate-50 hover:border-indigo-200 bg-slate-50 active:scale-95 shadow-sm' : 'border-slate-50 bg-slate-50/50 text-slate-300 opacity-50 grayscale cursor-not-allowed'}`}>
                <div className={isSelectable ? 'text-indigo-500' : 'text-slate-300'}><IconComp size={18} /></div>
                <span className="text-xs font-black tracking-wider">{categoryConfig[catKey].name}</span>
                {catKey !== 'all' && isSelectable && <span className="text-[9px] font-black bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">{stats.mastered}/{stats.total}</span>}
              </button>
            );
          })}
        </div>
        <button onClick={() => fetchNewQuestions(selectedLevel)} disabled={isGenerating} className="w-full bg-indigo-600 py-4.5 rounded-[1.5rem] text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95">{isGenerating ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}AIで【25問】を一括追加</button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const q = quizQuestions[currentQuestionIndex];
    if (!q) return null;
    const catKey = Object.keys(categoryConfig).find(k => (q.category || '').toLowerCase().trim().startsWith(k.toLowerCase())) || 'all';
    const IconComp = categoryConfig[catKey].icon;
    return (
      <div className="min-h-screen bg-white md:bg-slate-50 p-0 md:p-4 flex items-center justify-center font-sans text-slate-900">
        <div key={q.id} className="w-full max-w-2xl bg-white md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
          <div className="p-7 md:p-10 flex-1">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2.5 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black uppercase tracking-widest"><IconComp size={14} /> {categoryConfig[catKey].name}</div>
              <div className="text-xs font-black text-slate-300 tracking-widest uppercase">{currentQuestionIndex + 1} / {quizQuestions.length}</div>
            </div>
            {q.passage && <div className="mb-8 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-slate-700 leading-relaxed text-sm md:text-base italic shadow-inner">{q.passage}</div>}
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-10 whitespace-pre-wrap leading-tight">{q.question}</h2>
            <div className="space-y-3.5">
              {q.options.map((opt, i) => {
                let style = "border-slate-100 hover:border-indigo-200 text-slate-600";
                if (showExplanation) {
                  if (i === q.answer) style = "bg-green-50 border-green-500 text-green-800 font-bold ring-4 ring-green-100/50";
                  else if (i === userSelectedOption) style = "bg-red-50 border-red-500 text-red-800 opacity-80";
                  else style = "opacity-30 grayscale";
                }
                return (
                  <button key={i} disabled={showExplanation} onClick={() => handleAnswer(i)} className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all flex items-center gap-5 ${style} ${!showExplanation && 'active:scale-95'}`}>
                    <span className="w-9 h-9 rounded-[1rem] bg-white border border-slate-200 flex items-center justify-center text-xs font-black shadow-sm shrink-0">{i + 1}</span>
                    <span className="text-sm md:text-lg">{opt}</span>
                  </button>
                );
              })}
            </div>
          </div>
          {showExplanation && (
            <div className="p-7 md:p-10 bg-slate-900 text-white animate-in slide-in-from-bottom-full duration-500">
              <div className="flex items-center gap-3 mb-5">
                {userSelectedOption === q.answer ? <CheckCircle className="text-green-400" size={24} /> : <XCircle className="text-red-400" size={24} />}
                <span className="font-black text-xl tracking-widest uppercase">{userSelectedOption === q.answer ? '正解' : '不正解'}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 italic">{q.explanation}</p>
              <button onClick={nextQuestion} className="w-full bg-indigo-600 py-5 rounded-[1.5rem] font-black tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-xl text-base">{currentQuestionIndex + 1 < quizQuestions.length ? '次の問題へ' : '結果を見る'}</button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900 text-center">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 border border-slate-100">
        <div className="w-24 h-24 bg-yellow-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-yellow-100 rotate-3 shadow-lg"><Trophy size={48} className="text-yellow-500" /></div>
        <h2 className="text-6xl font-black text-slate-800 mb-2">{score} <span className="text-xl text-slate-400">/ {quizQuestions.length}</span></h2>
        <p className="text-slate-400 font-black mb-12 tracking-[0.2em] uppercase text-xs">{selectedLevel} • {categoryConfig[selectedCategory].name}</p>
        <div className="grid gap-4">
          <button onClick={() => setupQuiz(selectedLevel, selectedCategory)} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black tracking-widest hover:bg-black transition-all shadow-xl active:scale-95 text-center">再挑戦</button>
          <button onClick={() => setCurrentScreen('category')} className="w-full bg-white border-2 border-slate-200 text-slate-400 py-5 rounded-[1.5rem] font-black tracking-widest hover:bg-slate-50 transition-all text-center">分野を変える</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {currentScreen === 'menu' && renderMenu()}
      {currentScreen === 'category' && renderCategorySelect()}
      {currentScreen === 'quiz' && renderQuiz()}
      {currentScreen === 'result' && renderResult()}
    </div>
  );
}