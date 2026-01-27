import React, { useState, useMemo, useEffect } from 'react';
import { 
  BookOpen, CheckCircle, XCircle, ChevronRight, RefreshCw, Trophy, 
  Home, Star, Sparkles, Loader2, PlusCircle, FileText, 
  MessageCircle, Target, ArrowLeft, Settings2, AlertTriangle 
} from 'lucide-react';

// ==========================================
// Gemini API 設定
// ==========================================
// Vercelにデプロイする際は、Settings > Environment Variables で
// 「VITE_GEMINI_API_KEY」を登録し、必ず「Redeploy」を行ってください。
const getApiKey = () => {
  // Canvas環境用の自動注入チェック
  const canvasKey = ""; 
  if (canvasKey && canvasKey.length > 5) return canvasKey;

  // Vite/Vercel環境用の安全な取得方法
  try {
    // 文字列として直接参照することで、ビルド時の置換を促します
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey) return envKey;
  } catch (e) {
    // import.meta が使えない環境（エラー回避）
  }

  return "";
};

// ==========================================
// 初期データベース (全級 5分野 × 5問 = 各級25問スタート)
// ==========================================
const INITIAL_DATABASE = {
  "3級": [
    // 語彙
    { id: "3-v1", category: 'vocab', question: "I want to ______ a doctor in the future.", options: ["come", "become", "go", "make"], answer: 1, explanation: "「～になる」は become を使います。" },
    { id: "3-v2", category: 'vocab', question: "The weather is very ______ today.", options: ["fine", "find", "fire", "five"], answer: 0, explanation: "天気が良い(晴れ)は fine です。" },
    { id: "3-v3", category: 'vocab', question: "My father works in a ______.", options: ["hospital", "hospitality", "hose", "horse"], answer: 0, explanation: "働く場所として病院(hospital)が適切です。" },
    { id: "3-v4", category: 'vocab', question: "Do you know the ______ of this word?", options: ["mean", "meaning", "meant", "means"], answer: 1, explanation: "名詞の「意味」は meaning です。" },
    { id: "3-v5", category: 'vocab', question: "She bought a pair of ______.", options: ["shoe", "shoes", "show", "shown"], answer: 1, explanation: "靴は複数形 shoes で表します。" },
    // 熟語
    { id: "3-i1", category: 'idiom', question: "Please turn ______ the lights before you leave.", options: ["in", "at", "off", "of"], answer: 2, explanation: "消すは turn off です。" },
    { id: "3-i2", category: 'idiom', question: "I am interested ______ Japanese history.", options: ["at", "on", "in", "of"], answer: 2, explanation: "be interested in (～に興味がある) です。" },
    { id: "3-i3", category: 'idiom', question: "My father is good ______ cooking.", options: ["at", "in", "for", "to"], answer: 0, explanation: "be good at (～が得意だ) です。" },
    { id: "3-i4", category: 'idiom', question: "Take care ______ yourself.", options: ["of", "for", "with", "by"], answer: 0, explanation: "take care of で「～を大事にする」です。" },
    { id: "3-i5", category: 'idiom', question: "We are looking forward ______ seeing you.", options: ["to", "for", "at", "on"], answer: 0, explanation: "look forward to ～ing で「～を楽しみに待つ」です。" },
    // 文法
    { id: "3-g1", category: 'grammar', question: "My sister usually ______ up at six o'clock.", options: ["get", "gets", "getting", "got"], answer: 1, explanation: "三人称単数現在形です。" },
    { id: "3-g2", category: 'grammar', question: "I ______ to the library yesterday.", options: ["go", "went", "gone", "going"], answer: 1, explanation: "過去形 went です。" },
    { id: "3-g3", category: 'grammar', question: "This is the park ______ I play soccer.", options: ["who", "which", "where", "when"], answer: 2, explanation: "場所を説明する関係副詞 where です。" },
    { id: "3-g4", category: 'grammar', question: "He runs ______ than me.", options: ["fast", "faster", "fastest", "more fast"], answer: 1, explanation: "比較級 faster です。" },
    { id: "3-g5", category: 'grammar', question: "I want something cold ______.", options: ["drink", "drinking", "to drink", "drunk"], answer: 2, explanation: "不定詞の形容詞的用法です。" },
    // 会話
    { id: "3-c1", category: 'conversation', question: "A: Can you help me with this?\nB: ______", options: ["Yes, I am.", "Sure, no problem.", "I'm a student.", "I like homework."], answer: 1, explanation: "快諾する表現です。" },
    { id: "3-c2", category: 'conversation', question: "A: How about going to the park?\nB: ______", options: ["I am fine.", "That sounds great.", "I don't go.", "Yes, it is."], answer: 1, explanation: "提案に賛成する返事です。" },
    { id: "3-c3", category: 'conversation', question: "A: Whose bag is this?\nB: ______", options: ["It's my.", "It's mine.", "It's me.", "It's for me."], answer: 1, explanation: "「私のものです」は所有代名詞 mine です。" },
    { id: "3-c4", category: 'conversation', question: "A: May I speak to Ken?\nB: ______", options: ["Yes, you may.", "Speaking.", "I am Ken.", "Who are you?"], answer: 1, explanation: "電話で「私ですが」と言う時の表現です。" },
    { id: "3-c5", category: 'conversation', question: "A: What's the date today?\nB: ______", options: ["It's Monday.", "It's fine.", "It's April 1st.", "It's 10 o'clock."], answer: 2, explanation: "日付(date)を答えます。" },
    // 読解
    { id: "3-r1", category: 'reading', passage: "Ken has a cat named Tama. Tama likes fish. Every morning, Ken gives fish to Tama.", question: "What does Tama like?", options: ["Ken.", "Milk.", "Fish.", "Morning."], answer: 2, explanation: "本文に Tama likes fish とあります。" },
    { id: "3-r2", category: 'reading', passage: "Emi went to Kyoto last week. She saw many old temples. She bought some cookies for her family.", question: "What did Emi do in Kyoto?", options: ["She saw temples.", "She stayed home.", "She ate cookies.", "She saw Kyoto."], answer: 0, explanation: "She saw many old temples とあります。" },
    { id: "3-r3", category: 'reading', passage: "Yesterday was rainy. Tom stayed home and read a book. The book was about space travel.", question: "Why did Tom stay home?", options: ["Because it was sunny.", "Because it was rainy.", "Because he was tired.", "Because he liked space."], answer: 1, explanation: "雨だったから、とあります。" },
    { id: "3-r4", category: 'reading', passage: "Maki is a high school student. She belongs to the tennis club. She practices every day.", question: "What club is Maki in?", options: ["The music club.", "The tennis club.", "The high school.", "The soccer club."], answer: 1, explanation: "テニスクラブに所属しています。" },
    { id: "3-r5", category: 'reading', passage: "Green Park is near the station. Many people go there to walk their dogs. It is very beautiful in spring.", question: "Where is Green Park?", options: ["Near the station.", "In the dog.", "In the beautiful.", "Near the spring."], answer: 0, explanation: "駅の近く(near the station)です。" }
  ],
  "準2級": [
    // 語彙
    { id: "p2-v1", category: 'vocab', question: "The government decided to ______ the new law.", options: ["introduce", "increase", "invite", "invent"], answer: 0, explanation: "法律を「導入する(introduce)」です。" },
    { id: "p2-v2", category: 'vocab', question: "He needs to ______ his English skills for the job.", options: ["improve", "import", "impress", "implore"], answer: 0, explanation: "スキルを「向上させる(improve)」です。" },
    { id: "p2-v3", category: 'vocab', question: "The factory produces various ______ products.", options: ["electric", "election", "elegant", "element"], answer: 0, explanation: "「電気の(electric)」製品です。" },
    { id: "p2-v4", category: 'vocab', question: "He has a ______ knowledge of history.", options: ["broad", "board", "bored", "boat"], answer: 0, explanation: "「幅広い(broad)」知識です。" },
    { id: "p2-v5", category: 'vocab', question: "This medicine will ______ your pain.", options: ["reduce", "produce", "introduce", "induce"], answer: 0, explanation: "痛みを「和らげる(reduce)」です。" },
    // 熟語
    { id: "p2-i1", category: 'idiom', question: "Please ______ in mind that the deadline is tomorrow.", options: ["keep", "take", "have", "put"], answer: 0, explanation: "keep in mind (～を覚えておく) です。" },
    { id: "p2-i2", category: 'idiom', question: "The soccer game was ______ because of the heavy rain.", options: ["put off", "put on", "put out", "put in"], answer: 0, explanation: "put off (～を延期する) です。" },
    { id: "p2-i3", category: 'idiom', question: "I ran ______ an old friend at the station.", options: ["into", "onto", "out", "away"], answer: 0, explanation: "run into (～に偶然出会う) です。" },
    { id: "p2-i4", category: 'idiom', question: "We have to ______ with the problem immediately.", options: ["deal", "do", "make", "take"], answer: 0, explanation: "deal with (～に対処する) です。" },
    { id: "p2-i5", category: 'idiom', question: "He didn't show ______ at the party.", options: ["up", "off", "in", "down"], answer: 0, explanation: "show up (現れる) です。" },
    // 文法
    { id: "p2-g1", category: 'grammar', question: "The climate of Japan is different from ______ of Canada.", options: ["this", "that", "it", "one"], answer: 1, explanation: "比較対象の繰り返しを避ける that です。" },
    { id: "p2-g2", category: 'grammar', question: "He is believed ______ rich when he was young.", options: ["to be", "to have been", "being", "been"], answer: 1, explanation: "完了不定詞です。" },
    { id: "p2-g3", category: 'grammar', question: "It is typical ______ him to arrive late.", options: ["for", "of", "to", "with"], answer: 1, explanation: "It is ... of 人 to do です。" },
    { id: "p2-g4", category: 'grammar', question: "Unless you ______, you will miss the bus.", options: ["hurry", "don't hurry", "will hurry", "won't hurry"], answer: 0, explanation: "unlessの中は現在形です。" },
    { id: "p2-g5", category: 'grammar', question: "I had my bike ______ yesterday.", options: ["repair", "repaired", "repairing", "to repair"], answer: 1, explanation: "have + 物 + 過去分詞 です。" },
    // 会話
    { id: "p2-c1", category: 'conversation', question: "A: I'm sorry for being late.\nB: ______", options: ["You're welcome.", "Don't worry about it.", "It's a pleasure.", "I'm late, too."], answer: 1, explanation: "謝罪への返答です。" },
    { id: "p2-c2", category: 'conversation', question: "A: Do you mind if I open the window?\nB: ______", options: ["Yes, please.", "No, not at all.", "Yes, I mind.", "Open it."], answer: 1, explanation: "不許可でない場合は No です。" },
    { id: "p2-c3", category: 'conversation', question: "A: Could you tell me the way to the library?\nB: ______", options: ["I am a student.", "I'm new here myself.", "The library is big.", "Go home."], answer: 1, explanation: "知らない場合の丁寧な断り方です。" },
    { id: "p2-c4", category: 'conversation', question: "A: What do you do for a living?\nB: ______", options: ["I'm living here.", "I'm an engineer.", "I like living.", "By train."], answer: 1, explanation: "職業を尋ねる表現です。" },
    { id: "p2-c5", category: 'conversation', question: "A: How is the steak?\nB: ______", options: ["It's fine, thanks.", "It's delicious.", "I like beef.", "Yes, it is."], answer: 1, explanation: "感想を答えます。" },
    // 読解
    { id: "p2-r1", category: 'reading', passage: "Travel abroad is a good way to learn about different cultures.", question: "What is one benefit of traveling abroad?", options: ["Saving money.", "Learning about cultures.", "Staying at home.", "Buying a new car."], answer: 1, explanation: "本文に記載があります。" },
    { id: "p2-r2", category: 'reading', passage: "Forests provide oxygen and are homes for many animals. They are important for the environment.", question: "Why are forests important?", options: ["Because of cars.", "Because of oxygen.", "Because of humans.", "Because of computers."], answer: 1, explanation: "酸素を供給します。" },
    { id: "p2-r3", category: 'reading', passage: "Online shopping is popular because it is convenient. You can buy things without leaving home.", question: "Why is online shopping popular?", options: ["Because it's fast.", "Because it's convenient.", "Because it's cheap.", "Because of rain."], answer: 1, explanation: "便利だから、とあります。" },
    { id: "p2-r4", category: 'reading', passage: "Traditional Japanese festivals feature music and special food stalls. They are held throughout the year.", question: "What do festivals often feature?", options: ["Tests.", "Music and food stalls.", "Winter rain.", "Old cars."], answer: 1, explanation: "音楽と屋台が特徴です。" },
    { id: "p2-r5", category: 'reading', passage: "Recycling helps reduce waste. Many cities collect paper and plastic separately.", question: "How does recycling help?", options: ["It makes waste.", "It reduces waste.", "It cleans house.", "It buys paper."], answer: 1, explanation: "ゴミを減らすのに役立ちます。" }
  ],
  "2級": [
    // 語彙
    { id: "2-v1", category: 'vocab', question: "The company's profits have ______ significantly this year.", options: ["declined", "delivered", "destroyed", "deserted"], answer: 0, explanation: "利益が「減少する(decline)」です。" },
    { id: "2-v2", category: 'vocab', question: "The scientist is famous for his ______ into space travel.", options: ["research", "resource", "remind", "refund"], answer: 0, explanation: "宇宙旅行の「研究(research)」です。" },
    { id: "2-v3", category: 'vocab', question: "The artificial satellite plays a ______ role in global communication.", options: ["vital", "violent", "vivid", "vocal"], answer: 0, explanation: "「極めて重要な(vital)」役割です。" },
    { id: "2-v4", category: 'vocab', question: "We need to ______ alternative energy sources.", options: ["explore", "explain", "expect", "extend"], answer: 0, explanation: "代替エネルギー源を「探求する(explore)」です。" },
    { id: "2-v5", category: 'vocab', question: "His behavior was ______ appropriate.", options: ["hardly", "hard", "hardy", "harden"], answer: 0, explanation: "「ほとんど～ない(hardly)」否定です。" },
    // 熟語
    { id: "2-i1", category: 'idiom', question: "We must ______ measures to protect the environment.", options: ["make", "take", "do", "get"], answer: 1, explanation: "take measures (対策を講じる) です。" },
    { id: "2-i2", category: 'idiom', question: "The new policy will come into ______ next month.", options: ["effect", "affect", "effort", "afford"], answer: 0, explanation: "come into effect (施行される) です。" },
    { id: "2-i3", category: 'idiom', question: "I tried to ______ him of the danger, but he didn't listen.", options: ["warn", "warm", "worn", "win"], answer: 0, explanation: "warn A of B (AにBを警告する) です。" },
    { id: "2-i4", category: 'idiom', question: "I can't put ______ with this noise anymore.", options: ["up", "on", "in", "off"], answer: 0, explanation: "put up with (我慢する) です。" },
    { id: "2-i5", category: 'idiom', question: "This problem calls ______ immediate attention.", options: ["for", "to", "at", "on"], answer: 0, explanation: "call for (～を必要とする) です。" },
    // 文法
    { id: "2-g1", category: 'grammar', question: "If I ______ known the truth, I would have told you.", options: ["have", "had", "has", "having"], answer: 1, explanation: "仮定法過去完了です。" },
    { id: "2-g2", category: 'grammar', question: "______ being tired, he continued to work.", options: ["Although", "In spite of", "Because", "Unless"], answer: 1, explanation: "前置詞句 In spite of です。" },
    { id: "2-g3", category: 'grammar', question: "Only when the rain stopped ______ able to leave.", options: ["we were", "were we", "we are", "are we"], answer: 1, explanation: "Onlyによる倒置です。" },
    { id: "2-g4", category: 'grammar', question: "No sooner ______ he arrived than it started to rain.", options: ["had", "has", "did", "was"], answer: 0, explanation: "No sooner had S p.p. than... です。" },
    { id: "2-g5", category: 'grammar', question: "Whatever he ______, I will support him.", options: ["do", "does", "doing", "did"], answer: 1, explanation: "Whatever S does (何をしようとも) 譲歩の副詞節です。" },
    // 会話
    { id: "2-c1", category: 'conversation', question: "A: Do you think our plan will work?\nB: ______", options: ["I hope not.", "I'm afraid so.", "It remains to be seen.", "Yes, it worked."], answer: 2, explanation: "「まだ様子を見る必要がある」表現です。" },
    { id: "2-c2", category: 'conversation', question: "A: I'm tied up at the moment.\nB: ______", options: ["I'll call back later.", "Tie it up.", "I'm sorry to hear that.", "You're late."], answer: 0, explanation: "相手が忙しい(tied up)時の返答です。" },
    { id: "2-c3", category: 'conversation', question: "A: Should I bring anything to the party?\nB: ______", options: ["Just yourself.", "Yes, you should.", "I don't bring.", "Anything is fine."], answer: 0, explanation: "「手ぶらでいいよ」の決まり文句です。" },
    { id: "2-c4", category: 'conversation', question: "A: How did you find the movie?\nB: ______", options: ["I found it in the room.", "It was very moving.", "I didn't look for it.", "By bus."], answer: 1, explanation: "感想を聞かれた時の返答です。" },
    { id: "2-c5", category: 'conversation', question: "A: What's the best way to get there?\nB: ______", options: ["It's a long way.", "Take the subway.", "I'm going there.", "I don't know."], answer: 1, explanation: "具体的な行き方の提案です。" },
    // 読解
    { id: "2-r1", category: 'reading', passage: "The development of renewable energy is crucial for reducing carbon emissions. However, storage issues remain a challenge.", question: "What is mentioned as a challenge?", options: ["Lack of interest.", "Storage issues.", "Global warming.", "Number of workers."], answer: 1, explanation: "本文に記載があります。" },
    { id: "2-r2", category: 'reading', passage: "Artificial intelligence can process data quickly, but it may also replace some human jobs in the future.", question: "What is a potential negative effect of AI?", options: ["Fast processing.", "Changing work.", "Replacing human jobs.", "Low cost."], answer: 2, explanation: "仕事の代替について言及されています。" },
    { id: "2-r3", category: 'reading', passage: "Satellite technology is now used for GPS and weather forecasting, leading to safer travel.", question: "How is satellite technology used today?", options: ["For space travel.", "For GPS and weather.", "For building houses.", "For making cars."], answer: 1, explanation: "GPSと気象予測に使われています。" },
    { id: "2-r4", category: 'reading', passage: "Urbanization is a global trend. More people are moving to cities for job opportunities and services.", question: "Why are people moving to cities?", options: ["To find jobs.", "To escape heat.", "To live in nature.", "To avoid people."], answer: 0, explanation: "仕事の機会を求めて、とあります。" },
    { id: "2-r5", category: 'reading', passage: "A balanced diet rich in vegetables can prevent many chronic diseases and improve health.", question: "What is a benefit of a balanced diet?", options: ["It causes diseases.", "It prevents diseases.", "It is expensive.", "It takes time."], answer: 1, explanation: "病気の予防に役立ちます。" }
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

  // 進捗と分母の計算ロジック
  const progress = useMemo(() => {
    const stats = {};
    Object.keys(db).forEach(level => {
      const levelQuestions = db[level];
      const masteredCount = levelQuestions.filter(q => masteredIds.includes(q.id)).length;
      const total = levelQuestions.length;
      
      const catStats = {};
      Object.keys(categories).forEach(cat => {
        if (cat === 'all') return;
        // AIからのカテゴリー名の揺れ（vocabulary/vocab等）を確実に吸収して分母に足す
        const catQ = levelQuestions.filter(q => {
          const c = (q.category || '').toLowerCase().trim();
          const target = cat.toLowerCase();
          return c === target || c.startsWith(target) || (target === 'vocab' && c.includes('vocabulary'));
        });
        const catM = catQ.filter(q => masteredIds.includes(q.id)).length;
        catStats[cat] = { mastered: catM, total: catQ.length };
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

  // AI問題生成
  const fetchWithRetry = async (level, retryCount = 0) => {
    const key = getApiKey();
    if (!key) {
      throw new Error("APIキーが見つかりません。VercelのEnvironment Variables設定とRedeployを確認してください。");
    }

    const systemPrompt = `あなたは英検の専門講師です。英検${level}レベルの試験問題を、以下の5つの分野すべてから【各分野5問ずつ】、合計25問作成してください。
    分野名は必ず小文字の英語で 'vocab', 'idiom', 'grammar', 'conversation', 'reading' のみを使用してください。
    形式は必ずJSONのみで返してください。
    
    JSON形式: 
    { 
      "questions": [ 
        { 
          "id": "一意の英数字ID", 
          "category": "vocab, idiom, grammar, conversation, readingのいずれか", 
          "passage": "読解文（読解以外は空文字）", 
          "question": "問題文", 
          "options": ["4つの選択肢"], 
          "answer": 0-3, 
          "explanation": "日本語による丁寧な解説" 
        } 
      ] 
    }`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: systemPrompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error?.message || `通信エラー (${response.status})`);
      }
      
      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      const cleanJson = rawText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      return parsed.questions;
    } catch (err) {
      if (retryCount < 2) {
        await new Promise(r => setTimeout(r, 2000));
        return fetchWithRetry(level, retryCount + 1);
      }
      throw err;
    }
  };

  const fetchNewQuestions = async (level) => {
    if (isGenerating) return;
    setIsGenerating(true);
    setStatusMsg("AIが新しい問題を生成中...");
    setDebugError(null);
    console.log("Starting generation for level:", level);

    try {
      const newQuestions = await fetchWithRetry(level);
      console.log("Successfully generated:", newQuestions.length, "questions");
      
      if (!Array.isArray(newQuestions) || newQuestions.length === 0) {
        throw new Error("AIから有効なデータを受け取れませんでした。");
      }
      
      const timestamp = Date.now();
      const processedBatch = newQuestions.map((q, idx) => ({
        ...q,
        id: `${level}-gen-${timestamp}-${idx}`
      }));

      // dbステート全体を更新し、Reactに確実に再描画を知らせる
      setDb(prev => {
        const updatedLevel = [...prev[level], ...processedBatch];
        return {
          ...prev,
          [level]: updatedLevel
        };
      });
      
      setStatusMsg("各分野に5問ずつ、合計25問追加されました！");
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error("Fetch Error:", err);
      setDebugError(`エラー: ${err.message}`);
      setStatusMsg(null);
    } finally {
      setIsGenerating(false);
    }
  };

  const setupQuiz = (level, category) => {
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
      setTimeout(() => setStatusMsg(null), 2000);
      return;
    }

    const unmastered = pool.filter(q => !masteredIds.includes(q.id));
    const mastered = pool.filter(q => masteredIds.includes(q.id));
    let selection = [];
    const count = Math.min(5, pool.length);

    if (unmastered.length >= count) {
      selection = [...unmastered].sort(() => 0.5 - Math.random()).slice(0, count);
    } else {
      selection = [...unmastered, ...mastered.sort(() => 0.5 - Math.random()).slice(0, count - unmastered.length)];
      selection.sort(() => 0.5 - Math.random());
    }

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

  const renderMenu = () => (
    <div className="min-h-screen bg-slate-50 p-4 flex flex-col items-center justify-center font-sans text-slate-900">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100">
        <div className="flex items-center justify-center gap-3 mb-10 text-indigo-600">
          <div className="bg-indigo-600 p-2.5 rounded-2xl text-white shadow-lg"><Settings2 size={24} /></div>
          <h1 className="text-2xl font-black tracking-tight italic text-center uppercase">Eiken Master</h1>
        </div>

        <div className="space-y-4">
          {Object.keys(db).map(level => (
            <button
              key={level}
              onClick={() => { setSelectedLevel(level); setCurrentScreen('category'); }}
              className="w-full bg-slate-50 border border-slate-100 hover:border-indigo-400 p-5 rounded-[2rem] flex justify-between items-center transition-all group shadow-sm hover:shadow-md active:scale-95"
            >
              <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{level}</span>
                <div className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">学習開始</div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-base font-black text-indigo-600">{progress[level].percent}%</div>
                <div className="text-[10px] text-slate-400 font-bold">{progress[level].mastered}/{progress[level].total} 問習得</div>
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
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl flex items-start gap-2 text-left">
            <AlertTriangle size={16} className="shrink-0 mt-0.5" />
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
                className={`p-5 rounded-[1.5rem] border-2 flex flex-col items-center gap-2.5 transition-all ${
                  isSelectable 
                  ? 'border-slate-50 hover:border-indigo-200 bg-slate-50 text-slate-700 hover:bg-white shadow-sm active:scale-95' 
                  : 'border-slate-50 bg-slate-50/50 text-slate-300 opacity-50 grayscale cursor-not-allowed'
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

        {debugError && (
          <div className="mt-8 p-4 bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold rounded-2xl text-left">
            {debugError}
          </div>
        )}
      </div>
    </div>
  );

  const renderQuiz = () => {
    const q = quizQuestions[currentQuestionIndex];
    if (!q) return null;

    const currentCatKey = Object.keys(categories).find(k => (q.category || '').toLowerCase().trim().startsWith(k.toLowerCase())) || 'all';
    const currentCatInfo = categories[currentCatKey];

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

            {(q.category?.toLowerCase().includes('reading') || q.passage) && q.passage && (
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
                  else style = "opacity-30 grayscale";
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
                onClick={() => (currentQuestionIndex + 1 < quizQuestions.length ? setCurrentQuestionIndex(prev => prev + 1) : setCurrentScreen('result'))}
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