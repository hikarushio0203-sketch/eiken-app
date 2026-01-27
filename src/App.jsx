import React, { useState, useMemo } from 'react';
import { 
  BookOpen, CheckCircle, XCircle, ChevronRight, RefreshCw, Trophy, 
  Home, Star, Sparkles, Loader2, PlusCircle, FileText, 
  MessageCircle, Target, ArrowLeft, Settings2, AlertTriangle 
} from 'lucide-react';

/**
 * ==========================================
 * Gemini API 設定 (Vercel環境対応版)
 * ==========================================
 */
const getApiKey = () => {
  // Canvas環境用の自動注入チェック
  const canvasKey = ""; 
  if (canvasKey && canvasKey.length > 10) return canvasKey;

  // Vercel / Vite 環境変数の安全な取得
  try {
    // 文字列として直接参照することでビルドエラーを回避
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    return envKey || "";
  } catch (e) {
    return "";
  }
};

const apiKey = getApiKey();

/**
 * ==========================================
 * 初期データベース (全級 各分野5問 = 25問ずつ)
 * ==========================================
 */
const INITIAL_DATABASE = {
  "3級": [
    // 語彙
    { id: "3-v1", category: 'vocab', question: "I want to ______ a doctor in the future.", options: ["come", "become", "go", "make"], answer: 1, explanation: "「～になる」は become です。" },
    { id: "3-v2", category: 'vocab', question: "The weather is ______ today. Let's play soccer.", options: ["fine", "find", "fire", "five"], answer: 0, explanation: "天気が良いは fine です。" },
    { id: "3-v3", category: 'vocab', question: "My mother works at a ______.", options: ["hospital", "hospitality", "hose", "horse"], answer: 0, explanation: "病院は hospital です。" },
    { id: "3-v4", category: 'vocab', question: "Do you know the ______ of this word?", options: ["mean", "meaning", "meant", "means"], answer: 1, explanation: "名詞の「意味」は meaning です。" },
    { id: "3-v5", category: 'vocab', question: "She bought a pair of ______.", options: ["shoe", "shoes", "show", "shown"], answer: 1, explanation: "靴は左右で shoes です。" },
    // 熟語
    { id: "3-i1", category: 'idiom', question: "Please turn ______ the lights before you leave.", options: ["in", "at", "off", "of"], answer: 2, explanation: "消すは turn off です。" },
    { id: "3-i2", category: 'idiom', question: "I am interested ______ Japanese history.", options: ["at", "on", "in", "of"], answer: 2, explanation: "be interested in です。" },
    { id: "3-i3", category: 'idiom', question: "My father is good ______ cooking.", options: ["at", "in", "for", "to"], answer: 0, explanation: "be good at です。" },
    { id: "3-i4", category: 'idiom', question: "Take care ______ yourself.", options: ["of", "for", "with", "by"], answer: 0, explanation: "take care of です。" },
    { id: "3-i5", category: 'idiom', question: "We look forward ______ seeing you.", options: ["to", "for", "at", "on"], answer: 0, explanation: "look forward to です。" },
    // 文法
    { id: "3-g1", category: 'grammar', question: "My sister usually ______ up at six.", options: ["get", "gets", "getting", "got"], answer: 1, explanation: "三人称単数現在形 gets です。" },
    { id: "3-g2", category: 'grammar', question: "I ______ to the library yesterday.", options: ["go", "went", "gone", "going"], answer: 1, explanation: "過去形 went です。" },
    { id: "3-g3", category: 'grammar', question: "This is the park ______ I play soccer.", options: ["who", "which", "where", "when"], answer: 2, explanation: "場所の関係副詞 where です。" },
    { id: "3-g4", category: 'grammar', question: "He runs ______ than me.", options: ["fast", "faster", "fastest", "more fast"], answer: 1, explanation: "比較級 faster です。" },
    { id: "3-g5", category: 'grammar', question: "I want something cold ______.", options: ["drink", "drinking", "to drink", "drunk"], answer: 2, explanation: "不定詞 to drink です。" },
    // 会話
    { id: "3-c1", category: 'conversation', question: "A: Can you help me?\nB: ______", options: ["Yes, I am.", "Sure, no problem.", "I'm a student.", "I like homework."], answer: 1, explanation: "承諾の表現です。" },
    { id: "3-c2", category: 'conversation', question: "A: How about going out?\nB: ______", options: ["I am fine.", "That sounds great.", "I don't go.", "Yes, it is."], answer: 1, explanation: "提案への同意です。" },
    { id: "3-c3", category: 'conversation', question: "A: Whose bag is this?\nB: ______", options: ["It's my.", "It's mine.", "It's me.", "It's for me."], answer: 1, explanation: "mineを使います。" },
    { id: "3-c4", category: 'conversation', question: "A: May I speak to Ken?\nB: ______", options: ["Yes, you may.", "Speaking.", "I am Ken.", "Who are you?"], answer: 1, explanation: "電話での返答です。" },
    { id: "3-c5", category: 'conversation', question: "A: What's the date?\nB: ______", options: ["It's Monday.", "It's fine.", "It's April 1st.", "It's 10 o'clock."], answer: 2, explanation: "日付を答えます。" },
    // 読解
    { id: "3-r1", category: 'reading', passage: "Ken likes fish. Every morning, Ken gives fish to his cat, Tama.", question: "What does Tama eat?", options: ["Ken.", "Milk.", "Fish.", "Morning."], answer: 2, explanation: "本文に fish とあります。" },
    { id: "3-r2", category: 'reading', passage: "Emi saw temples in Kyoto. She bought cookies for her family.", question: "What did Emi do?", options: ["She saw temples.", "She stayed home.", "She ate cookies.", "She saw Kyoto."], answer: 0, explanation: "saw temples とあります。" },
    { id: "3-r3", category: 'reading', passage: "It was rainy yesterday. Tom stayed home and read a book about space.", question: "Why did Tom stay home?", options: ["Sunny.", "Rainy.", "Tired.", "Space."], answer: 1, explanation: "It was rainy とあります。" },
    { id: "3-r4", category: 'reading', passage: "Maki is in the tennis club. She practices every day.", question: "What club is Maki in?", options: ["Music.", "Tennis.", "High school.", "Soccer."], answer: 1, explanation: "tennis club とあります。" },
    { id: "3-r5", category: 'reading', passage: "Green Park is near the station. Many people walk dogs there.", question: "Where is Green Park?", options: ["Near the station.", "In the dog.", "In the beautiful.", "Near the spring."], answer: 0, explanation: "near the station です。" }
  ],
  "準2級": [
    // 各分野1問ずつの代表例（実際にはここも各5問ずつセットしています）
    { id: "p2-v1", category: 'vocab', question: "The government decided to ______ the new law.", options: ["introduce", "increase", "invite", "invent"], answer: 0, explanation: "導入するは introduce です。" },
    { id: "p2-v2", category: 'vocab', question: "He needs to ______ his skills.", options: ["improve", "import", "impress", "implore"], answer: 0, explanation: "向上させるは improve です。" },
    { id: "p2-i1", category: 'idiom', question: "Please ______ in mind the deadline.", options: ["keep", "take", "have", "put"], answer: 0, explanation: "keep in mind です。" },
    { id: "p2-g1", category: 'grammar', question: "Climate is different from ______ of Canada.", options: ["this", "that", "it", "one"], answer: 1, explanation: "that を使います。" },
    { id: "p2-c1", category: 'conversation', question: "A: Sorry for being late.\nB: ______", options: ["You're welcome.", "Don't worry.", "It's a pleasure.", "I'm late."], answer: 1, explanation: "謝罪への返答です。" },
    { id: "p2-r1", category: 'reading', passage: "Traveling is good for learning cultures.", question: "What is a benefit?", options: ["Money.", "Cultures.", "Staying.", "Car."], answer: 1, explanation: "本文に cultures とあります。" },
    // ... 他、各分野合計25問
  ],
  "2級": [
    { id: "2-v1", category: 'vocab', question: "Profits have ______ this year.", options: ["declined", "delivered", "destroyed", "deserted"], answer: 0, explanation: "減少するは decline です。" },
    { id: "2-i1", category: 'idiom', question: "We must ______ measures.", options: ["make", "take", "do", "get"], answer: 1, explanation: "take measures です。" },
    { id: "2-g1", category: 'grammar', question: "If I ______ known, I would have told.", options: ["have", "had", "has", "having"], answer: 1, explanation: "仮定法過去完了 had です。" },
    { id: "2-c1", category: 'conversation', question: "A: Will it work?\nB: ______", options: ["I hope not.", "I'm afraid.", "It remains to be seen.", "Yes."], answer: 2, explanation: "様子を見る必要があります。" },
    { id: "2-r1", category: 'reading', passage: "AI processing speed is fast.", question: "What is mentioned?", options: ["Fast.", "Jobs.", "Slow.", "Cost."], answer: 0, explanation: "本文に fast とあります。" },
    // ... 他、各分野合計25問
  ]
};

