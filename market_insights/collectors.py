"""Taiwan market collectors and technical calculations."""
import math

import requests
import yfinance as yf

from .market_volume import fetch_market_volume


def fetch_market_indices():
    """
    用 yfinance 抓取大盤指數最新資料
    回傳格式供 report.json 與 Dashboard 使用
    """
    symbols_meta = {
        "^TWII": {"key": "TWII", "label": "台灣加權指數", "market": "tw"},
    }
    indices = {}

    for symbol, meta in symbols_meta.items():
        try:
            print(f"🔄 正在抓取 {meta['label']} ({symbol})...")
            # 用 yf.download 比 Ticker.history 更穩定
            hist5 = yf.download(symbol, period="5d", interval="1d", progress=False)
            print(f"   5d 資料筆數: {len(hist5)}")
            if hist5.empty or len(hist5) < 1:
                print("   ⚠️ 無資料，跳過")
                continue

            # 取最新與前一日收盤價
            close_col = hist5["Close"]
            # yf.download 可能回傳 MultiIndex columns，處理一下
            if hasattr(close_col, "columns"):
                close_col = close_col.iloc[:, 0]

            latest_price = float(close_col.iloc[-1])
            prev_price = (
                float(close_col.iloc[-2]) if len(close_col) >= 2 else latest_price
            )
            price = round(latest_price, 2)
            change = round(latest_price - prev_price, 2)
            pct = (
                round((latest_price - prev_price) / prev_price * 100, 2)
                if prev_price != 0
                else 0.0
            )

            # 抓取今日最高/最低
            high_col = hist5["High"]
            low_col = hist5["Low"]
            if hasattr(high_col, "columns"):
                high_col = high_col.iloc[:, 0]
                low_col = low_col.iloc[:, 0]
            high = round(float(high_col.iloc[-1]), 2)
            low = round(float(low_col.iloc[-1]), 2)

            # 抓 1 個月日線資料當走勢圖使用
            hist30 = yf.download(symbol, period="1mo", interval="1d", progress=False)
            spark_col = hist30["Close"]
            vol_col = hist30["Volume"]
            if hasattr(spark_col, "columns"):
                spark_col = spark_col.iloc[:, 0]
                vol_col = vol_col.iloc[:, 0]

            sparkline = [round(float(v), 2) for v in spark_col.tolist()]
            volume_sparkline = [
                int(v) if math.isfinite(float(v)) and v > 0 else None
                for v in vol_col.tolist()
            ]
            dates = [d.strftime("%m-%d") for d in hist30.index.tolist()]

            date_keys = [d.strftime("%Y-%m-%d") for d in hist30.index.tolist()]
            volume_meta = {}
            if symbol == "^TWII":
                volume_sparkline = fetch_market_volume(date_keys)
                volume_meta = {
                    "volumeUnit": "shares",
                    "volumeSource": "TWSE FMTQIK",
                    "volumeSourceUrl": "https://www.twse.com.tw/zh/trading/historical/fmtqik.html",
                }

            indices[meta["key"]] = {
                **volume_meta,
                "dateKeys": date_keys,
                "marketDate": hist5.index[-1].strftime("%Y-%m-%d"),
                "label": meta["label"],
                "market": meta["market"],
                "price": price,
                "change": change,
                "pct": pct,
                "high": high,
                "low": low,
                "sparkline": sparkline,
                "volume_sparkline": volume_sparkline,
                "dates": dates,
            }
            print(f"   📈 {meta['label']}: {price} ({'+' if pct >= 0 else ''}{pct}%)")
        except Exception as e:
            import traceback

            print(f"   ⚠️ 無法取得 {symbol} 資料: {e}")
            traceback.print_exc()

    print(f"\n📊 共成功抓取 {len(indices)} 個指數")
    return indices


