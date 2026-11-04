"""TWSE market turnover, in shares; never substitute Yahoo index volume."""
import requests

SOURCE_URL = 'https://www.twse.com.tw/rwd/zh/afterTrading/FMTQIK'


def parse_market_volume(payload):
    if not isinstance(payload, dict) or payload.get('stat') != 'OK':
        return {}
    fields = payload.get('fields', [])
    if '日期' not in fields or '成交股數' not in fields:
        return {}
    date_index, volume_index = fields.index('日期'), fields.index('成交股數')
    result = {}
    for row in payload.get('data', []):
        try:
            year, month, day = map(int, row[date_index].split('/'))
            year = year + 1911 if year < 1911 else year
            from datetime import date
            key = date(year, month, day).isoformat()
            shares = int(str(row[volume_index]).replace(',', ''))
            if shares > 0:
                result[key] = shares
        except (ValueError, TypeError, IndexError):
            continue
    return result


def fetch_market_volume(dates, get=requests.get):
    by_date = {}
    for month in sorted({date[:7].replace('-', '') + '01' for date in dates}):
        try:
            response = get(SOURCE_URL, params={'date': month, 'response': 'json'}, timeout=15)
            response.raise_for_status()
            by_date.update(parse_market_volume(response.json()))
        except (requests.RequestException, ValueError, TypeError):
            print(f'TWSE volume unavailable for {month}; leaving values missing.')
    return [by_date.get(date) for date in dates]
