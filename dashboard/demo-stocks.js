/* Taiwan/HK sample fixtures only. Not live market data. */
window.demoStockData = {
  tw: [
    { ticker:'2330', name:'台積電', sector:'半導體', price:985, change:15, pct:1.55, open:972, high:988, low:968, vol:'38,521張', pe:'28.3', foreign:12850, trust:3200, dealer:-890, discussions:[
      { channel:'財女珍妮', avatar:'珍', date:'2026-05-03', video:'台股站上兩萬三！半導體多頭行情還能延續嗎？', videoUrl:'https://www.youtube.com/@jennymarket', stance:'bull', stanceText:'看多', quote:'台積電法說會後展望正面，CoWoS 產能持續擴充，目標價上看 1050。' },
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！散熱模組成新焦點', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'台積電是 AI 軍備競賽最大受惠者，先進製程訂單能見度高，建議核心持有。' },
      { channel:'柴鼠兄弟', avatar:'柴', date:'2026-05-03', video:'美國降息時間表更新！對台股影響全面解析', videoUrl:'https://www.youtube.com/@chiratbros', stance:'bull', stanceText:'偏多', quote:'台積電作為權值龍頭，外資回流首選標的。' }
    ]},
    { ticker:'2317', name:'鴻海', sector:'電子代工', price:178.5, change:3.5, pct:2.0, open:175, high:180, low:174.5, vol:'85,230張', pe:'12.1', foreign:8920, trust:1560, dealer:340, discussions:[
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！散熱模組成新焦點', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'鴻海 GB200 伺服器代工訂單明確，下半年營收將顯著成長。' },
      { channel:'投資嗨嗨', avatar:'嗨', date:'2026-05-02', video:'鴻海轉型 AI 有成？最新法說重點整理', videoUrl:'https://www.youtube.com/@investhi', stance:'bull', stanceText:'偏多', quote:'鴻海電動車 + AI 伺服器雙引擎驅動，但需注意毛利率能否持續改善。' }
    ]},
    { ticker:'2454', name:'聯發科', sector:'IC設計', price:1285, change:-15, pct:-1.15, open:1300, high:1305, low:1278, vol:'12,100張', pe:'18.7', foreign:-3200, trust:890, dealer:-120, discussions:[
      { channel:'財女珍妮', avatar:'珍', date:'2026-05-03', video:'台股站上兩萬三！半導體多頭行情還能延續嗎？', videoUrl:'https://www.youtube.com/@jennymarket', stance:'neutral', stanceText:'中立', quote:'聯發科天璣 9400 拉貨狀況需觀察，短線整理後有機會再攻。' }
    ]},
    { ticker:'2603', name:'長榮', sector:'航運業', price:168, change:-4.5, pct:-2.61, open:173, high:174, low:167, vol:'45,600張', pe:'6.2', foreign:-5600, trust:-1200, dealer:-340, discussions:[
      { channel:'投資嗨嗨', avatar:'嗨', date:'2026-05-02', video:'航運股跌到何時？三大觀察指標告訴你', videoUrl:'https://www.youtube.com/@investhi', stance:'bear', stanceText:'偏空', quote:'長榮運價持續下滑，BDI 指數疲弱，短線建議觀望。' }
    ]},
    { ticker:'2881', name:'富邦金', sector:'金融保險', price:82.3, change:0.5, pct:0.61, open:82, high:82.8, low:81.5, vol:'22,340張', pe:'10.5', foreign:1200, trust:560, dealer:120, discussions:[
      { channel:'阿格力', avatar:'阿', date:'2026-05-01', video:'金融股存股策略 2026 更新版！', videoUrl:'https://www.youtube.com/@agreeliu', stance:'neutral', stanceText:'中立', quote:'富邦金殖利率約 4.5%，穩健型投資人可分批布局。' }
    ]},
    { ticker:'3661', name:'世芯-KY', sector:'IC設計', price:2680, change:85, pct:3.28, open:2600, high:2695, low:2590, vol:'4,230張', pe:'35.2', foreign:1890, trust:670, dealer:120, discussions:[] },
    { ticker:'6669', name:'緯穎', sector:'伺服器', price:1850, change:45, pct:2.49, open:1810, high:1865, low:1800, vol:'2,890張', pe:'22.1', foreign:920, trust:340, dealer:80, discussions:[
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'緯穎受惠雲端大廠資本支出增加，訂單能見度至 2027 年。' }
    ]},
  ],
  us: [], // US prices are supplied by report.usMarket.stocks.
  hk: [
    { ticker:'6088', name:'鴻騰精密 (FIT)', sector:'電子零組件', price:2.85, change:0.12, pct:4.39, open:2.75, high:2.88, low:2.72, vol:'12.5M', pe:'15.2', foreign:null, trust:null, dealer:null, discussions:[
      { channel:'股癌', avatar:'股', date:'2026-05-02', video:'AI 伺服器訂單爆量！', videoUrl:'https://www.youtube.com/@gooaye', stance:'bull', stanceText:'看多', quote:'除了母公司鴻海，旗下零組件廠如 FIT 也能吃到 GB200 水冷接頭商機，值得留意。' }
    ]}
  ]
};

