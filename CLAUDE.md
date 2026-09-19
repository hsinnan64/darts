# 給 AI 助理與未來的自己的專案筆記

這份檔案記錄「看程式碼看不出來」的決策與踩過的坑。換電腦、換 AI 助理時先讀這份，
可以少走很多冤枉路。純靜態專案，沒有建置流程、沒有測試框架。

最後更新：2026-09-19

---

## 專案本質

純前端單頁應用，部署在 GitHub Pages（https://hsinnan64.github.io/darts/）。
沒有後端、沒有資料庫、沒有 npm、沒有 build step。改完直接 push，Pages 約 40 秒後生效。

檔案分工：

| 檔案 | 內容 |
|---|---|
| `index.html` | 主程式，所有分析邏輯與 i18n 都在裡面的 `<script type="module">` |
| `site.css` | 三頁共用的基礎樣式 |
| `copyright.js` | 三頁共用的版權資訊（姓名、年份） |
| `analytics.js` | 三頁共用的 GA4 載入與 Cookie 同意橫幅 |
| `privacy.html` / `sponsor.html` | 內容頁，只有中文 |

---

## 一、關於金鑰與機密（重要，容易誤解）

**靜態網站藏不住任何東西。** 只要是瀏覽器需要用到的值，使用者按 F12
或看原始碼就能拿到。沒有「寫在前端但不會被讀取」這種東西，別嘗試，
任何宣稱做得到的作法（混淆、Base64、拆字串）都只是自欺欺人。

### 這些「看起來像金鑰」的東西其實是公開識別碼，放在 repo 裡是正確的

| 值 | 位置 | 為什麼不是機密 |
|---|---|---|
| GA4 評估 ID `G-15R313PJM5` | `analytics.js` | 只標示資料記到哪個帳號。拿到的人無法讀報表、無法改設定，最多灌假流量 |

Google 官方的安裝方式就是把它直接寫在網頁原始碼裡。

### 真正的機密：絕對不能進 repo

- GitHub Personal Access Token / 密碼
- 任何 `*_secret`、`*_key`、`.env` 類的檔案
- 私鑰（`.pem`、`.key`、`.pfx`）

這些的正確位置是**作業系統的憑證管理機制**，不是檔案、更不是 repo。
本專案目前的作法：GitHub 認證交給 `gh` CLI，token 存在 Windows 認證管理員
（keyring），完全不落地成檔案。`.gitignore` 已針對上述樣式設防，
但那只是最後一道防線，不是可以依賴的第一道。

**如果哪天真的需要藏東西**（例如要呼叫一個有付費額度的 API），
唯一的正解是加一層後端代理，由後端保管金鑰。前端沒有其他選項。

---

## 二、統計工具：為什麼從 Cloudflare 換成 GA4

2026-09-19 一天之內換了兩次，過程與理由記在這裡，避免再繞一圈。

1. **先裝 Cloudflare Web Analytics** — 因為本站主打「影片不離開裝置」，
   選了無 Cookie 的工具，隱私權政策衝擊最小。
2. **發現問題** — Cloudflare 無 Cookie，因此**無法提供「不重複使用者」數字**。
   它只有 Visits（站外連入次數），同一個人隔天再來會重複計算。
   使用者真正想知道的是「多少人看過」，Cloudflare 給不了。
3. **改用 GA4** — GA4 靠 `_ga` Cookie 去重，能給「使用者（Users）」數字。
   代價是要寫 Cookie，所以加了同意機制。

### 目前的同意機制：比 Google Consent Mode 更嚴格

**在使用者按下「同意」之前，完全不載入 `gtag.js`** — 對 Google 零連線、零 Cookie。

這是刻意的選擇。Google Consent Mode 的「預設拒絕」仍會送出無 Cookie 訊號給
Google，而這裡連下載都不做。代價是拒絕的人完全沒有任何數據
（Consent Mode 至少有匿名模型化數據）。

如果哪天覺得數字低到沒有參考價值，可以改回標準 Consent Mode，
但那是**產品決策，要先問過擁有者**，不要自己改掉。

### 數字偏低是預期內的，不是 bug

- 只有按「同意」的人會被計入
- 擋廣告的擴充套件會擋掉 GA（比例比 Cloudflare 高很多，GA 是主要封鎖目標）

### 改統計工具時，隱私權政策一定要同步改

