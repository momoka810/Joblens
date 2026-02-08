// ==========================================
// Dify API設定
// ==========================================

// Dify API設定
let DIFY_API_KEY = 'YOUR_API_KEY_HERE'
const DIFY_API_URL = 'https://api.dify.ai/v1/chat-messages'

// api_key.txtからAPIキーを読み込む
async function loadApiKey() {
  // 複数のパスを試す（VercelやGitHub Pagesに対応）
  const possiblePaths = [
    '/api_key.txt',
    './api_key.txt',
    '/project/api_key.txt',
    'api_key.txt'
  ]
  
  for (const path of possiblePaths) {
    try {
      const response = await fetch(path)
      if (response.ok) {
        const apiKey = await response.text()
        DIFY_API_KEY = apiKey.trim()
        if (DIFY_API_KEY && DIFY_API_KEY !== 'YOUR_API_KEY_HERE') {
          console.log(`✅ Dify APIキーを読み込みました (${path})`)
          return // 成功したら終了
        } else {
          console.warn(`⚠️ ${path}にAPIキーが設定されていません`)
        }
      }
    } catch (error) {
      // 次のパスを試す
      continue
    }
  }
  
  // すべてのパスで失敗した場合
  console.warn('⚠️ api_key.txtが見つかりません。以下のパスを試しました:', possiblePaths)
  console.warn('⚠️ 公開環境では、api_key.txtが正しく配置されているか確認してください。')
}

// ==========================================
// データ管理
// ==========================================

// グローバルデータ：ユーザープロファイル、保存された求人、履歴
let userProfile = {
  jobType: '',
  experienceYears: ''
}

let savedJobs = []
let history = []

// ==========================================
// ローカルストレージ管理
// ==========================================

// データをlocalStorageから読み込む
function loadFromStorage() {
  const profileData = localStorage.getItem('joblens_profile')
  const jobsData = localStorage.getItem('joblens_saved_jobs')
  const historyData = localStorage.getItem('joblens_history')

  if (profileData) {
    userProfile = JSON.parse(profileData)
  }

  if (jobsData) {
    savedJobs = JSON.parse(jobsData)
  }

  if (historyData) {
    history = JSON.parse(historyData)
  }
}

// データをlocalStorageに保存する
function saveToStorage() {
  localStorage.setItem('joblens_profile', JSON.stringify(userProfile))
  localStorage.setItem('joblens_saved_jobs', JSON.stringify(savedJobs))
  localStorage.setItem('joblens_history', JSON.stringify(history))
}

// ==========================================
// アプリケーションのHTML構造を構築
// ==========================================

