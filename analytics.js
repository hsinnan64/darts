// 共用網站流量統計（Cloudflare Web Analytics）。
// index.html / privacy.html / sponsor.html 都用
// <script src="analytics.js"></script> 引用這支檔案。
//
// 為什麼選 Cloudflare Web Analytics（而不是 Google Analytics）：
//   本服務主打「影片完全在本機處理」，不適合再引入會寫 Cookie、
//   建立跨站個人識別的追蹤工具。Cloudflare Web Analytics 不使用 Cookie、
//   不使用 localStorage、不做跨站追蹤，只統計整體瀏覽量與來源，
//   隱私權政策的「不使用 Cookie」這句話因此仍然成立。
//
// 設定方式（只需做一次）：
//   1. 登入 Cloudflare → Analytics & Logs → Web Analytics → Add a site
//   2. hostname 填 hsinnan64.github.io
//      （只填主機名稱，不要加 https:// 也不要加 /darts 路徑，否則會被擋下來。
//        範圍雖然是整個 github.io 子網域，但只有引用本檔案的頁面才會回報，
//        所以實際上只統計得到本專案的三個頁面。）
//   3. 它會給一段 beacon 程式碼，裡面有 "token": "xxxxxxxx"
//   4. 把那串 token 貼到下面的 TOKEN
//
// TOKEN 留空時這支腳本什麼都不做，不會發出任何連線——
// 所以在本機開發或還沒申請 token 時，可以安心保持空字串。
//
// 註：token 公開在原始碼裡是正常的，Cloudflare 的 beacon token 本來就設計成
//     會出現在網頁原始碼中，它只用來識別「資料要記到哪個網站」，不是密鑰。
(function () {
    var TOKEN = "420ceac426524d1cad73c1e7c3fb9c1a";

    if (!TOKEN) return;

    // type="module" 是 Cloudflare 目前官方 snippet 的形式。
    // module script 本來就是延後到文件解析完才執行（等同 defer），
    // 因此不會擋住主要內容與 MediaPipe 模型的下載，也不需要再加 defer。
    var script = document.createElement("script");
    script.type = "module";
    script.src = "https://static.cloudflareinsights.com/beacon.min.js";
    script.setAttribute("data-cf-beacon", JSON.stringify({ token: TOKEN }));

    (document.head || document.documentElement).appendChild(script);
})();
