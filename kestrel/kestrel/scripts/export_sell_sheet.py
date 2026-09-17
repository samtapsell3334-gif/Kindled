"""
Generates the "to sell" master sheet: every logged purchase, its bought
price, a freshly-fetched current market rate, a suggested list price, and
estimated profit if it sells at that price.

    python -m kestrel.scripts.export_sell_sheet [output_path]

Market rate is looked up live (kestrel.purchases.refresh_market_rate) every
run — never cached here — so the sheet reflects today's price, not
whatever it was worth when bought. Suggested list price is the market rate
itself (the standard "list at market" starting point); the profit column
shows what actually nets after eBay's ~13% seller fee and postage if it
sells at that price, using the same fee_rate/resale_postage_gbp config the
buying side already uses.
"""

from __future__ import annotations

import sys
from decimal import Decimal

import requests
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

from kestrel.config import CONFIG
from kestrel.db import get_connection, init_db
from kestrel.matcher import estimate_net_profit, net_breakeven_cap
from kestrel.models import PurchaseStatus
from kestrel.purchases import list_purchases, refresh_market_rate

FONT = "Arial"
HEADER_FILL = PatternFill(start_color="1F4E5F", end_color="1F4E5F", fill_type="solid")
HEADER_FONT = Font(name=FONT, bold=True, color="FFFFFF", size=10)
TITLE_FONT = Font(name=FONT, bold=True, size=14)
SUBTITLE_FONT = Font(name=FONT, italic=True, size=9, color="666666")
BODY_FONT = Font(name=FONT, size=10)
NOTE_FONT = Font(name=FONT, size=9, color="333333")
THIN = Side(style="thin", color="CCCCCC")
BORDER = Border(left=THIN, right=THIN, top=THIN, bottom=THIN)
MONEY = "#,##0.00;(#,##0.00)"
SOLD_FILL = PatternFill(start_color="D4EDDA", end_color="D4EDDA", fill_type="solid")
LISTED_FILL = PatternFill(start_color="FFF3CD", end_color="FFF3CD", fill_type="solid")


def main() -> None:
    out_path = sys.argv[1] if len(sys.argv) > 1 else "kestrel_sell_sheet.xlsx"

    init_db(CONFIG.db_path)
    session = requests.Session()
    with get_connection(CONFIG.db_path) as conn:
        purchases = list_purchases(conn)

    if not purchases:
        print("(no purchases logged yet -- nothing to export)")
        return

    wb = Workbook()
    ws = wb.active
    ws.title = "To Sell"
    ws.sheet_view.showGridLines = False

    ws["A1"] = "Kestrel — To Sell"
    ws["A1"].font = TITLE_FONT
    ws["A2"] = "Every logged purchase, live market rate, suggested list price, estimated profit"
    ws["A2"].font = SUBTITLE_FONT

    headers = [
        "Card", "Game/Set", "Status", "Bought Price (£)", "Bought Date",
        "Market Rate Now (£)", "Suggested List Price (£)", "Est. Profit if Sold at List (£)",
        "Listed Price (£)", "Sold Price (£)", "Notes",
    ]
    widths = [18, 22, 10, 14, 12, 16, 18, 20, 14, 14, 40]
    for i, (h, w) in enumerate(zip(headers, widths), start=1):
        col = get_column_letter(i)
        ws.column_dimensions[col].width = w
        c = ws.cell(row=4, column=i, value=h)
        c.font = HEADER_FONT
        c.fill = HEADER_FILL
        c.alignment = Alignment(wrap_text=True, vertical="center")
    ws.row_dimensions[4].height = 32

    row = 5
    no_rate_count = 0
    for p in purchases:
        rate = refresh_market_rate(session, CONFIG, p)
        game_set = f"{p.game} — {p.set_name}" if p.set_name else p.game

        if rate is not None:
            breakeven = net_breakeven_cap(rate, CONFIG.ebay_seller_fee_rate, CONFIG.resale_postage_gbp)
            profit = estimate_net_profit(p.bought_price_gbp, rate, CONFIG.ebay_seller_fee_rate, CONFIG.resale_postage_gbp)
            rate_val, list_val, profit_val = float(rate), float(rate), float(profit)
        else:
            no_rate_count += 1
            rate_val = list_val = profit_val = None

        vals = [
            p.card_name, game_set, p.status.value, float(p.bought_price_gbp),
            p.bought_at.strftime("%Y-%m-%d") if p.bought_at else "",
            rate_val, list_val, profit_val,
            float(p.listed_price_gbp) if p.listed_price_gbp is not None else None,
            float(p.sold_price_gbp) if p.sold_price_gbp is not None else None,
            p.notes or "",
        ]
        for i, val in enumerate(vals, start=1):
            c = ws.cell(row=row, column=i, value=val)
            c.font = BODY_FONT
            c.border = BORDER
            c.alignment = Alignment(vertical="top", wrap_text=(i == 11))
            if i in (4, 6, 7, 8, 9, 10) and val is not None:
                c.number_format = MONEY

        if p.status == PurchaseStatus.SOLD:
            for col in range(1, 12):
                ws.cell(row=row, column=col).fill = SOLD_FILL
        elif p.status == PurchaseStatus.LISTED:
            for col in range(1, 12):
                ws.cell(row=row, column=col).fill = LISTED_FILL

        row += 1

    legend_row = row + 1
    ws.cell(row=legend_row, column=1, value="Green = sold. Yellow = listed, not yet sold. White = still to list.").font = NOTE_FONT
    ws.merge_cells(start_row=legend_row, start_column=1, end_row=legend_row, end_column=5)
    ws.cell(row=legend_row + 1, column=1, value=(
        f"Market rate assumes a {float(CONFIG.ebay_seller_fee_rate) * 100:.0f}% eBay seller fee and "
        f"£{CONFIG.resale_postage_gbp} resale postage when estimating profit. Suggested list price = "
        "market rate itself; adjust for your own timeline (list below market to sell faster, above to "
        "hold out for full value)."
    )).font = NOTE_FONT
    ws.cell(row=legend_row + 1, column=1).alignment = Alignment(wrap_text=True)
    ws.merge_cells(start_row=legend_row + 1, start_column=1, end_row=legend_row + 1, end_column=11)
    ws.row_dimensions[legend_row + 1].height = 28

    wb.save(out_path)
    print(f"Saved {out_path} ({len(purchases)} purchases, {no_rate_count} without a live rate this run)")


if __name__ == "__main__":
    main()