document.querySelector('#app').innerHTML = `
  <!-- ヘッダー -->
  <div class="header">
    <h1>JobLens</h1>
    <p>求人を冷静に見るためのAI</p>
  </div>

  <!-- ① ユーザープロファイル入力セクション -->
  <div class="user-profile-section">
    <h2>あなたのプロファイル</h2>
    <p>希望職種と経験年数を入力すると、よりパーソナライズされた分析が可能になります（将来実装予定）</p>

    <div class="profile-form-grid">
      <div class="profile-form-group">
        <label for="jobType">希望職種</label>
        <input
          type="text"
          id="jobType"
          placeholder="例：フロントエンドエンジニア"
          value="${userProfile.jobType}"
        />
      </div>

      <div class="profile-form-group">
        <label for="experienceYears">経験年数</label>
        <select id="experienceYears">
          <option value="">選択してください</option>
          <option value="0-1">未経験〜1年</option>
          <option value="1-3">1年〜3年</option>
          <option value="3-5">3年〜5年</option>
          <option value="5-10">5年〜10年</option>
          <option value="10+">10年以上</option>
        </select>
      </div>
    </div>

    <div class="profile-status" id="profileStatus">
      <span class="icon">✓</span>
      <span id="profileStatusText">プロファイルを入力してください</span>
    </div>
  </div>

  <!-- 求人分析セクション -->
  <div class="input-section">
    <form id="analysisForm">
      <div class="form-group">
        <label for="jobPosting">求人票</label>
        <textarea
          id="jobPosting"
          name="jobPosting"
          placeholder="ここに求人票をそのまま貼り付けてください"
          required
        ></textarea>
      </div>

      <div class="form-group">
        <label for="priorities">重視したい条件（任意）</label>
        <input
          type="text"
          id="priorities"
          name="priorities"
          placeholder="例：成長環境、働き方、業務内容の明確さ"
        />
      </div>

      <button type="submit" class="analyze-button">分析する</button>
    </form>
  </div>

  <!-- 分析結果表示エリア -->
  <div class="results-section" id="resultsSection">
    <div class="results-grid">
      <div class="result-card">
        <h3><span class="icon">📋</span>この求人の要点（事実）</h3>
        <div class="content" id="summary"></div>
      </div>

      <div class="result-card">
        <h3><span class="icon">✨</span>良さそうな点</h3>
        <div class="content" id="strengths"></div>
      </div>

      <div class="result-card">
        <h3><span class="icon">⚠️</span>注意・確認したいポイント</h3>
        <div class="content" id="concerns"></div>
      </div>

      <div class="result-card">
        <h3><span class="icon">💬</span>面接で確認すると良い質問例</h3>
        <div class="content" id="questions"></div>
      </div>
    </div>

    <!-- 保存ボタン -->
    <div class="save-button-container">
      <button class="btn-save" id="saveJobButton">この求人を保存する</button>
    </div>
  </div>

  <div class="section-divider"></div>

  <!-- ② 保存された求人一覧セクション -->
  <div class="saved-jobs-section">
    <h2>保存された求人（${savedJobs.length}件）</h2>
    <p>複数選択して比較することができます</p>

    <div id="savedJobsList"></div>

    <div class="compare-controls">
      <button class="btn-primary" id="compareButton" disabled>
        選択した求人を比較する
      </button>
      <button class="btn-secondary" id="clearSelectionButton">
        選択を解除
      </button>
    </div>
  </div>

  <!-- ③ 比較結果セクション -->
  <div class="comparison-section" id="comparisonSection">
    <div class="comparison-header">
      <h2>比較結果</h2>
      <button class="btn-secondary" id="closeComparisonButton">閉じる</button>
    </div>
    <div class="comparison-grid" id="comparisonGrid"></div>
  </div>

  <div class="section-divider"></div>

  <!-- ④ 履歴セクション -->
  <div class="history-section">
    <h2>検討履歴</h2>
    <p>分析や比較の履歴が自動的に保存されます</p>

    <div id="historyList"></div>

    <button class="btn-clear-history" id="clearHistoryButton">
      履歴をすべて削除
    </button>
  </div>
`

// ==========================================
// 初期化処理
// ==========================================

// localStorageからデータを読み込み
loadFromStorage()

// Dify APIキーを読み込む
loadApiKey()

// DOM要素の取得
const form = document.getElementById('analysisForm')
const analyzeButton = form.querySelector('.analyze-button')
const resultsSection = document.getElementById('resultsSection')
const saveJobButton = document.getElementById('saveJobButton')
const savedJobsList = document.getElementById('savedJobsList')
const compareButton = document.getElementById('compareButton')
const clearSelectionButton = document.getElementById('clearSelectionButton')
const comparisonSection = document.getElementById('comparisonSection')
const comparisonGrid = document.getElementById('comparisonGrid')
const closeComparisonButton = document.getElementById('closeComparisonButton')
const historyList = document.getElementById('historyList')
const clearHistoryButton = document.getElementById('clearHistoryButton')
const jobTypeInput = document.getElementById('jobType')
const experienceYearsSelect = document.getElementById('experienceYears')
const profileStatusText = document.getElementById('profileStatusText')

// プロファイルの初期値を設定
experienceYearsSelect.value = userProfile.experienceYears

// 保存された求人と履歴を表示
renderSavedJobs()
renderHistory()
updateProfileStatus()

// 現在分析中の求人データを保持
let currentAnalysisResult = null

// ==========================================
// イベントリスナーの設定
// ==========================================

// プロファイル入力の変更を監視
jobTypeInput.addEventListener('input', (e) => {
  userProfile.jobType = e.target.value
  saveToStorage()
  updateProfileStatus()
})

experienceYearsSelect.addEventListener('change', (e) => {
  userProfile.experienceYears = e.target.value
  saveToStorage()
  updateProfileStatus()
})

