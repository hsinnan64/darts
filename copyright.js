// 共用版權資訊。index.html / privacy.html / sponsor.html 都用
// <script src="copyright.js"></script> 引用這支檔案。
//
// 之後要改著作權人姓名，只要改這裡的 HOLDER，三個頁面會同步更新，
// 不用再一頁一頁找。年份也不用每年手動改，自動取當下年份。
//
// 用法：
//   年份：頁面上放 <span data-copyright-year>2026</span>（2026 只是沒執行 JS 時的備援顯示）
//   姓名：頁面上放 <span data-copyright-holder>葉信男 YEH HSIN NAN</span>
// 這支腳本載入後會自動找到頁面上所有這類元素並填入正確內容。
(function () {
    var HOLDER = "葉信男 YEH HSIN NAN";
    var YEAR = new Date().getFullYear();

    // 其他程式（例如 index.html 的語言切換）可以讀 window.SITE_COPYRIGHT
    // 取得同一份年份/姓名，不用各自重算一次
    window.SITE_COPYRIGHT = { holder: HOLDER, year: YEAR };

    function fill() {
        document.querySelectorAll("[data-copyright-year]").forEach(function (el) {
            el.textContent = YEAR;
        });
        document.querySelectorAll("[data-copyright-holder]").forEach(function (el) {
            el.textContent = HOLDER;
        });

        // meta 標籤內容瀏覽器不會顯示給使用者看，但一併更新，
        // 避免搜尋引擎或其他工具讀到過期的年份
        var metaCopyright = document.querySelector('meta[name="copyright"]');
        if (metaCopyright) {
            metaCopyright.setAttribute(
                "content",
                "Copyright © " + YEAR + " " + HOLDER + ". All Rights Reserved."
            );
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", fill);
    } else {
        fill();
    }
})();
