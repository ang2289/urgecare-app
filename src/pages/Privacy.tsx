// 此頁內容須與 public/privacy.html 維持一致，擇一保留即可。

import React from 'react';

const Privacy = () => {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">隱私權政策（urgecare-app）</h1>
      <p className="mb-4">最後更新：2025-09-04</p>
      <ol className="list-decimal pl-6 space-y-4">
        <li>
          <strong>適用範圍：</strong>
          本政策適用於 urgecare-app（網址：https://你的部署網域（若未定，先填 https://example.com）；開源倉庫：https://github.com/ang2289/urgecare-app）。
        </li>
        <li>
          <strong>我們蒐集哪些資料：</strong>
          預設為「不蒐集、不上傳、不建立伺服器端帳號」；所有資料僅儲存在使用者裝置（IndexedDB / LocalStorage）。
          <ul className="list-disc pl-6">
            <li>日記</li>
            <li>SOS 延遲</li>
            <li>番茄鐘</li>
            <li>待辦</li>
            <li>祈禱/念誦記錄</li>
            <li>願望清單</li>
            <li>番茄預設</li>
            <li>匯入/匯出備份檔</li>
          </ul>
        </li>
        <li>
          <strong>使用目的：</strong>
          僅用於提供上述功能在本地端運作，不進行行為分析、廣告追蹤。未使用任何第三方 SDK。
        </li>
        <li>
          <strong>資料儲存與安全：</strong>
          資料存放於使用者裝置；提供匯出（CSV/JSON）、備份/還原、與「清除本地資料」的權利與操作說明。
        </li>
        <li>
          <strong>Cookie 與本機儲存：</strong>
          僅用於偏好設定（主題、語言等），僅限必要用途，無跨站追蹤。
        </li>
        <li>
          <strong>第三方服務：</strong>
          無。
        </li>
        <li>
          <strong>未成年人保護：</strong>
          本服務不針對 13 歲以下（或當地法規規定年齡）之未成年人；若家長發現未成年者提供資料，可透過聯絡方式請求刪除。
        </li>
        <li>
          <strong>你的權利：</strong>
          查詢、複製、備份、修正、刪除、停止使用；提供聯絡方式以處理請求。
        </li>
        <li>
          <strong>聯絡方式：</strong>
          你的聯絡信箱（例：contact@example.com）
        </li>
        <li>
          <strong>政策變更：</strong>
          如有重大變更，會更新本頁「最後更新日期」；建議定期查看。
        </li>
        <li>
          <strong>法域：</strong>
          一般敘述，依使用者所在地適用之消費者或個資保護法（例如台灣個資法/GDPR 一般性聲明）。
        </li>
      </ol>
    </div>
  );
};

export default Privacy;