// フォーム送信イベント（求人分析）
form.addEventListener('submit', async (e) => {
  e.preventDefault()

  const jobPosting = document.getElementById('jobPosting').value
  const priorities = document.getElementById('priorities').value

  // ボタンをローディング状態にする
  analyzeButton.disabled = true
  analyzeButton.classList.add('loading')

  // 結果エリアを非表示にする
  resultsSection.classList.remove('visible')

  try {
    // API呼び出し（現在はダミーデータを返す関数を使用）
    // 【将来のDify API連携ポイント】
    // ここでuserProfile.jobType と userProfile.experienceYears を
    // API呼び出しのパラメータとして渡すことができます
    const results = await analyzeJobPosting(jobPosting, priorities, userProfile)

    // 現在の分析結果を保存
    currentAnalysisResult = {
      jobPosting,
      priorities,
      results,
      timestamp: new Date().toISOString()
    }

    // 結果を表示
    displayResults(results)

    // 結果エリアを表示
    resultsSection.classList.add('visible')

    // 履歴に追加
    addToHistory('分析', `求人票を分析しました（${jobPosting.substring(0, 30)}...）`)

    // 結果エリアまでスクロール
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })

  } catch (error) {
    console.error('分析エラー:', error)
    alert('分析中にエラーが発生しました。もう一度お試しください。')
  } finally {
    // ローディング状態を解除
    analyzeButton.disabled = false
    analyzeButton.classList.remove('loading')
  }
})

// 求人を保存
saveJobButton.addEventListener('click', () => {
  if (currentAnalysisResult) {
    const job = {
      id: Date.now(),
      jobPosting: currentAnalysisResult.jobPosting,
      priorities: currentAnalysisResult.priorities,
      results: currentAnalysisResult.results,
      timestamp: currentAnalysisResult.timestamp,
      title: extractJobTitle(currentAnalysisResult.jobPosting)
    }

    savedJobs.unshift(job)
    saveToStorage()
    renderSavedJobs()

    addToHistory('保存', `求人「${job.title}」を保存しました`)

    alert('求人を保存しました')
  }
})

