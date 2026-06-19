const express = require('express');
const fs = require('fs');
const path = require('path');
const { maskSensitiveData } = require('./masker');

const DEFAULT_KEYWORDS = (process.env.MASK_KEYWORDS || '').split(',').filter(Boolean);

const app = express();
const PORT = process.env.PORT || 3000;
const LOG_DIR = path.join(__dirname, 'logs');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>日志脱敏工具</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
        h1 { color: #333; }
        .card { background: #fff; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        button { background: #007bff; color: #fff; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
        textarea { width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-family: monospace; }
        pre { background: #f8f9fa; padding: 15px; border-radius: 4px; overflow-x: auto; white-space: pre-wrap; }
        .log-list { list-style: none; padding: 0; }
        .log-list li { padding: 8px 12px; margin: 4px 0; background: #f0f0f0; border-radius: 4px; cursor: pointer; }
        .log-list li:hover { background: #e0e0e0; }
      </style>
    </head>
    <body>
      <h1>📋 日志脱敏工具</h1>
      
      <div class="card">
        <h3>📝 日志文件列表</h3>
        <ul class="log-list" id="logList">加载中...</ul>
      </div>

      <div class="card">
        <h3>� 自定义脱敏关键词</h3>
        <input type="text" id="keywordsInput" placeholder="输入关键词，逗号分隔，如：张三,李四,password" style="width:100%;padding:10px;border:1px solid #ddd;border-radius:4px;box-sizing:border-box;" />
        <p style="color:#888;font-size:12px;">留空则仅使用内置规则（手机号、身份证号），也可通过环境变量 MASK_KEYWORDS 配置默认关键词</p>
      </div>

      <div class="card">
        <h3>� 输入文本脱敏</h3>
        <textarea id="inputText" placeholder="在此输入包含手机号和身份证号的日志文本..."></textarea>
        <br><br>
        <button onclick="maskText()">脱敏处理</button>
        <br><br>
        <h4>脱敏结果：</h4>
        <pre id="outputText"></pre>
      </div>

      <script>
        function getKeywords() {
          const raw = document.getElementById('keywordsInput').value.trim();
          return raw ? raw.split(/[,，]/).map(k => k.trim()).filter(Boolean) : [];
        }

        async function loadLogList() {
          const res = await fetch('/api/logs');
          const files = await res.json();
          const list = document.getElementById('logList');
          if (files.length === 0) {
            list.innerHTML = '<li>暂无日志文件</li>';
            return;
          }
          list.innerHTML = files.map(f => \`<li onclick="viewLog('\${f}')">📄 \${f}</li>\`).join('');
        }

        async function viewLog(filename) {
          const keywords = getKeywords();
          const params = new URLSearchParams();
          if (keywords.length > 0) params.set('keywords', keywords.join(','));
          const res = await fetch(\`/api/logs/\${encodeURIComponent(filename)}?\${params}\`);
          const data = await res.json();
          document.getElementById('inputText').value = data.content;
          document.getElementById('outputText').textContent = data.masked;
        }

        async function maskText() {
          const text = document.getElementById('inputText').value;
          const keywords = getKeywords();
          const res = await fetch('/api/mask', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, keywords })
          });
          const data = await res.json();
          document.getElementById('outputText').textContent = data.masked;
        }

        loadLogList();
      </script>
    </body>
    </html>
  `);
});

app.get('/api/logs', (req, res) => {
  if (!fs.existsSync(LOG_DIR)) {
    return res.json([]);
  }
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.log') || f.endsWith('.txt'));
  res.json(files);
});

app.get('/api/logs/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(LOG_DIR, filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const keywords = req.query.keywords
    ? req.query.keywords.split(/[,，]/).map(k => k.trim()).filter(Boolean)
    : DEFAULT_KEYWORDS;

  const content = fs.readFileSync(filePath, 'utf-8');
  const masked = maskSensitiveData(content, keywords);

  res.json({
    filename,
    content,
    masked,
    keywords
  });
});

app.post('/api/mask', (req, res) => {
  const { text, keywords: bodyKeywords } = req.body;
  if (typeof text !== 'string') {
    return res.status(400).json({ error: '参数 text 必须是字符串' });
  }
  const keywords = Array.isArray(bodyKeywords) && bodyKeywords.length > 0
    ? bodyKeywords.map(String).filter(Boolean)
    : DEFAULT_KEYWORDS;
  const masked = maskSensitiveData(text, keywords);
  res.json({ masked, keywords });
});

if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`🚀 日志脱敏服务已启动: http://localhost:${PORT}`);
  console.log(`📂 日志目录: ${LOG_DIR}`);
});

module.exports = app;
