// 厳格モード
'use strict';
// jQuery読み込み
const $ = require('jquery');
// document.getElementById('availability-toggle-button');と同じ
// 仮引数iはindex、eはelement
// すべてのトグルボタンを取得し、１つずつ走査していく
$('.availability-toggle-button').each((i, e) => {
  // １つのトグルボタンを取得する
  const button = $(e);
  // クリックイベントを登録する
  button.click(() => {
    // 予定、ユーザー、候補日の各IDを取得する
    // schedule.jadeで
    // <button data-schedule-id="81106aa9-4c17-47c5-af0f-8abce6303e7a"
    // みたいな感じで設定されている
    const scheduleId = button.data('schedule-id');
    const userId = button.data('user-id');
    const candidateId = button.data('candidate-id');
    // 現在の出欠情報を数値で取得する
    const availability = parseInt(button.data('availability'));
    // 変更後の出欠情報の数値を取得する
    // （クリックした時にどの出欠情報に移行するか）
    const nextAvailability = (availability + 1) % 3;
    // /schedules/{scheduleId}/users/{userId}/candidates/{candidateId}
    // にPOSTでアクセスしてAPIにデータを渡す
    $.post(`/schedules/${scheduleId}/users/${userId}/candidates/${candidateId}`,
      // ↓はreq.body.availabilityとしてAPIから参照される
      { availability: nextAvailability },
      // HTMLを動的に変更する
      (data) => {
        // data-availability属性を変更する
        button.data('availability', data.availability);
        // ボタンのラベルを現在選択中の出欠情報に更新する
        const availabilityLabels = ['欠', '？', '出'];
        button.text(availabilityLabels[data.availability]);
      });
  });
});

// 自身のコメントの編集ボタンがクリックされた時の処理
const buttonSelfComment = $('#self-comment-button');
buttonSelfComment.click(() => {
  // data-schedule-id属性で設定されているscheduleIdを取得
  const scheduleId = buttonSelfComment.data('schedule-id');
  // 同様にuserIdを取得
  const userId = buttonSelfComment.data('user-id');
  // プロンプトを表示して入力コメントを受け取る
  const comment = prompt('コメントを255文字以内で入力してください。');
  // なんらかのコメントが入力されていれば
  if (comment) {
    // コメントのAPIに投げて更新処理を行う
    $.post(`/schedules/${scheduleId}/users/${userId}/comments`,
      { comment: comment },
      (data) => {
        // <p id="self-coment">タグ内のコメントを書き換える
        // …idとclassで取得方法同じだけど困ることないの…？ないか。
        $('#self-comment').text(data.comment);
      }
    );
  }
});