// 比較ボタン
compareButton.addEventListener('click', async () => {
  const selectedJobs = getSelectedJobs()
  if (selectedJobs.length < 2) {
    alert('比較するには2件以上の求人を選択してください')
    return
  }

  // ローディング状態にする
  compareButton.disabled = true
  compareButton.classList.add('loading')
  compareButton.textContent = 'AI分析中...'

  try {
    // Dify APIを呼び出して比較結果を取得
    const comparisonResult = await compareJobsWithDify(selectedJobs, userProfile)
    
    // 結果を表示
    displayComparisonResults(comparisonResult)
    
    // 履歴に追加（AI回答も含む）
    const titles = selectedJobs.map(job => job.title).join('、')
    addToHistory('比較', `${selectedJobs.length}件の求人を比較しました（${titles}）`, comparisonResult)
  } catch (error) {
    console.error('比較エラー:', error)
    console.error('エラー詳細:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    })
    
    // より詳細なエラーメッセージを表示
    let errorMessage = '比較中にエラーが発生しました。\n\n'
    
    if (error.message.includes('APIキーが設定されていません')) {
      errorMessage = '❌ Dify APIキーが設定されていません。\n\n'
      errorMessage += '【原因】\n'
      errorMessage += 'api_key.txtが読み込めていません。\n\n'
      errorMessage += '【解決方法】\n'
      errorMessage += '1. ローカル環境: project/api_key.txtにAPIキーを設定\n'
      errorMessage += '2. 公開環境（Vercel）: 環境変数または別の方法でAPIキーを設定\n'
      errorMessage += '3. ブラウザの開発者ツール（F12）のコンソールで詳細を確認'
    } else if (error.message.includes('APIキーが無効')) {
      errorMessage = '❌ Dify APIキーが無効です。\n\n'
      errorMessage += 'api_key.txtの内容を確認してください。'
    } else if (error.message.includes('利用制限')) {
      errorMessage = '⚠️ APIの利用制限に達しました。\n\n'
      errorMessage += 'しばらく待ってから再度お試しください。'
    } else if (error.message.includes('ネットワークエラー')) {
      errorMessage = '❌ ネットワークエラーが発生しました。\n\n'
      errorMessage += 'インターネット接続を確認してください。'
    } else if (error.message.includes('応答形式')) {
      errorMessage = '❌ Dify APIからの応答形式が予期されない形式です。\n\n'
      errorMessage += 'APIの設定を確認してください。\n\n'
      errorMessage += 'エラー詳細: ' + error.message
    } else {
      errorMessage += `エラー内容: ${error.message}\n\n`
      errorMessage += '詳細はブラウザの開発者ツール（F12）のコンソールを確認してください。'
    }
    
    alert(errorMessage)
    
    // エラー情報を比較結果エリアに表示
    comparisonGrid.innerHTML = `
      <div class="result-card" style="border-left: 4px solid #ef4444;">
        <h3><span class="icon">⚠️</span>エラーが発生しました</h3>
        <div class="content">
          <p style="color: #ef4444; font-weight: 600;">${error.message || '不明なエラーが発生しました'}</p>
          <p style="margin-top: 12px; font-size: 0.875rem; color: #64748b;">
            以下の点を確認してください：<br>
            • APIキーが正しく設定されているか<br>
            • インターネット接続が正常か<br>
            • ブラウザの開発者ツール（F12）のコンソールで詳細を確認
          </p>
        </div>
      </div>
    `
    comparisonSection.classList.add('visible')
  } finally {
    // ローディング状態を解除
    compareButton.disabled = false
    compareButton.classList.remove('loading')
    const selectedCount = selectedJobs.length
    compareButton.textContent = selectedCount > 0
      ? `選択した求人を比較する（${selectedCount}件）`
      : '選択した求人を比較する'
  }
})

// 選択を解除
clearSelectionButton.addEventListener('click', () => {
  document.querySelectorAll('.saved-job-item input[type="checkbox"]').forEach(checkbox => {
    checkbox.checked = false
  })
  updateCompareButtonState()
  updateSelectedJobItems()
})

// 比較結果を閉じる
closeComparisonButton.addEventListener('click', () => {
  comparisonSection.classList.remove('visible')
})

// 履歴をすべて削除
clearHistoryButton.addEventListener('click', () => {
  if (confirm('履歴をすべて削除しますか？')) {
    history = []
    saveToStorage()
    renderHistory()
  }
})

// ==========================================
// 関数定義
// ==========================================

// プロファイルステータスの更新
function updateProfileStatus() {
  if (userProfile.jobType && userProfile.experienceYears) {
    profileStatusText.textContent = `設定済み：${userProfile.jobType}（経験${getExperienceYearsLabel(userProfile.experienceYears)}）`
  } else if (userProfile.jobType || userProfile.experienceYears) {
    profileStatusText.textContent = '一部設定済み（両方入力するとより精度が向上します）'
  } else {
    profileStatusText.textContent = 'プロファイルを入力してください'
  }
}

// 経験年数のラベルを取得
function getExperienceYearsLabel(value) {
  const labels = {
    '0-1': '未経験〜1年',
    '1-3': '1年〜3年',
    '3-5': '3年〜5年',
    '5-10': '5年〜10年',
    '10+': '10年以上'
  }
  return labels[value] || value
}

// 求人票からタイトルを抽出（簡易実装）
function extractJobTitle(jobPosting) {
  const lines = jobPosting.split('\n').filter(line => line.trim())
  if (lines.length > 0) {
    return lines[0].substring(0, 50) + (lines[0].length > 50 ? '...' : '')
  }
  return '無題の求人'
}

// 保存された求人を表示
function renderSavedJobs() {
  if (savedJobs.length === 0) {
    savedJobsList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📭</div>
        <p>まだ求人が保存されていません。<br>求人を分析後、「この求人を保存する」ボタンで保存できます。</p>
      </div>
    `
    compareButton.disabled = true
    return
  }

  savedJobsList.innerHTML = `
    <div class="saved-jobs-list">
      ${savedJobs.map(job => `
        <div class="saved-job-item" data-job-id="${job.id}">
          <input type="checkbox" data-job-id="${job.id}" onchange="window.updateCompareButtonState(); window.updateSelectedJobItems()">
          <div class="saved-job-content">
            <h4>${job.title}</h4>
            <p>${job.jobPosting.substring(0, 100)}...</p>
            <div class="saved-job-meta">
              <span>保存日時：${formatDate(job.timestamp)}</span>
            </div>
          </div>
          <div class="saved-job-actions">
            <button class="btn-small btn-delete" onclick="window.deleteJob(${job.id})">削除</button>
          </div>
        </div>
      `).join('')}
    </div>
  `

  updateCompareButtonState()
}

// 日時のフォーマット
function formatDate(isoString) {
  const date = new Date(isoString)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 求人を削除
window.deleteJob = function(jobId) {
  if (confirm('この求人を削除しますか？')) {
    savedJobs = savedJobs.filter(job => job.id !== jobId)
    saveToStorage()
    renderSavedJobs()
    addToHistory('削除', '求人を1件削除しました')
  }
}

// 比較ボタンの状態を更新
window.updateCompareButtonState = function() {
  const selectedCount = document.querySelectorAll('.saved-job-item input[type="checkbox"]:checked').length
  compareButton.disabled = selectedCount < 2
  compareButton.textContent = selectedCount > 0
    ? `選択した求人を比較する（${selectedCount}件）`
    : '選択した求人を比較する'
}

// 選択された求人アイテムの見た目を更新
window.updateSelectedJobItems = function() {
  document.querySelectorAll('.saved-job-item').forEach(item => {
    const checkbox = item.querySelector('input[type="checkbox"]')
    if (checkbox.checked) {
      item.classList.add('selected')
    } else {
      item.classList.remove('selected')
    }
  })
}

// 選択された求人を取得
function getSelectedJobs() {
  const selectedIds = Array.from(
    document.querySelectorAll('.saved-job-item input[type="checkbox"]:checked')
  ).map(checkbox => parseInt(checkbox.dataset.jobId))

  return savedJobs.filter(job => selectedIds.includes(job.id))
}

// ==========================================
// Dify API連携関数
// ==========================================

/**
 * 求人情報、職種、経験年数を自然言語で整形する
 * @param {Array} selectedJobs - 選択された求人情報の配列
 * @param {Object} userProfile - ユーザープロファイル（職種、経験年数）
 * @returns {string} - 整形された自然言語のプロンプト
 */
function formatJobComparisonPrompt(selectedJobs, userProfile) {
  let prompt = '以下の複数の求人情報を比較・整理してください。\n\n'
  
  // ユーザープロファイル情報を追加
  if (userProfile.jobType || userProfile.experienceYears) {
    prompt += '【ユーザープロファイル】\n'
    if (userProfile.jobType) {
      prompt += `希望職種：${userProfile.jobType}\n`
    }
    if (userProfile.experienceYears) {
      prompt += `経験年数：${getExperienceYearsLabel(userProfile.experienceYears)}\n`
    }
    prompt += '\n'
  }
  
  // 各求人情報を追加
  prompt += '【比較対象の求人情報】\n'
  selectedJobs.forEach((job, index) => {
    prompt += `\n--- 求人${index + 1} ---\n`
    prompt += `タイトル：${job.title}\n`
    prompt += `求人内容：\n${job.jobPosting}\n`
    if (job.priorities) {
      prompt += `重視条件：${job.priorities}\n`
    }
  })
  
  prompt += '\n【分析依頼】\n'
  prompt += '上記の求人情報を比較して、以下の観点で分析してください：\n'
  prompt += '1. 総合評価（各求人の特徴とバランス）\n'
  prompt += '2. おすすめ順（ユーザープロファイルを考慮した推奨順位）\n'
  prompt += '3. 項目別比較（給与、働き方、成長機会、企業文化など）\n'
  prompt += '4. 選考時のアドバイス（面接で確認すべきポイントなど）\n'
  prompt += '\n回答は分かりやすく、具体的にお願いします。'
  
  return prompt
}

/**
 * Dify APIを呼び出して求人比較結果を取得
 * @param {Array} selectedJobs - 選択された求人情報の配列
 * @param {Object} userProfile - ユーザープロファイル
 * @returns {Promise<string>} - AIの回答テキスト
 */
async function compareJobsWithDify(selectedJobs, userProfile) {
  // APIキーの確認
  if (!DIFY_API_KEY || DIFY_API_KEY === 'YOUR_API_KEY_HERE') {
    console.error('APIキーが設定されていません。現在の値:', DIFY_API_KEY ? '設定済み（値は非表示）' : '未設定')
    throw new Error('Dify APIキーが設定されていません。api_key.txtにAPIキーを設定してください。公開環境では、環境変数や別の方法でAPIキーを設定する必要があります。')
  }
  
  // プロンプトを整形
  const query = formatJobComparisonPrompt(selectedJobs, userProfile)
  
  try {
    // 環境判定：ローカル環境か公開環境か
    const isLocal = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1'
    
    // ローカル環境: 直接Dify APIを呼び出す（api_key.txtを使用）
    // 公開環境: サーバーサイドプロキシ経由で呼び出す（環境変数を使用）
    const apiUrl = isLocal ? DIFY_API_URL : '/api/dify-proxy'
    const headers = isLocal ? {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DIFY_API_KEY}`
    } : {
      'Content-Type': 'application/json'
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        inputs: {},
        query: query,
        response_mode: 'blocking',
        user: 'test-user'
      })
    })
    
    if (!response.ok) {
      // エラーレスポンスの詳細を取得
      let errorText = ''
      try {
        const errorData = await response.json()
        errorText = errorData.message || errorData.error || JSON.stringify(errorData)
      } catch (e) {
        errorText = await response.text()
      }
      
      console.error('Dify APIエラー:', response.status, response.statusText, errorText)
      
      const isLocal = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1'
      
      if (response.status === 401) {
        throw new Error(isLocal 
          ? 'APIキーが無効です。api_key.txtの内容を確認してください。'
          : 'APIキーが無効です。Vercelの環境変数DIFY_API_KEYを確認してください。')
      } else if (response.status === 429) {
        throw new Error('APIの利用制限に達しました。しばらく待ってから再度お試しください。')
      } else if (response.status === 500) {
        throw new Error('サーバーエラーが発生しました。Vercelの環境変数DIFY_API_KEYが設定されているか確認してください。')
      } else {
        throw new Error(`APIエラー: ${response.status} ${response.statusText} - ${errorText}`)
      }
    }
    
    const data = await response.json()
    console.log('Dify API応答:', data) // デバッグ用
    
    // Dify APIの応答形式に応じて調整
    // 一般的には data.answer または data.message に回答が含まれる
    // Difyのバージョンによって異なる可能性があるため、複数のパターンを試す
    let answer = null
    
    // パターン1: data.answer（一般的な形式）
    if (data.answer) {
      answer = data.answer
    }
    // パターン2: data.message
    else if (data.message) {
      answer = data.message
    }
    // パターン3: data.text
    else if (data.text) {
      answer = data.text
    }
    // パターン4: data.content
    else if (data.content) {
      answer = data.content
    }
    // パターン5: data.data.answer（ネストされた形式）
    else if (data.data && data.data.answer) {
      answer = data.data.answer
    }
    // パターン6: 文字列として直接返される場合
    else if (typeof data === 'string') {
      answer = data
    }
    
    if (!answer || answer.trim() === '') {
      console.error('Dify API応答形式エラー:', data)
      throw new Error('Dify APIからの応答形式が予期されない形式です。APIの設定を確認してください。応答データ: ' + JSON.stringify(data).substring(0, 200))
    }
    
    return answer
  } catch (error) {
    // ネットワークエラーの処理
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('ネットワークエラー:', error)
      throw new Error('ネットワークエラーが発生しました。インターネット接続を確認してください。')
    }
    
    // その他のエラーはそのまま再スロー
    throw error
  }
}

