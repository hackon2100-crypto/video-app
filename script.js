let videosData = JSON.parse(localStorage.getItem("shevtok_videos")) || [];
let usersData = JSON.parse(localStorage.getItem("shevtok_users_db")) || {};
let currentCommentVideoId = null;
let globalSoundEnabled = false;
let isRegisterMode = false;

document.addEventListener("DOMContentLoaded", () => {
    checkUserAuthUI();

    if (videosData.length === 0) {
        videosData.push({
            id: Date.now(),
            src: "https://www.w3schools.com/html/mov_bbb.mp4",
            author: "vlad_admin",
            caption: "Ласкаво просимо в ShevTOK! 🇺🇦 Поділися цим відео у Viber.",
            likedBy: [],
            comments: []
        });
        localStorage.setItem("shevtok_videos", JSON.stringify(videosData));
    }

    renderFeed();
    initGlobalSoundUnlock();
});

function checkUserAuthUI() {
    const activeUser = localStorage.getItem("shevtok_user");
    const authBtn = document.getElementById("authBtn");
    const headerAuthBtn = document.getElementById("headerAuthBtn");

    if (activeUser) {
        const text = `@${activeUser} (Вийти)`;
        authBtn.innerText = text;
        headerAuthBtn.innerText = text;
    } else {
        authBtn.innerText = "Увійти";
        headerAuthBtn.innerText = "Увійти";
    }
}

function toggleAuthBtn() {
    const activeUser = localStorage.getItem("shevtok_user");
    if (activeUser) {
        if (confirm("Вийти з акаунта?")) {
            localStorage.removeItem("shevtok_user");
            checkUserAuthUI();
            renderFeed();
        }
    } else {
        openAuthModal();
    }
}

function openAuthModal() {
    document.getElementById("auth-modal").classList.remove("hidden");
}

function closeAuthModal() {
    document.getElementById("auth-modal").classList.add("hidden");
}

function switchAuthMode() {
    isRegisterMode = !isRegisterMode;
    const title = document.getElementById("authTitle");
    const subtitle = document.getElementById("authSubtitle");
    const btn = document.getElementById("authActionBtn");
    const switchBtn = document.getElementById("switchAuthModeBtn");

    if (isRegisterMode) {
        title.innerText = "Реєстрація у ShevTOK";
        subtitle.innerText = "Створіть свій акаунт, щоб завантажувати відео та ставити лайки";
        btn.innerText = "Зареєструватися";
        switchBtn.innerText = "Вже є акаунт? Увійти";
    } else {
        title.innerText = "Вхід у ShevTOK";
        subtitle.innerText = "Увійдіть або зареєструйтеся, щоб взаємодіяти з контентом";
        btn.innerText = "Увійти";
        switchBtn.innerText = "Немає акаунта? Зареєструватися";
    }
}

function handleAuth() {
    const username = document.getElementById("usernameInput").value.trim();
    const password = document.getElementById("passwordInput").value.trim();

    if (!username || !password) {
        alert("Будь ласка, заповніть логін і пароль!");
        return;
    }

    if (isRegisterMode) {
        if (usersData[username]) {
            alert("Користувач із таким логіном вже існує!");
            return;
        }
        usersData[username] = password;
        localStorage.setItem("shevtok_users_db", JSON.stringify(usersData));
        alert("Реєстрація успішна! Тепер увійдіть під своїми даними.");
        switchAuthMode();
    } else {
        if (!usersData[username]) {
            alert("Такого користувача не знайдено! Будь ласка, зареєструйтеся.");
            return;
        }
        if (usersData[username] !== password) {
            alert("Неправильний пароль!");
            return;
        }
        localStorage.setItem("shevtok_user", username);
        document.getElementById("usernameInput").value = "";
        document.getElementById("passwordInput").value = "";
        closeAuthModal();
        checkUserAuthUI();
        renderFeed();
        alert(`Вітаємо, @${username}! Ви успішно увійшли.`);
    }
}

function initGlobalSoundUnlock() {
    const unlockSound = () => {
        if (!globalSoundEnabled) {
            globalSoundEnabled = true;
            document.querySelectorAll(".video-card video").forEach(v => {
                v.muted = false;
                v.play().catch(() => {});
            });
            window.removeEventListener("click", unlockSound);
            window.removeEventListener("scroll", unlockSound);
            window.removeEventListener("keydown", unlockSound);
        }
    };

    window.addEventListener("click", unlockSound);
    window.addEventListener("scroll", unlockSound);
    window.addEventListener("keydown", unlockSound);
}

function renderFeed() {
    const feed = document.getElementById("feed");
    feed.innerHTML = "";

    videosData.forEach((v) => {
        createVideoCard(v);
    });

    setupObserver();
}