`privacy.html` 有具體承諾，程式與政策不一致是真的問題，不是文件沒跟上：

- 第二節：Cookie 使用聲明、預設不追蹤的承諾
- 第三節：第三方服務表格、Cookie 一覽表（含 `_ga_15R313PJM5` 這種帶 ID 的名稱）、退出方式
- 頁首「最後更新日期」

---

## 三、程式結構上的約定

### i18n 只涵蓋 index.html

`index.html` 支援 zh / en / ja / ko，翻譯表 `I18N` 在
`<script type="module">` 內部。**module scope 外部讀不到**。

因此 `analytics.js` 的同意橫幅自帶一份小翻譯表（`TEXT`），不共用。
語言來源一致：兩邊都讀 `localStorage.darts_lang`。

`index.html` 的 `setLanguage()` 會發出 `darts:langchange` 事件，
橫幅監聽它來重繪。**新增 module 外的 UI 時，跟著訂閱這個事件即可。**

`privacy.html` / `sponsor.html` 只有中文，靠瀏覽器翻譯。

### CSS 分工

`site.css` 只放「至少兩頁長得一樣」的東西。單頁專用的樣式留在各自的
`<style>` 裡。各頁 `<style>` 必須放在 `site.css` 的 `<link>` **之後**，
同權重時後者勝出，所以覆寫不需要 `!important`。

卡片寬度用 CSS 變數 `--container-max`（index 960 / privacy 860 / sponsor 720）。

### 改版時要同步更新版本號的兩個地方

`index.html` 開頭註解已經寫了，這裡再強調一次，很容易漏：

1. 檔案開頭註解的「版本：」與「最後更新：」
2. 頁尾 `#versionNumber` 與 `#lastUpdated` 兩個 span

**時間必須去讀系統時鐘，不要憑感覺估。** 2026-09-19 這天連續幾版都被填成
下午三、四點，實際上是晚上十點多，使用者一眼就看出不對。動手前先跑：

```powershell
Get-Date -Format "yyyy-MM-dd HH:mm"
```

（v2.11～v2.14 的時間戳當時是錯的，v2.15 起才是真實時間。）

### 軌跡的出手偵測

軌跡**只在手腕高過手肘的期間**累積：舉起來才畫，放下去就停。
細節見 README 的「關於出手偵測」。

**這裡改過兩次，兩次都是誤解需求：**

1. 第一版做成水平的前後關係（手腕越過手肘往鏢靶方向），還為此寫了用鼻子
   推斷面向的邏輯。實際要的是**垂直高度**。改成高度後不必判斷面向，
   程式更簡單，正面拍攝也能用。
2. 第二版做成一次性觸發（`throwStarted` 一旦成立就永遠累積到影片結束）。
   實際要的是**即時開關**——低於手肘就要停止累積。

現在是即時開關 + 遲滯（`THROW_START_MARGIN` 0.02 進、`THROW_STOP_MARGIN` 0 出）。
兩個門檻不能相同，否則手腕停在手肘高度附近時會每幀反覆開關。

軌跡因此改成分段結構 `trace.segments`（段的陣列），一段就是一鏢。
**不要把它退回成單一陣列**——那會讓第二次舉手時，畫面上從上一段結尾
拉一條直線到新起點，出現實際上不存在的軌跡。

### 軌跡配色：依鏢次，不依部位

同一鏢的四條線共用一個顏色，下一鏢換色（`THROW_COLORS`，9 色循環）。

調色盤是算出來的不是憑感覺挑的：色相平均分布（每 40 度），亮度逐色微調
讓純黑背景上的對比都在 6:1 以上。**要改顏色請一併驗算色相間距與對比**，
純藍在黑底上特別容易暗到看不清楚。
目的是比較每一鏢之間的落差。部位靠位置區分，不靠顏色。

`throwIndex` 從 1 起算，`throwColor()` 查表時減 1，第 1 鏢才對到第一個顏色。

**顏色索引存在每一段的 `throwIndex` 欄位裡，不要改成用陣列位置算**——
舊的段會因為 `MAX_TRACE_POINTS` 上限被丟棄，用位置算會讓剩下的段
顏色整批位移。

四條線的鏢次天生對齊：段是在 `pushTracePoint()` 時依當下的 `throwIndex`
建立的，不需要額外同步機制。

### 軌跡平滑用 Catmull-Rom