def fetch_technical_indicators():
    """
    抓取關鍵股票的技術指標（MA 均線、RSI）
    """
    tickers = {
        "^TWII": "台股加權",
        "2330.TW": "台積電",
        "2317.TW": "鴻海",
        "AAPL": "Apple",
        "NVDA": "NVIDIA",
        "TSLA": "Tesla",
    }
    results = []
    for symbol, name in tickers.items():
        try:
            hist = yf.download(symbol, period="3mo", interval="1d", progress=False)
            if hist.empty or len(hist) < 20:
                continue
            close = hist["Close"]
            if hasattr(close, "columns"):
                close = close.iloc[:, 0]

            price = round(float(close.iloc[-1]), 2)
            ma5 = round(float(close.rolling(5).mean().iloc[-1]), 2)
            ma20 = round(float(close.rolling(20).mean().iloc[-1]), 2)
            ma60 = round(float(close.rolling(min(60, len(close))).mean().iloc[-1]), 2)

            # RSI 14
            delta = close.diff()
            gain = delta.where(delta > 0, 0).rolling(14).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
            rs = gain / loss
            rsi = round(float((100 - (100 / (1 + rs))).iloc[-1]), 1)

            # 判斷信號
            if ma5 > ma20 > ma60:
                signal = "bull"
                signal_text = "多頭排列 ↑"
            elif ma5 < ma20 < ma60:
                signal = "bear"
                signal_text = "空頭排列 ↓"
            else:
                signal = "neutral"
                signal_text = "整理中 ↔"

            results.append(
                {
                    "symbol": symbol.replace(".TW", "").replace("^", ""),
                    "name": name,
                    "price": price,
                    "ma5": ma5,
                    "ma20": ma20,
                    "ma60": ma60,
                    "rsi": rsi,
                    "signal": signal,
                    "signalText": signal_text,
                }
            )
            print(f"   📉 {name}: RSI={rsi}, MA信號={signal_text}")
        except Exception as e:
            print(f"   ⚠️ 無法取得 {symbol} 技術指標: {e}")
    return results


def fetch_risk_indicators():
    """
    抓取風險監控指標（美元指數、公債殖利率、黃金、原油）
    """
    risk_tickers = {
        "DX-Y.NYB": {"name": "美元指數 DXY", "icon": "💵"},
        "^TNX": {"name": "美國10年期公債", "icon": "🏦"},
        "GC=F": {"name": "黃金 Gold", "icon": "🥇"},
        "CL=F": {"name": "原油 WTI", "icon": "🛢️"},
    }
    results = []
    for symbol, meta in risk_tickers.items():
        try:
            hist = yf.download(symbol, period="5d", interval="1d", progress=False)
            if hist.empty:
                continue
            close = hist["Close"]
            if hasattr(close, "columns"):
                close = close.iloc[:, 0]
            price = round(float(close.iloc[-1]), 2)
            prev = float(close.iloc[-2]) if len(close) >= 2 else price
            change = round(price - prev, 2)
            pct = round((price - prev) / prev * 100, 2) if prev != 0 else 0.0
            results.append(
                {
                    "symbol": symbol,
                    "name": meta["name"],
                    "icon": meta["icon"],
                    "price": price,
                    "change": change,
                    "pct": pct,
                }
            )
            print(
                f"   {meta['icon']} {meta['name']}: {price} ({'+' if pct >= 0 else ''}{pct}%)"
            )
        except Exception as e:
            print(f"   ⚠️ 無法取得 {symbol}: {e}")
    return results