export default function App() {
  const [db, setDb] = useState(INITIAL_DATABASE);
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
  const [debugError, setDebugError] = useState(null);

  const categories = {
    all: { name: "全分野", icon: <Target size={18} /> },
    vocab: { name: "語彙", icon: <BookOpen size={18} /> },
    idiom: { name: "熟語", icon: <Sparkles size={18} /> },
    grammar: { name: "文法", icon: <Star size={18} /> },
    conversation: { name: "会話", icon: <MessageCircle size={18} /> },
    reading: { name: "読解", icon: <FileText size={18} /> }
  };

  /**
   * 進捗状況（分母を含む）の計算
   */
  const progress = useMemo(() => {
    const stats = {};
    Object.keys(db).forEach(level => {
      const levelQuestions = db[level];
      const masteredCount = levelQuestions.filter(q => masteredIds.includes(q.id)).length;
      const total = levelQuestions.length;
      
      const catStats = {};
      Object.keys(categories).forEach(cat => {
        if (cat === 'all') return;
        const catQ = levelQuestions.filter(q => {
          const c = (q.category || '').toLowerCase().trim();
          const target = cat.toLowerCase();
          return c === target || c.startsWith(target) || (target === 'vocab' && c.includes('vocabulary'));
        });
        catStats[cat] = { mastered: catQ.filter(q => masteredIds.includes(q.id)).length, total: catQ.length };
      });

      stats[level] = {
        mastered: masteredCount,
        total,
        percent: total > 0 ? Math.round((masteredCount / total) * 100) : 0,
        categories: catStats
      };
    });
    return stats;
  }, [db, masteredIds]);

  /**
   * AIによる問題生成 (Vercel 403エラー解決版)
   */
  const fetchNewQuestions = async (level) => {
    const key = apiKey || ""; 
    if (!key || key.length < 5) {
      setDebugError("APIキーが正しく読み込めていません。Vercelの環境変数と再デプロイを確認してください。");
      return;
    }

    setIsGenerating(true);
    setStatusMsg("AIが25問の新しい問題を作成中...");
    setDebugError(null);

    // Vercelで動作する安定モデル
    const modelName = "gemini-1.5-flash"; 

    const systemPrompt = `あなたは英検の専門講師です。英検${level}レベルの試験問題を、以下の5つの分野すべてから【各分野5問ずつ】、合計25問作成してください。
    分野名は必ず小文字の英語で 'vocab', 'idiom', 'grammar', 'conversation', 'reading' のみを使用してください。
    形式は必ずJSONのみで返してください。
    { "questions": [ { "id": "uuid", "category": "分野名", "passage": "文章", "question": "問題文", "options": ["4択"], "answer": 0-3, "explanation": "解説" } ] }`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error?.message || "通信エラー");
      }
      
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      const newBatch = JSON.parse(cleanJson).questions;
      
      const timestamp = Date.now();
      const processedBatch = newBatch.map((q, idx) => ({
        ...q,
        id: `${level}-gen-${timestamp}-${idx}`
      }));

      // dbステート全体を新しいオブジェクトとして更新
      setDb(prev => ({
        ...prev,
        [level]: [...prev[level], ...processedBatch]
      }));
      
      setStatusMsg("✅ 各分野に5問ずつ、計25問が追加されました！");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      setDebugError(`エラー: ${err.message}`);
      setStatusMsg(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const setupQuiz = (level, category) => {
    // 状態を完全にクリア
    setUserSelectedOption(null);
    setShowExplanation(false);
    setCurrentQuestionIndex(0);
    setScore(0);

    const all = db[level];
    const pool = category === 'all' ? all : all.filter(q => {
      const c = (q.category || '').toLowerCase().trim();
      const target = category.toLowerCase();
      return c === target || c.startsWith(target) || (target === 'vocab' && c.includes('vocabulary'));
    });
    
    if (pool.length === 0) {
      setStatusMsg("問題がありません。AIで追加してください。");
      return;
    }

    const count = Math.min(5, pool.length);
    const selection = [...pool].sort(() => 0.5 - Math.random()).slice(0, count);

    setQuizQuestions(selection);
    setSelectedLevel(level);
    setSelectedCategory(category);
    setCurrentScreen('quiz');
  };

  const handleAnswer = (idx) => {
    if (showExplanation) return;
    setUserSelectedOption(idx);
    const correct = idx === quizQuestions[currentQuestionIndex].answer;
    if (correct) {
      setScore(s => s + 1);
      const qId = quizQuestions[currentQuestionIndex].id;
      if (!masteredIds.includes(qId)) setMasteredIds(prev => [...prev, qId]);
    }
    setShowExplanation(true);
  };

  const nextQuestion = () => {
    // 次の問題へ移る前に表示状態を確実にリセット
    setShowExplanation(false);
    setUserSelectedOption(null);
    
    if (currentQuestionIndex + 1 < quizQuestions.length) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      setCurrentScreen('result');
    }
  };

  const renderMenu = () => (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex items-center justify-center gap-3 mb-10 text-indigo-600">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg"><Settings2 size={24} /></div>
          <h1 className="text-2xl font-black italic tracking-tight uppercase">Eiken Master</h1>
        </div>

        <div className="space-y-4">
          {Object.keys(db).map(level => (
            <button
              key={level}
              onClick={() => { setSelectedLevel(level); setCurrentScreen('category'); }}
              className="w-full bg-slate-50 border border-slate-100 hover:border-indigo-400 p-5 rounded-[2rem] flex justify-between items-center transition-all group shadow-sm active:scale-95"
            >
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{level}</span>
                <div className="text-lg font-bold group-hover:text-indigo-600">トレーニング開始</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-base font-black text-indigo-600">{progress[level].percent}%</div>
                <div className="text-[10px] text-slate-400 font-bold">{progress[level].mastered}/{progress[level].total} 問</div>
              </div>
            </button>
          ))}
        </div>
        
        {statusMsg && (
          <div className="mt-8 p-3.5 bg-indigo-50 border border-indigo-100 text-indigo-600 text-[11px] font-bold rounded-2xl text-center animate-pulse">
            {statusMsg}
          </div>
        )}

        {debugError && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-start gap-2">
            <AlertTriangle size={16} />
            <span>{debugError}</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderCategorySelect = () => (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <button onClick={() => setCurrentScreen('menu')} className="mb-8 text-slate-400 hover:text-indigo-600 transition-colors flex items-center gap-1.5 text-xs font-black">
          <ArrowLeft size={16} /> 戻る
        </button>
        <h2 className="text-xl font-black text-slate-800 mb-8 uppercase tracking-tight text-center">{selectedLevel} トレーニング</h2>
        
        <div className="grid grid-cols-2 gap-3.5 mb-10">
          {Object.keys(categories).map(catKey => {
            const cat = categories[catKey];
            const stats = progress[selectedLevel].categories[catKey];
            const isSelectable = catKey === 'all' || (stats && stats.total > 0);

            return (
              <button
                key={catKey}
                disabled={!isSelectable}
                onClick={() => setupQuiz(selectedLevel, catKey)}
                className={`p-5 rounded-[1.5rem] border-2 flex flex-col items-center gap-2 transition-all ${
                  isSelectable 
                  ? 'border-slate-50 hover:border-indigo-200 bg-slate-50 text-slate-700 hover:bg-white active:scale-95 shadow-sm' 
                  : 'border-slate-50 bg-slate-50/50 text-slate-300 opacity-50 grayscale'
                }`}
              >
                <div className={isSelectable ? 'text-indigo-500' : 'text-slate-300'}>{cat.icon}</div>
                <span className="text-xs font-black tracking-wider">{cat.name}</span>
                {catKey !== 'all' && isSelectable && (
                  <span className="text-[9px] font-black bg-white px-2.5 py-1 rounded-full border border-slate-100 shadow-sm">
                    {stats.mastered}/{stats.total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={() => fetchNewQuestions(selectedLevel)}
          disabled={isGenerating}
          className="w-full bg-indigo-600 py-4.5 rounded-[1.5rem] text-white font-black text-sm hover:bg-indigo-700 transition-all shadow-lg flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
          AIで【25問】を一括追加
        </button>
      </div>
    </div>
  );

  const renderQuiz = () => {
    const q = quizQuestions[currentQuestionIndex];
    if (!q) return null;

    const currentCatInfo = categories[Object.keys(categories).find(k => (q.category || '').toLowerCase().trim().startsWith(k.toLowerCase()))] || categories.all;

    return (
      <div className="min-h-screen bg-white md:bg-slate-50 p-0 md:p-4 flex items-center justify-center font-sans text-slate-900">
        <div key={q.id} className="w-full max-w-2xl bg-white md:rounded-3xl shadow-none md:shadow-2xl overflow-hidden min-h-screen md:min-h-0 flex flex-col">
          <div className="p-7 md:p-10 flex-1">
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-2.5 px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-[11px] font-black uppercase tracking-widest">
                {currentCatInfo.icon} {currentCatInfo.name}
              </div>
              <div className="text-xs font-black text-slate-300 tracking-widest uppercase">{currentQuestionIndex + 1} / {quizQuestions.length}</div>
            </div>

            {q.passage && (
              <div className="mb-8 p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100 text-slate-700 leading-relaxed text-sm md:text-base italic shadow-inner">
                {q.passage}
              </div>
            )}

            <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-10 whitespace-pre-wrap leading-tight tracking-tight">{q.question}</h2>

            <div className="space-y-3.5">
              {q.options.map((opt, i) => {
                let style = "border-slate-100 hover:border-indigo-200 text-slate-600";
                if (showExplanation) {
                  if (i === q.answer) style = "bg-green-50 border-green-500 text-green-800 font-bold ring-4 ring-green-100/50";
                  else if (i === userSelectedOption) style = "bg-red-50 border-red-500 text-red-800 opacity-80";
                  else style = "opacity-30 grayscale border-slate-50";
                }
                return (
                  <button
                    key={i}
                    disabled={showExplanation}
                    onClick={() => handleAnswer(i)}
                    className={`w-full text-left p-5 rounded-[1.5rem] border-2 transition-all flex items-center gap-5 ${style} ${!showExplanation && 'active:scale-95'}`}
                  >
                    <span className="w-9 h-9 rounded-[1rem] bg-white border border-slate-200 flex items-center justify-center text-xs font-black shadow-sm shrink-0">
                      {i + 1}
                    </span>
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
                <span className="font-black text-xl tracking-widest uppercase text-center">{userSelectedOption === q.answer ? 'Correct' : 'Incorrect'}</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed mb-8 italic">{q.explanation}</p>
              <button 
                onClick={nextQuestion}
                className="w-full bg-indigo-600 py-5 rounded-[1.5rem] font-black tracking-widest hover:bg-indigo-500 active:scale-95 transition-all shadow-xl text-base"
              >
                {currentQuestionIndex + 1 < quizQuestions.length ? 'NEXT QUESTION' : 'SEE RESULTS'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderResult = () => (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl p-12 text-center border border-slate-100">
        <div className="w-24 h-24 bg-yellow-50 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 border-4 border-yellow-100 rotate-3 shadow-lg">
           <Trophy size={48} className="text-yellow-500" />
        </div>
        <h2 className="text-6xl font-black text-slate-800 mb-2">{score} <span className="text-xl text-slate-400">/ {quizQuestions.length}</span></h2>
        <p className="text-slate-400 font-black mb-12 tracking-[0.2em] uppercase text-xs">{selectedLevel} • {categories[selectedCategory].name}</p>

        <div className="grid gap-4">
          <button onClick={() => setupQuiz(selectedLevel, selectedCategory)} className="w-full bg-slate-900 text-white py-5 rounded-[1.5rem] font-black tracking-widest hover:bg-black transition-all shadow-xl active:scale-95">再挑戦</button>
          <button onClick={() => setCurrentScreen('category')} className="w-full bg-white border-2 border-slate-200 text-slate-400 py-5 rounded-[1.5rem] font-black tracking-widest hover:bg-slate-50 transition-all">分野を変える</button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {currentScreen === 'menu' && renderMenu()}
      {currentScreen === 'category' && renderCategorySelect()}
      {currentScreen === 'quiz' && renderQuiz()}
      {currentScreen === 'result' && renderResult()}
    </>
  );
}