function createVideoCard(videoObj) {
    const feed = document.getElementById("feed");
    const currentUser = localStorage.getItem("shevtok_user");

    const card = document.createElement("div");
    card.className = "video-card";

    const wrapper = document.createElement("div");
    wrapper.className = "video-wrapper";

    const video = document.createElement("video");
    video.src = videoObj.src;
    video.loop = true;
    video.playsInline = true;
    video.muted = !globalSoundEnabled;

    video.addEventListener("click", () => {
        if (video.paused) video.play();
        else video.pause();
    });

    const soundBtn = document.createElement("button");
    soundBtn.className = "sound-toggle-btn";
    soundBtn.innerHTML = globalSoundEnabled ? '<i class="fa-solid fa-volume-high"></i>' : '<i class="fa-solid fa-volume-xmark"></i>';

    soundBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        if (video.muted) {
            soundBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        } else {
            soundBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
            globalSoundEnabled = true;
        }
    });

    const initial = videoObj.author.charAt(0).toUpperCase();

    const details = document.createElement("div");
    details.className = "video-details";

    let deleteBtnHTML = "";
    if (currentUser && currentUser === videoObj.author) {
        deleteBtnHTML = `<button class="delete-video-btn" onclick="deleteVideo(${videoObj.id})"><i class="fa-solid fa-trash"></i> Видалити</button>`;
    }

    details.innerHTML = `
        <span class="video-author-nic" onclick="openUserProfile('${videoObj.author}')">@${videoObj.author}</span>
        <p>${videoObj.caption}</p>
        ${deleteBtnHTML}
    `;

    wrapper.appendChild(video);
    wrapper.appendChild(soundBtn);
    wrapper.appendChild(details);

    const actions = document.createElement("div");
    actions.className = "video-actions";

    if (!videoObj.likedBy) videoObj.likedBy = [];
    let likesCount = videoObj.likedBy.length;
    let isLiked = currentUser && videoObj.likedBy.includes(currentUser);
    let commentsCount = videoObj.comments ? videoObj.comments.length : 0;

    actions.innerHTML = `
        <div class="avatar-action-btn" onclick="openUserProfile('${videoObj.author}')">
            <div class="author-avatar">${initial}</div>
            <div class="plus-icon"><i class="fa-solid fa-plus"></i></div>
        </div>
        <div class="action-btn-wrap">
            <button class="action-btn like-btn ${isLiked ? 'liked' : ''}"><i class="fa-solid fa-heart"></i></button>
            <span class="like-count">${likesCount}</span>
        </div>
        <div class="action-btn-wrap">
            <button class="action-btn" onclick="openComments(${videoObj.id})"><i class="fa-solid fa-comment-dots"></i></button>
            <span class="comm-count">${commentsCount}</span>
        </div>
        <div class="action-btn-wrap">
            <button class="action-btn"><i class="fa-solid fa-bookmark"></i></button>
            <span>0</span>
        </div>
        <div class="action-btn-wrap">
            <button class="action-btn share-btn"><i class="fa-solid fa-share"></i></button>
            <span>Поділитись</span>
        </div>
        <div class="sound-avatar-btn">
            <div>${initial}</div>
        </div>
    `;

    // Лайк
    const likeBtn = actions.querySelector(".like-btn");
    likeBtn.addEventListener("click", () => {
        const user = localStorage.getItem("shevtok_user");
        if (!user) {
            alert("Щоб ставити лайки, потрібно увійти або зареєструватися!");
            openAuthModal();
            return;
        }

        if (!videoObj.likedBy) videoObj.likedBy = [];
        const index = videoObj.likedBy.indexOf(user);
        if (index > -1) {
            videoObj.likedBy.splice(index, 1);
        } else {
            videoObj.likedBy.push(user);
        }

        localStorage.setItem("shevtok_videos", JSON.stringify(videosData));
        renderFeed();
    });

    // ПОДІЛИТИСЯ (Вайбер, Телеграм, Копіювання посилання)
    const shareBtn = actions.querySelector(".share-btn");
    shareBtn.addEventListener("click", () => {
        const shareData = {
            title: 'ShevTOK Відео',
            text: `Дивись круте відео від @${videoObj.author} у ShevTOK!`,
            url: window.location.href
        };

        // Якщо браузер підтримує системне меню «Поділитися» (працює на телефоні та в деяких браузерах на ПК)
        if (navigator.share) {
            navigator.share(shareData).catch(() => {});
        } else {
            // Універсальний варіант для десктопа: копіюємо посилання в буфер обміну
            navigator.clipboard.writeText(window.location.href).then(() => {
                alert("Посилання на відео скопійовано в буфер обміну! Тепер встав його у Viber або Telegram.");
            }).catch(() => {
                prompt("Скопіюйте посилання вручну:", window.location.href);
            });
        }
    });

    card.appendChild(wrapper);
    card.appendChild(actions);
    feed.appendChild(card);
}

function deleteVideo(videoId) {
    if (!confirm("Ви впевнені, що хочете видалити це відео?")) return;
    videosData = videosData.filter(v => v.id !== videoId);
    localStorage.setItem("shevtok_videos", JSON.stringify(videosData));
    renderFeed();
}