/**
 * 比較結果を表示する
 * @param {string} aiResponse - AIからの回答テキスト
 */
function displayComparisonResults(aiResponse) {
  // AIの回答を整形して表示
  // マークダウン形式の見出しを検出して構造化
  const formattedResponse = formatAIResponse(aiResponse)
  
  comparisonGrid.innerHTML = `
    <div class="result-card">
      <h3><span class="icon">🤖</span>AI分析結果</h3>
      <div class="content">
        ${formattedResponse}
      </div>
    </div>
  `
  
  comparisonSection.classList.add('visible')
  comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/**
 * AIの回答テキストを整形してHTMLに変換
 * @param {string} text - AIからの回答テキスト
 * @returns {string} - HTML形式のテキスト
 */
function formatAIResponse(text) {
  // 改行を<br>に変換
  let html = text.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')
  
  // 見出し（## や ###）を検出
  html = html.replace(/##\s+(.+?)(<br>|$)/g, '<h4>$1</h4>')
  html = html.replace(/###\s+(.+?)(<br>|$)/g, '<h5>$1</h5>')
  
  // リスト項目を検出
  html = html.replace(/^\d+\.\s+(.+?)(<br>|$)/gm, '<li>$1</li>')
  html = html.replace(/^[-*]\s+(.+?)(<br>|$)/gm, '<li>$1</li>')
  
  // <li>タグを<ul>で囲む
  html = html.replace(/(<li>.*?<\/li>(?:<br>)?)+/g, (match) => {
    return '<ul>' + match.replace(/<br>/g, '') + '</ul>'
  })
  
  // 段落を<p>タグで囲む
  html = '<p>' + html + '</p>'
  
  // 空の段落を削除
  html = html.replace(/<p><\/p>/g, '')
  html = html.replace(/<p>(<h[45]>)/g, '$1')
  html = html.replace(/(<\/h[45]>)<\/p>/g, '$1')
  
  return html
}

// 求人を比較（旧関数 - 後方互換性のため残す）
function compareJobs(selectedJobs) {
  // ダミーデータを表示（API連携が失敗した場合のフォールバック）
  const comparisonResult = generateComparisonDummy(selectedJobs)

  comparisonGrid.innerHTML = `
    <div class="result-card">
      <h3><span class="icon">📊</span>総合評価</h3>
      <div class="content">
        ${comparisonResult.summary}
      </div>
    </div>

    <div class="result-card">
      <h3><span class="icon">🎯</span>おすすめ順</h3>
      <div class="content">
        ${comparisonResult.ranking}
      </div>
    </div>

    <div class="result-card">
      <h3><span class="icon">⚖️</span>項目別比較</h3>
      <div class="content">
        ${comparisonResult.comparison}
      </div>
    </div>

    <div class="result-card">
      <h3><span class="icon">💡</span>選考時のアドバイス</h3>
      <div class="content">
        ${comparisonResult.advice}
      </div>
    </div>
  `

  comparisonSection.classList.add('visible')
  comparisonSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

// 比較結果のダミーデータを生成
function generateComparisonDummy(selectedJobs) {
  return {
    summary: `
      <p>${selectedJobs.length}件の求人を比較しました。</p>
      <p>以下の観点で比較・評価しています：</p>
      <ul>
        <li>給与・待遇の透明性</li>
        <li>働き方の柔軟性</li>
        <li>成長機会の明確さ</li>
        <li>企業文化とのフィット感</li>
      </ul>
    `,
    ranking: `
      <ol>
        ${selectedJobs.map((job, index) => `
          <li style="margin-bottom: 12px;">
            <strong>${job.title}</strong><br>
            <small style="color: #64748b;">
              ${index === 0 ? '最もバランスが取れています' :
                index === 1 ? '給与面で優位性があります' :
                '働き方の柔軟性が魅力です'}
            </small>
          </li>
        `).join('')}
      </ol>
    `,
    comparison: `
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="border-bottom: 2px solid #e2e8f0;">
            <th style="text-align: left; padding: 8px;">項目</th>
            ${selectedJobs.map(job => `
              <th style="text-align: center; padding: 8px; font-size: 0.875rem;">
                ${job.title.substring(0, 15)}...
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px;">給与透明性</td>
            ${selectedJobs.map(() => '<td style="text-align: center; padding: 8px;">⭐⭐⭐⭐</td>').join('')}
          </tr>
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 8px;">リモート可</td>
            ${selectedJobs.map(() => '<td style="text-align: center; padding: 8px;">✓</td>').join('')}
          </tr>
          <tr>
            <td style="padding: 8px;">成長機会</td>
            ${selectedJobs.map(() => '<td style="text-align: center; padding: 8px;">⭐⭐⭐</td>').join('')}
          </tr>
        </tbody>
      </table>
      <p style="margin-top: 16px; font-size: 0.875rem; color: #64748b;">
        ※ この比較結果はダミーデータです。実際のAPI連携時には詳細な分析結果が表示されます。
      </p>
    `,
    advice: `
      <ul>
        <li>面接では各社の「チーム体制」と「開発プロセス」を必ず確認しましょう</li>
        <li>リモートワークの実態（頻度、制限事項）を具体的に聞くことをおすすめします</li>
        <li>評価制度やキャリアパスについて、実例を交えて質問すると良いでしょう</li>
      </ul>
    `
  }
}

// 履歴を表示
function renderHistory() {
  if (history.length === 0) {
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="icon">📝</div>
        <p>まだ履歴がありません。<br>分析や比較を行うと、自動的に履歴が保存されます。</p>
      </div>
    `
    clearHistoryButton.style.display = 'none'
    return
  }

  clearHistoryButton.style.display = 'block'

  historyList.innerHTML = `
    <div class="history-list">
      ${history.map(item => `
        <div class="history-item">
          <div class="history-item-header">
            <h4>${item.type}：${item.description}</h4>
            <span class="history-item-date">${formatDate(item.timestamp)}</span>
          </div>
          ${item.aiResponse ? `
            <div class="history-item-ai-response">
              <details>
                <summary>AI分析結果を表示</summary>
                <div class="ai-response-content">${formatAIResponse(item.aiResponse)}</div>
              </details>
            </div>
          ` : ''}
        </div>
      `).join('')}
    </div>
  `
}

// 履歴に追加
function addToHistory(type, description, aiResponse = null) {
  const historyItem = {
    type,
    description,
    timestamp: new Date().toISOString()
  }
  
  // AI回答がある場合は追加
  if (aiResponse) {
    historyItem.aiResponse = aiResponse
  }
  
  history.unshift(historyItem)

  // 履歴は最大50件まで
  if (history.length > 50) {
    history = history.slice(0, 50)
  }

  saveToStorage()
  renderHistory()
}

// API呼び出し関数（後でfetchに差し替え可能）
async function analyzeJobPosting(jobPosting, priorities, userProfile) {
  // 【Dify API連携予定】
  // 実際のAPI呼び出しに差し替える場合は、以下のようなコードを使用
  /*
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jobPosting,
      priorities,
      jobType: userProfile.jobType,
      experienceYears: userProfile.experienceYears
    }),
  })

  if (!response.ok) {
    throw new Error('API呼び出しに失敗しました')
  }

  return await response.json()
  */

  // ダミーデータを返す（APIが実装されるまでの仮実装）
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        summary: `
          <ul>
            <li>職種：Webアプリケーションエンジニア</li>
            <li>雇用形態：正社員</li>
            <li>勤務地：東京都渋谷区（リモート可）</li>
            <li>給与：年収500万円〜800万円（経験による）</li>
            <li>勤務時間：フレックスタイム制（コアタイム 11:00-16:00）</li>
            <li>福利厚生：社会保険完備、交通費全額支給</li>
          </ul>
        `,
        strengths: `
          <ul>
            <li>リモートワーク可能で柔軟な働き方ができる</li>
            <li>フレックスタイム制で勤務時間の調整がしやすい</li>
            <li>給与レンジが明示されており、透明性がある</li>
            <li>技術スタックが明記されており、業務内容がイメージしやすい</li>
          </ul>
        `,
        concerns: `
          <ul>
            <li>リモートワークの頻度や条件が明記されていない</li>
            <li>チーム体制や開発プロセスの記載が少ない</li>
            <li>キャリアパスや評価制度についての情報が不足している</li>
            <li>残業時間の目安が記載されていない</li>
          </ul>
        `,
        questions: `
          <ul>
            <li>リモートワークは週何日程度可能でしょうか？</li>
            <li>開発チームの規模と役割分担について教えてください</li>
            <li>技術的な意思決定はどのように行われますか？</li>
            <li>平均的な月の残業時間はどれくらいでしょうか？</li>
            <li>評価制度やキャリアパスについて具体的に教えてください</li>
            <li>技術的な学習や成長を支援する制度はありますか？</li>
          </ul>
        `
      })
    }, 1500) // 1.5秒の遅延でAPIコールをシミュレート
  })
}

// 結果を表示する関数
function displayResults(results) {
  document.getElementById('summary').innerHTML = results.summary
  document.getElementById('strengths').innerHTML = results.strengths
  document.getElementById('concerns').innerHTML = results.concerns
  document.getElementById('questions').innerHTML = results.questions
}