出手快時相鄰點距離大，直接連線是生硬直線。繪製時用 Catmull-Rom 插值，
曲線通過每個實際偵測點，插值密度跟著點距自適應（`TRACE_SAMPLE_PX`）。

**這只讓線變順，沒有還原沒拍到的動作**——跟使用者溝通時不要說成
「提高了追蹤精度」。真正的解法是提高拍攝幀率。

座標系陷阱：正規化座標的 y 軸**向下增加**，所以「手腕高於手肘」是
`elbow.y - wrist.y > 門檻`，不要直覺寫成 `wrist.y > elbow.y`。

### 頭部代表點

`computeHeadPoint()` 回傳的點同時決定**頭部軌跡**與**骨架上的頭部點＋頸線**，
改一處三個地方會一起動。

原本用耳朵往上推估「頭頂」（`HEAD_TOP_RATIO = 1.35`），實際使用覺得太高、
離身體太遠，2026-09-19 改成直接取**眼睛高度**。想調高低改 `HEAD_POINT_RAISE`
（單位是臉部尺寸，0 ＝眼睛、0.5 ＝額頭、1.35 ＝舊版頭頂）。

眼睛看不到時依序退回耳朵、鼻子，避免整顆頭在畫面上消失。

**注意**：`updateTraces()` 裡那個「還沒出手就 return」的判斷，
必須放在移動量累積與投擲手判定**之後**。那兩件事要全程執行，
否則等到出手時還來不及判斷是哪隻手。

---

## 四、這台電腦的環境（2026-09-19 設定）

原本什麼都沒有，當天裝的，都是 user scope、不需要管理員：

| 工具 | 版本 | 備註 |
|---|---|---|
| MinGit | 2.55.0 | `winget install Git.MinGit` |
| GitHub CLI | 2.101.0 | `winget install GitHub.cli` |

### 踩過的坑

**`winget install Git.Git` 會失敗**（exit 12）——
標準版 Git 安裝程式需要系統管理員權限，UAC 提權被取消就掛掉。
改用 **`Git.MinGit`**（免安裝 zip），不需要管理員。

**winget 裝完後，既有的終端機分頁仍找不到指令** —— PATH 是安裝當下才更新的。
要開新分頁，或在現有 session 裡手動刷新：

```powershell
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","User") + ";" + [System.Environment]::GetEnvironmentVariable("Path","Machine")
```

**MinGit 不含 Git Credential Manager** —— push 需要認證。
解法是裝 `gh` 並執行 `gh auth login --web`，再 `gh auth setup-git`。
token 存在 keyring，不會寫進設定檔。

**PowerShell 5.1 把 git 的 stderr 當成錯誤** —— `git push` 成功時
仍會印出紅字 `NativeCommandError`，那是 PowerShell 的行為，不是 push 失敗。
判斷成功與否要看 `git status` 或輸出裡的 `bd8dad5..510369e main -> main`。

**這台沒有 node，也沒有可用的 python**（`python.exe` 是 Microsoft Store 的
轉接 stub，執行會失敗）。所以不能用 `npx serve` / `python -m http.server`
做本機預覽。曾嘗試用 PowerShell TcpListener 自製靜態伺服器，**沒有成功**
（連線被中止，未查出原因），不建議再花時間走這條路。

**本機預覽的實際作法**：直接開 `file://` 會讓工具把頁面轉成 `data:` 快照，
相對路徑的 `site.css` / `analytics.js` 因此載不到，看到的會是沒有樣式的頁面
——**那是預覽機制的限制，不是程式壞掉**。目前最可靠的驗證方式是
push 之後直接開線上版檢查。

---

## 五、驗證習慣

沒有測試框架，但純函式可以在瀏覽器 console 直接驗。
例如出手偵測的 `hasWristPassedElbow()`，用合成的關鍵點物件餵進去，
涵蓋面向左／右、門檻邊界、正面拍攝無法判定等案例，幾秒就能確認邏輯。

改統計或同意機制後，務必實際確認這幾件事：

1. 首次造訪：橫幅出現、**沒有** `googletagmanager` 的 script、**沒有** `_ga` Cookie
2. 按同意後：橫幅消失、`_ga` 與 `_ga_15R313PJM5` 兩個 Cookie 出現、GA script 載入
3. 按拒絕後：重新整理不再出現橫幅，且仍然沒有任何 GA 連線