function openComments(videoId) {
    currentCommentVideoId = videoId;
    renderComments();
    document.getElementById("comments-modal").classList.remove("hidden");
}

function closeComments() {
    document.getElementById("comments-modal").classList.add("hidden");
    currentCommentVideoId = null;
}

function renderComments() {
    const list = document.getElementById("commentsList");
    list.innerHTML = "";

    const video = videosData.find(v => v.id === currentCommentVideoId);
    if (!video || !video.comments || video.comments.length === 0) {
        list.innerHTML = "<p style='color:#777; text-align:center;'>Ще немає коментарів. Будьте першим!</p>";
        return;
    }

    video.comments.forEach(c => {
        const item = document.createElement("div");
        item.className = "comment-item";
        item.innerHTML = `
            <div class="comment-author">@${c.author}</div>
            <div class="comment-text">${c.text}</div>
        `;
        list.appendChild(item);
    });
}

function addComment() {
    const user = localStorage.getItem("shevtok_user");
    if (!user) {
        alert("Щоб залишати коментарі, потрібно увійти в акаунт!");
        openAuthModal();
        return;
    }

    const input = document.getElementById("commentInput");
    const text = input.value.trim();
    if (!text) return;

    const video = videosData.find(v => v.id === currentCommentVideoId);
    if (video) {
        if (!video.comments) video.comments = [];
        video.comments.push({ author: user, text: text });
        localStorage.setItem("shevtok_videos", JSON.stringify(videosData));

        input.value = "";
        renderComments();
        renderFeed();
    }
}

function openUploadModal() {
    const user = localStorage.getItem("shevtok_user");
    if (!user) {
        alert("Щоб завантажувати відео, необхідно увійти або зареєструватися!");
        openAuthModal();
        return;
    }
    document.getElementById("upload-modal").classList.remove("hidden");
}

function closeUploadModal() {
    document.getElementById("upload-modal").classList.add("hidden");
}

function uploadVideo() {
    const fileInput = document.getElementById("videoInput");
    const captionInput = document.getElementById("videoCaption");
    const user = localStorage.getItem("shevtok_user");

    if (fileInput.files.length === 0) {
        alert("Виберіть файл відео!");
        return;
    }

    const file = fileInput.files[0];
    const videoURL = URL.createObjectURL(file);
    const caption = captionInput.value || "Моє нове відео 🔥";

    const newVideo = {
        id: Date.now(),
        src: videoURL,
        author: user,
        caption: caption,
        likedBy: [],
        comments: []
    };

    videosData.unshift(newVideo);
    localStorage.setItem("shevtok_videos", JSON.stringify(videosData));

    renderFeed();
    fileInput.value = "";
    captionInput.value = "";
    closeUploadModal();
}

function openUserProfile(username) {
    const profileModal = document.getElementById("profile-modal");
    const usernameElem = document.getElementById("profileUsername");
    const avatarElem = document.getElementById("profileAvatarLarge");
    const countElem = document.getElementById("profileVideosCount");
    const gridElem = document.getElementById("profileGrid");

    usernameElem.innerText = `@${username}`;
    avatarElem.innerText = username.charAt(0).toUpperCase();

    const userVideos = videosData.filter(v => v.author === username);
    countElem.innerText = userVideos.length;

    gridElem.innerHTML = "";
    if (userVideos.length === 0) {
        gridElem.innerHTML = "<p style='color:#777; grid-column: 1/4; text-align:center;'>У автора немає відео</p>";
    } else {
        userVideos.forEach(v => {
            const item = document.createElement("div");
            item.className = "profile-video-item";
            item.innerHTML = `<video src="${v.src}"></video>`;
            gridElem.appendChild(item);
        });
    }

    profileModal.classList.remove("hidden");
}

function closeProfileModal() {
    document.getElementById("profile-modal").classList.add("hidden");
}

function openMyProfile() {
    const user = localStorage.getItem("shevtok_user");
    if (!user) {
        alert("Увійдіть в акаунт, щоб переглянути свій профіль!");
        openAuthModal();
        return;
    }
    openUserProfile(user);
}

function toggleFollow(btn) {
    if (btn.innerText === "Стежити") {
        btn.innerText = "Ви стежите";
        btn.style.background = "#333";
    } else {
        btn.innerText = "Стежити";
        btn.style.background = "#fe2c55";
    }
}

function setupObserver() {
    const videos = document.querySelectorAll(".video-card video");
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            const video = entry.target;
            if (entry.isIntersecting) {
                video.play().catch(() => {});
            } else {
                video.pause();
            }
        });
    }, { threshold: 0.7 });

    videos.forEach((video) => observer.observe(video));
}

function scrollFeed(direction) {
    const feed = document.getElementById("feed");
    const scrollAmount = window.innerHeight;
    if (direction === 'up') {
        feed.scrollBy({ top: -scrollAmount, behavior: 'smooth' });
    } else {
        feed.scrollBy({ top: scrollAmount, behavior: 'smooth' });
    }
}
