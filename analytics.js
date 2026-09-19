// 共用網站流量統計（Google Analytics 4）＋ Cookie 同意橫幅。
// index.html / privacy.html / sponsor.html 都用
// <script src="analytics.js"></script> 引用這支檔案。
//
// ── 設定方式（只需做一次）────────────────────────────────
//   1. 到 https://analytics.google.com 建立「資源（Property）」
//   2. 資源內建立「資料串流 → 網站」，網址填 https://hsinnan64.github.io/darts/
//   3. 建好後會給一組「評估 ID」，格式是 G-XXXXXXXXXX
//   4. 把那組 ID 貼到下面的 MEASUREMENT_ID
//
//   MEASUREMENT_ID 留空時，橫幅不會出現、GA 也不會載入，
//   整支腳本等於停用——本機開發不會污染統計數字。
//
// ── 同意機制：預設不追蹤 ──────────────────────────────
//   GA4 會在瀏覽器寫入 Cookie（_ga、_ga_XXXXXXXXXX）來辨識回訪者，
//   這是「不重複使用者」數字的來源，但也因此屬於需要告知與同意的追蹤技術。
//
//   本檔案採取最保守的作法：**在使用者按下「同意」之前，
//   完全不載入 Google Analytics**——不發出任何對 Google 的連線、
//   不寫入任何 Cookie。這比 Google Consent Mode 的「預設拒絕」更嚴格：
//   Consent Mode 即使在拒絕狀態下，仍會送出無 Cookie 的訊號給 Google，
//   而這裡是連 gtag.js 都不去下載。
//
//   使用者的選擇記錄在 localStorage 的 darts_analytics_consent
//   （值為 "granted" 或 "denied"）。這一項屬於「記住使用者的隱私選擇」，
//   本身不用於追蹤，也不會傳送到任何伺服器。
//
// ── 關於多語系 ────────────────────────────────────
//   橫幅文案有自己的一份小翻譯表（見下方 TEXT）。
//   index.html 的 I18N 表在 module scope 裡，外部腳本讀不到，
//   所以不共用，但語言來源一致：都讀 localStorage 的 darts_lang。
//   index.html 切換語言時會發出 darts:langchange 事件，這裡跟著重繪。
(function () {
    var MEASUREMENT_ID = "G-15R313PJM5";

    var CONSENT_KEY = "darts_analytics_consent";
    var LANG_KEY = "darts_lang";
    var GRANTED = "granted";
    var DENIED = "denied";

    // 橫幅文案。語言代碼與 index.html 的 LANG_LABELS 一致（zh / en / ja / ko）。
    // 缺翻譯時一律退回 zh，跟 index.html 的 t() 行為相同。
    var TEXT = {
        message: {
            zh: "本站使用 Google Analytics 統計造訪人數，這會在您的瀏覽器寫入 Cookie。您的影片與分析結果不受影響，一律只在您的裝置本機處理，不會上傳。",
            en: "This site uses Google Analytics to count visits, which stores cookies in your browser. Your videos and analysis results are unaffected — they are processed entirely on your own device and never uploaded.",
            ja: "本サイトはアクセス数の計測に Google Analytics を使用しており、ブラウザに Cookie が保存されます。動画と解析結果には影響しません。すべてお使いの端末内で処理され、アップロードされることはありません。",
            ko: "이 사이트는 방문자 수 집계를 위해 Google Analytics를 사용하며, 브라우저에 쿠키를 저장합니다. 동영상과 분석 결과는 영향을 받지 않으며, 모두 사용자 기기에서만 처리되고 업로드되지 않습니다."
        },
        policy: {
            zh: "隱私權政策",
            en: "Privacy Policy",
            ja: "プライバシーポリシー",
            ko: "개인정보처리방침"
        },
        accept: { zh: "同意", en: "Accept", ja: "同意する", ko: "동의" },
        reject: { zh: "拒絕", en: "Decline", ja: "拒否する", ko: "거부" }
    };

    // localStorage 在無痕模式、企業政策、沙盒 iframe 等環境會直接拋錯。
    // 讀寫失敗都必須靜默吞掉：統計功能壞掉可以接受，把整個網站弄掛不行。
    // （index.html 的語言設定也是同樣的處理原則）
    function safeGet(key) {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            return null;
        }
    }

    function safeSet(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            // 存不起來就只是這次的選擇不會被記住，下次再問一次，不影響本次行為
        }
    }

    function currentLang() {
        var lang = safeGet(LANG_KEY);
        return TEXT.message[lang] ? lang : "zh";
    }

    function t(key) {
        return TEXT[key][currentLang()] || TEXT[key].zh;
    }

    // privacy.html 自己也會載入這支腳本，橫幅上的連結要指向自己會變成原地打轉，
    // 所以在隱私權政策頁面就不顯示那個連結
    function isPrivacyPage() {
        return /privacy\.html$/i.test(location.pathname);
    }

    // ── Google Analytics 4 ────────────────────────────
    // 只有在使用者明確同意後才會被呼叫
    function loadGA() {
        if (!MEASUREMENT_ID || window.__dartsGALoaded) return;
        window.__dartsGALoaded = true;

        window.dataLayer = window.dataLayer || [];
        function gtag() {
            window.dataLayer.push(arguments);
        }
        window.gtag = gtag;

        gtag("js", new Date());

        // 本服務沒有廣告，廣告相關的儲存一律維持拒絕；
        // 只開啟分析用途所需的 analytics_storage
        gtag("consent", "default", {
            ad_storage: DENIED,
            ad_user_data: DENIED,
            ad_personalization: DENIED,
            analytics_storage: GRANTED
        });

        gtag("config", MEASUREMENT_ID);

        var script = document.createElement("script");
        script.async = true;
        script.src = "https://www.googletagmanager.com/gtag/js?id=" + MEASUREMENT_ID;
        (document.head || document.documentElement).appendChild(script);
    }

    // ── 同意橫幅 ─────────────────────────────────────
    var bannerEl = null;

    // 樣式直接由腳本注入，三個頁面都不必各自改 <style>，
    // 之後新增頁面也只要引用這支檔案就會自動帶樣式
    function injectStyles() {
        if (document.getElementById("dartsConsentStyle")) return;

        var css =
            "#dartsConsent{position:fixed;left:0;right:0;bottom:0;z-index:9999;" +
            "display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:10px 16px;" +
            "padding:14px 16px;background:#f9fbff;border-top:1px solid #dbeafe;" +
            "box-shadow:0 -4px 16px rgba(15,23,42,0.10);font-family:'Segoe UI',Arial,sans-serif;}" +
            "#dartsConsent .consent-text{color:#334155;font-size:13px;line-height:1.7;" +
            "max-width:640px;flex:1 1 320px;}" +
            "#dartsConsent .consent-text a{color:#1d4ed8;}" +
            "#dartsConsent .consent-actions{display:flex;gap:8px;flex:0 0 auto;}" +
            "#dartsConsent button{border:none;border-radius:999px;padding:9px 20px;" +
            "font-size:13px;font-weight:600;cursor:pointer;transition:opacity 0.15s;}" +
            "#dartsConsent button:hover{opacity:0.88;}" +
            "#dartsConsent .consent-accept{background:#60a5fa;color:#eff6ff;}" +
            "#dartsConsent .consent-reject{background:#e2e8f0;color:#475569;}" +
            // 手機上橫幅會佔掉畫面底部，讓按鈕整排撐滿比較好按
            "@media (max-width:600px){#dartsConsent .consent-actions{width:100%;}" +
            "#dartsConsent button{flex:1;}}";

        var style = document.createElement("style");
        style.id = "dartsConsentStyle";
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    function renderBannerText() {
        if (!bannerEl) return;

        var textEl = bannerEl.querySelector(".consent-text");
        var link = isPrivacyPage()
            ? ""
            : ' <a href="privacy.html">' + t("policy") + "</a>";

        // 文案來自本檔案的 TEXT 常數，不是使用者輸入，用 innerHTML 夾帶連結是安全的
        textEl.innerHTML = t("message") + link;

        bannerEl.querySelector(".consent-accept").textContent = t("accept");
        bannerEl.querySelector(".consent-reject").textContent = t("reject");
    }

    function removeBanner() {
        if (bannerEl && bannerEl.parentNode) {
            bannerEl.parentNode.removeChild(bannerEl);
        }
        bannerEl = null;
    }

    function decide(choice) {
        safeSet(CONSENT_KEY, choice);
        removeBanner();
        if (choice === GRANTED) loadGA();
    }

    function showBanner() {
        injectStyles();

        bannerEl = document.createElement("div");
        bannerEl.id = "dartsConsent";
        bannerEl.setAttribute("role", "dialog");
        bannerEl.setAttribute("aria-live", "polite");
        bannerEl.innerHTML =
            '<div class="consent-text"></div>' +
            '<div class="consent-actions">' +
            '<button type="button" class="consent-reject"></button>' +
            '<button type="button" class="consent-accept"></button>' +
            "</div>";

        bannerEl.querySelector(".consent-accept").onclick = function () {
            decide(GRANTED);
        };
        bannerEl.querySelector(".consent-reject").onclick = function () {
            decide(DENIED);
        };

        renderBannerText();
        document.body.appendChild(bannerEl);
    }

    // ── 進入點 ──────────────────────────────────────
    function init() {
        if (!MEASUREMENT_ID) return;

        var saved = safeGet(CONSENT_KEY);

        if (saved === GRANTED) {
            loadGA();
            return;
        }

        // 已明確拒絕過就安靜地什麼都不做，不再重複詢問
        if (saved === DENIED) return;

        showBanner();
    }

    // index.html 右上角切換語言時會發這個事件，橫幅還開著就跟著換語言
    document.addEventListener("darts:langchange", renderBannerText);

    // 其他程式（例如日後想做「重新選擇隱私設定」的連結）可以呼叫這兩個
    window.SITE_ANALYTICS = {
        reopen: function () {
            if (!MEASUREMENT_ID || bannerEl) return;
            showBanner();
        },
        consent: function () {
            return safeGet(CONSENT_KEY);
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