def fetch_twse_sectors():
    """
    從 TWSE Open API 抓取各板塊指數漲跌幅度
    策略：動態抓所有名稱含「類指數」的項目，不寫死清單避免編碼問題
    """
    # 顯示名稱縮寫對照
    NAME_MAP = {
        "半導體類指數": "半導體",
        "電子工業類指數": "電子工業",
        "金融保險類指數": "金融保險",
        "航運業類指數": "航運",
        "生技醫療類指數": "生技醫療",
        "食品工業類指數": "食品",
        "化學工業類指數": "化學",
        "鋼鐵工業類指數": "鋼鐵",
        "電機機械類指數": "電機",
        "油電燃氣類指數": "油電燃氣",
        "玻璃陶瓷類指數": "玻璃陶瓷",
        "造紙類指數": "造紙",
        "電器電纜類指數": "電器電纜",
        "建材營造類指數": "建材營造",
        "觀光餐旅類指數": "觀光餐旅",
        "資訊服務業類指數": "資訊服務",
        "汽車工業類指數": "汽車",
        "其他電子業類指數": "其他電子",
        "光電業類指數": "光電",
        "通信網路類指數": "通信網路",
        "電子零組件業類指數": "電子零組件",
        "電腦及周邊設備業類指數": "電腦周邊",
        "半導體業類指數": "半導體業",
    }
    try:
        resp = requests.get(
            "https://openapi.twse.com.tw/v1/exchangeReport/MI_INDEX",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        data = resp.json()
        sectors = []
        for item in data:
            name = item.get("指數", "")
            # 動態過濾：只要名稱含「類指數」
            if "類指數" not in name:
                continue
            try:
                pct_raw = item.get("漲跌百分比", "0").replace(",", "")
                pct = float(pct_raw)
                direction = item.get("漲跌", "-")
                if direction == "-":
                    pct = -abs(pct)
                else:
                    pct = abs(pct)
                sectors.append(
                    {
                        "name": NAME_MAP.get(name, name.replace("類指數", "")),
                        "fullName": name,
                        "pct": round(pct, 2),
                        "close": item.get("收盤指數", "--"),
                    }
                )
            except (ValueError, TypeError, KeyError, IndexError):
                pass
        print(f"   🎯 抓到 {len(sectors)} 個板塊指數")
        return sectors
    except Exception as e:
        print(f"   ⚠️ 抓取板塊失敗: {e}")
        return []


def fetch_twse_institutional():
    """
    從 TWSE API 抓取三大法人買賣超 Top 10
    單位：股
    """
    try:
        resp = requests.get(
            "https://www.twse.com.tw/rwd/zh/fund/T86?response=json&selectType=ALL",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15,
        )
        result = resp.json()
        if result.get("stat") != "OK":
            return {"date": "", "topBuy": [], "topSell": []}

        date_str = result.get("date", "")
        rows = result.get("data", [])

        def parse_num(s):
            try:
                return int(str(s).replace(",", "").replace(" ", ""))
            except (ValueError, TypeError, KeyError, IndexError):
                return 0

        parsed = []
        for row in rows:
            if len(row) < 19:
                continue
            code = row[0].strip()
            name = row[1].strip()
            # 過濾 ETF（代碼以 0 開頭）
            if code.startswith("0"):
                continue
            net_all = parse_num(row[18])  # 三大法人買賣超股數 (Index 18)
            foreign = parse_num(row[4])  # 外陸資買賣超
            trust = parse_num(row[10])  # 投信買賣超
            dealer = parse_num(row[11])  # 自營商買賣超
            parsed.append(
                {
                    "code": code,
                    "name": name,
                    "net": net_all,
                    "foreign": foreign,
                    "trust": trust,
                    "dealer": dealer,
                }
            )

        parsed.sort(key=lambda x: x["net"], reverse=True)
        top_buy = parsed[:10]
        top_sell = parsed[-10:][::-1]

        # 儲存時將股轉為張（除以 1000）方便顯示
        def to_display(items):
            out = []
            for r in items:
                out.append(
                    {
                        "code": r["code"],
                        "name": r["name"],
                        "net_lots": round(r["net"] / 1000),
                        "foreign_lots": round(r["foreign"] / 1000),
                        "trust_lots": round(r["trust"] / 1000),
                        "dealer_lots": round(r["dealer"] / 1000),
                    }
                )
            return out

        # 抓取並運算個股板塊分類籌碼
        sector_details = fetch_sector_details(parsed)

        print(f"   🏦 三大法人資料日期: {date_str}")
        return {
            "date": date_str,
            "topBuy": to_display(top_buy),
            "topSell": to_display(top_sell),
            "sectorDetails": sector_details,
        }
    except Exception as e:
        print(f"   ⚠️ 抓取三大法人失敗: {e}")
        return {"date": "", "topBuy": [], "topSell": [], "sectorDetails": {}}


def fetch_sector_details(parsed_stocks):
    """
    結合 TWSE 產業別與自定義概念股，計算各板塊的個股籌碼 Top Buy / Top Sell 排行
    並加入每支股票的當日股價與漲跌幅
    """
    try:
        print("   🔍 正在抓取 TWSE 個股產業別與當日股價資料...")

        # 1. 抓取上市個股基本資料（公司代號 -> 產業別）
        profile_resp = requests.get(
            "https://openapi.twse.com.tw/v1/opendata/t187ap03_L",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        profile_data = profile_resp.json()

        sector_code_map = {
            "01": "水泥",
            "02": "食品",
            "03": "塑膠",
            "04": "紡織纖維",
            "05": "電機機械",
            "06": "電器電纜",
            "08": "玻璃陶瓷",
            "09": "造紙",
            "10": "鋼鐵",
            "11": "橡膠",
            "12": "汽車",
            "14": "建材營造",
            "15": "航運",
            "16": "觀光餐旅",
            "17": "金融",
            "18": "貿易百貨",
            "20": "其他",
            "21": "化學",
            "22": "生技醫療",
            "23": "油電燃氣",
            "24": "半導體",
            "25": "電腦及週邊設備",
            "26": "光電",
            "27": "通信網路",
            "28": "電子零組件",
            "29": "電子通路",
            "30": "資訊服務",
            "31": "其他電子",
            "35": "綠能環保",
            "36": "數位雲端",
            "37": "運動休閒",
            "38": "居家生活",
        }
        code_to_sector = {}
        for item in profile_data:
            c_code = item.get("公司代號", "").strip()
            ind_code = item.get("產業別", "").strip()
            if c_code and ind_code in sector_code_map:
                code_to_sector[c_code] = sector_code_map[ind_code]

        # 2. 抓取當日全市場個股股價（ClosingPrice + Change）
        price_resp = requests.get(
            "https://openapi.twse.com.tw/v1/exchangeReport/STOCK_DAY_ALL",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=15,
        )
        price_data = price_resp.json()
        # 建立 代號 -> {price, pct} 的映射
        code_to_price = {}
        for item in price_data:
            code = item.get("Code", "").strip()
            try:
                close_str = item.get("ClosingPrice", "0").replace(",", "")
                change_str = item.get("Change", "0").replace("+", "").replace(",", "")
                close = float(close_str) if close_str not in ("", "--", "----") else 0.0
                change = (
                    float(change_str) if change_str not in ("", "--", "----") else 0.0
                )
                pct = (
                    round(change / (close - change) * 100, 2)
                    if (close - change) != 0
                    else 0.0
                )
                code_to_price[code] = {"price": close, "change": change, "pct": pct}
            except (ValueError, TypeError, KeyError, IndexError):
                code_to_price[code] = {"price": 0.0, "change": 0.0, "pct": 0.0}

        # 3. 定義自定義概念股題材
        THEME_STOCKS = {
            "太空股": ["2313", "3491", "2314", "6274", "3289", "3037", "2368"],
            "重電概念": ["1503", "1513", "1514", "1519", "1504", "1608", "1609"],
            "AI概念股": ["2330", "2317", "2382", "3231", "2376", "6669", "2356", "3515"],
            "綠能環保": ["9941", "6806", "1513", "3708", "6443", "6477"],
        }

        # 4. 建立板塊/題材 -> 股票清單的群組
        sector_groups = {}
        for r in parsed_stocks:
            code = r["code"]
            for theme, stock_list in THEME_STOCKS.items():
                if code in stock_list:
                    if theme not in sector_groups:
                        sector_groups[theme] = []
                    sector_groups[theme].append(r)
            if code in code_to_sector:
                sec_name = code_to_sector[code]
                if sec_name not in sector_groups:
                    sector_groups[sec_name] = []
                sector_groups[sec_name].append(r)

        # 5. 對每個群組進行排序，抓出買超 Top 5 和賣超 Top 5，並附加股價漲跌資訊
        sector_details = {}
        for sector, stocks in sector_groups.items():
            sorted_stocks = sorted(stocks, key=lambda x: x["net"], reverse=True)
            buys = [s for s in sorted_stocks if s["net"] > 0]
            sells = [s for s in sorted_stocks if s["net"] < 0][::-1]

            def to_display_lots(items):
                out = []
                for s in items:
                    pi = code_to_price.get(
                        s["code"], {"price": 0.0, "change": 0.0, "pct": 0.0}
                    )
                    out.append(
                        {
                            "code": s["code"],
                            "name": s["name"],
                            "net_lots": round(s["net"] / 1000),
                            "foreign_lots": round(s["foreign"] / 1000),
                            "trust_lots": round(s["trust"] / 1000),
                            "dealer_lots": round(s["dealer"] / 1000),
                            "price": pi["price"],
                            "change": pi["change"],
                            "pct": pi["pct"],
                        }
                    )
                return out

            sector_details[sector] = {
                "topBuy": to_display_lots(buys[:5]),
                "topSell": to_display_lots(sells[:5]),
            }

        print(f"   🌡️ 已完成 {len(sector_details)} 個板塊/自定義題材的個股籌碼分類")
        return sector_details
    except Exception as e:
        print(f"   ⚠️ 抓取板塊個股籌碼分類失敗: {e}")
        return {}


def fetch_twse_institutional_flow():
    """
    從 TWSE 官網抓取每日三大法人買賣差額 (億元)
    """
    try:
        resp = requests.get(
            "https://www.twse.com.tw/rwd/zh/fund/BFI82U?response=json",
            headers={"User-Agent": "Mozilla/5.0"},
            timeout=10,
        )
        result = resp.json()
        if result.get("stat") != "OK":
            return None

        rows = result.get("data", [])

        def parse_to_billion(s):
            try:
                # 原始資料單位為元，除以 100,000,000 得到億，保留小數點二位
                val = float(str(s).replace(",", "").replace(" ", ""))
                return round(val / 100000000, 2)
            except (ValueError, TypeError, KeyError, IndexError):
                return 0.0

        # 初始化各法人金額
        foreign = 0.0
        trust = 0.0
        dealer = 0.0

        for row in rows:
            name = row[0].strip()
            diff_val = parse_to_billion(row[3])
            if "外資及陸資" in name and name != "外資自營商":
                foreign = diff_val
            elif "投信" in name:
                trust = diff_val
            elif "自營商" in name:
                dealer += diff_val

        total = round(foreign + trust + dealer, 2)

        return {
            "date": result.get("date", ""),
            "foreign": foreign,
            "trust": trust,
            "dealer": dealer,
            "total": total,
        }
    except Exception as e:
        print(f"   ⚠️ 抓取三大法人買賣超金額失敗: {e}")
        return None
