function uploadVideo() {
    const fileInput = document.getElementById('videoInput');
    const feed = document.getElementById('feed');

    // Перевіряємо, чи вибрано файл
    if (fileInput.files.length === 0) {
        alert('Будь ласка, вибери відео файл!');
        return;
    }

    const file = fileInput.files[0];
    const videoURL = URL.createObjectURL(file);

    // Створюємо елемент для відео
    const videoElement = document.createElement('video');
    videoElement.src = videoURL;
    videoElement.controls = true;

    // Очищаємо текст-заглушку, якщо він перший
    if (feed.querySelector('p')) {
        feed.innerHTML = '';
    }

    // Додаємо нове відео на початок стрічки
    feed.prepend(videoElement);

    // Очищаємо поле вибору
    fileInput.value = '';
}