#!/usr/bin/env python3
"""
Viteプロジェクト用のHTTPサーバー
ESモジュールのMIMEタイプを正しく設定します
"""

import http.server
import socketserver
import os

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def guess_type(self, path):
        # クエリパラメータを除去
        path = path.split('?')[0]
        
        # ESモジュールのMIMEタイプを正しく設定
        if path.endswith('.js') or path.endswith('.mjs'):
            return 'application/javascript'
        elif path.endswith('.css'):
            return 'text/css'
        elif path.endswith('.json'):
            return 'application/json'
        elif path.endswith('.svg'):
            return 'image/svg+xml'
        elif path.endswith('.html'):
            return 'text/html'
        elif path.endswith('.txt'):
            return 'text/plain'
        else:
            # デフォルトの動作
            return super().guess_type(path)

    def log_message(self, format, *args):
        # リクエストをログに出力（デバッグ用）
        print(f"{args[0]} - {args[1]}")

PORT = 8000

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    print(f"サーバーを起動しました: http://localhost:{PORT}")
    print("終了するには Ctrl+C を押してください")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nサーバーを停止しました")

