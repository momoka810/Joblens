// Vercel Serverless Function: Dify API プロキシ
// このファイルは /api/dify-proxy エンドポイントとして動作します

export default async function handler(req, res) {
  // CORSヘッダーを設定（フロントエンドからのアクセスを許可）
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // OPTIONSリクエスト（プリフライト）の処理
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  // POSTリクエストのみ許可
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 環境変数からAPIキーを取得
  const apiKey = process.env.DIFY_API_KEY
  if (!apiKey) {
    console.error('DIFY_API_KEY環境変数が設定されていません')
    return res.status(500).json({ 
      error: 'API key not configured',
      message: 'サーバー側でAPIキーが設定されていません'
    })
  }

  try {
    // Dify APIにリクエストを転送
    const response = await fetch('https://api.dify.ai/v1/chat-messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(req.body)
    })

    // レスポンスを取得
    const data = await response.json()

    // ステータスコードとレスポンスを返す
    res.status(response.status).json(data)
  } catch (error) {
    console.error('Dify APIプロキシエラー:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    })
  }
}

