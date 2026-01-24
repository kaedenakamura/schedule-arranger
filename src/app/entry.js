"use strict";
import $ from "jquery";
import "bootstrap/dist/js/bootstrap.min.js";
import "bootstrap/dist/css/bootstrap.min.css";

// 出欠ボタンのトグル機能
$(".availability-toggle-button").each((i, e) => {
  const button = $(e);
  button.on("click", () => {
    const scheduleId = button.data("schedule-id");
    const userId = button.data("user-id");
    const candidateId = button.data("candidate-id");
    const availability = parseInt(button.data("availability"));
    const nextAvailability = (availability + 1) % 3;
    fetch(
      `/schedules/${scheduleId}/users/${userId}/candidates/${candidateId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: nextAvailability }),
      },
    )
      .then((response) => response.json())
      .then((data) => {
        button.data("availability", data.availability);
        const availabilityLabels = ["欠", "？", "出"];
        button.text(availabilityLabels[data.availability]);

        const buttonStyles = ["btn-danger", "btn-secondary", "btn-success"];
        button.removeClass("btn-danger btn-secondary btn-success");
        button.addClass(buttonStyles[data.availability]);
        
        // 出欠集計を更新
        updateAvailabilitySummary();
      });
  });
});

// コメント追加ボタン
const buttonSelfComment = $("#self-comment-button");
buttonSelfComment.on("click", () => {
  const scheduleId = buttonSelfComment.data("schedule-id");
  const userId = buttonSelfComment.data("user-id");
  const comment = prompt("コメントを255文字以内で入力してください。");
  if (comment) {
    fetch(`/schedules/${scheduleId}/users/${userId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment: comment }),
    })
      .then((response) => response.json())
      .then((data) => {
        $("#self-comment").text(data.comment);
      });
  }
});

// URL共有ボタンの機能
$("#share-url-button").on("click", function() {
  const url = window.location.href;
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(url).then(() => {
      $(this).text("コピーしました！");
      setTimeout(() => {
        $(this).text("URLをコピー");
      }, 2000);
    }).catch(err => {
      console.error('クリップボードへのコピーに失敗しました:', err);
      fallbackCopyTextToClipboard(url, $(this));
    });
  } else {
    fallbackCopyTextToClipboard(url, $(this));
  }
});

// フォールバック用のコピー関数
function fallbackCopyTextToClipboard(text, button) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.position = "fixed";
  textArea.style.left = "-999999px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    const successful = document.execCommand('copy');
    if (successful) {
      button.text("コピーしました！");
      setTimeout(() => {
        button.text("URLをコピー");
      }, 2000);
    }
  } catch (err) {
    console.error('コピーに失敗しました:', err);
  }
  document.body.removeChild(textArea);
}

// 出欠集計を更新する関数
function updateAvailabilitySummary() {
  $(".candidate-row").each(function() {
    const row = $(this);
    const candidateId = row.data("candidate-id");
    let okCount = 0, maybeCount = 0, ngCount = 0;
    
    row.find(".availability-toggle-button").each(function() {
      const availability = parseInt($(this).data("availability"));
      if (availability === 2) okCount++;
      else if (availability === 1) maybeCount++;
      else if (availability === 0) ngCount++;
    });
    
    const summaryCell = row.find(".availability-summary");
    summaryCell.html(`
      <span class="badge bg-success">○ ${okCount}</span>
      <span class="badge bg-secondary">△ ${maybeCount}</span>
      <span class="badge bg-danger">× ${ngCount}</span>
    `);
  });
}

// ページ読み込み時に出欠集計を初期化
$(document).ready(() => {
  updateAvailabilitySummary();
});
