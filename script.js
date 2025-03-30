const { jsPDF } = window.jspdf;

const state = {
    chapters: [],
    title: "Saga Weaver",
    genre: "fantasy",
    isActive: false,
    version: 1.2,
    createdAt: null,
    lastPromptHash: null,
    maxChapters: 15,
    language: "uk" // По умолчанию украинский
};

const translations = {
    uk: {
        placeholder: "Опишіть початок: хто герой, де він, яка мета...",
        start: "Почати",
        reset: "Скинути",
        final: "Фінал",
        savePDF: "Зберегти сагу в PDF",
        shareLabel: "Поділитися:",
        chapterCreated: "Створено:",
        sagaCompleted: "Сага завершена! Створено:",
        limitReached: "Досягнуто ліміт глав! Натисніть 'Фінал'.",
        limitMessage: "Історія досягла {max} глав. Завершіть сагу кнопкою 'Фінал'.",
        errorShortPrompt: "Опишіть початок детальніше (мінімум 20 символів)!",
        errorStartFirst: "Спочатку почніть історію!",
        promptTemplate: `
Назва: "{title}". Жанр: {genre}.
{isFirst ? "Почни історію з \\"" + context + "\\"." : "Продовж з \\"" + lastChapterText.slice(0, 200) + "\\", вибір: \\"" + choice + "\\"."}
Напиши {isEnd ? "фінал" : "главу {chapterNumber}"} (12-15 речень) з унікальною назвою.
{!isFirst ? "Почни з наслідків вибору \\"" + choice + "\\"." : ""}
Зроби сюжет цікавим і різноманітним.
{genreElement}
Включи оточення та емоції героя.
Створи новий зміст, уникаючи повторення попередніх глав.
{isEnd ? "" : "Додай рівно 3 варіанти вибору (2-5 слів), що впливають на сюжет."}
Формат:
[Глава {chapterNumber}: Назва]
[Текст]
{isEnd ? "" : "1. [Вибір 1]\\n2. [Вибір 2]\\n3. [Вибір 3]"}
        `,
        genreElements: {
            fantasy: "Додай елементи магії або містики.",
            scifi: "Додай технології або космос.",
            horror: "Додай страх або надприродне.",
            fairytale: "Додай дива або чарівність.",
            adventure: "Додай пригоди або відкриття."
        }
    },
    en: {
        placeholder: "Describe the beginning: who is the hero, where are they, what’s their goal...",
        start: "Start",
        reset: "Reset",
        final: "Final",
        savePDF: "Save Saga as PDF",
        shareLabel: "Share:",
        chapterCreated: "Created:",
        sagaCompleted: "Saga completed! Created at:",
        limitReached: "Chapter limit reached! Press 'Final'.",
        limitMessage: "The story has reached {max} chapters. End the saga with the 'Final' button.",
        errorShortPrompt: "Describe the beginning in more detail (at least 20 characters)!",
        errorStartFirst: "Start a story first!",
        promptTemplate: `
Title: "{title}". Genre: {genre}.
{isFirst ? "Start the story with \\"" + context + "\\"." : "Continue from \\"" + lastChapterText.slice(0, 200) + "\\", choice: \\"" + choice + "\\"."}
Write {isEnd ? "the final" : "chapter {chapterNumber}"} (12-15 sentences) with a unique title.
{!isFirst ? "Begin with the consequences of the choice \\"" + choice + "\\"." : ""}
Make the plot engaging and diverse.
{genreElement}
Include the environment and the hero's emotions.
Create new content, avoiding repetition of past chapters.
{isEnd ? "" : "Add exactly 3 choice options (2-5 words) that impact the plot."}
Format:
[Chapter {chapterNumber}: Title]
[Text]
{isEnd ? "" : "1. [Choice 1]\\n2. [Choice 2]\\n3. [Choice 3]"}
        `,
        genreElements: {
            fantasy: "Add elements of magic or mysticism.",
            scifi: "Add technology or space themes.",
            horror: "Add fear or the supernatural.",
            fairytale: "Add wonders or enchantment.",
            adventure: "Add exploration or discoveries."
        }
    }
};

// Шрифт Roboto для поддержки кириллицы (вставьте base64-код шрифта сюда)
const robotoFont = "data:application/x-font-ttf;base64,/* Вставьте base64-код шрифта Roboto Regular */";

window.onload = () => {
    console.log("Страница загружена");
    loadSaga();
    document.getElementById("genre").addEventListener("change", updateTheme);
    document.getElementById("info-btn").addEventListener("click", showInfo);
    document.getElementById("close-modal").addEventListener("click", hideInfo);
    document.getElementById("translate-btn").addEventListener("click", toggleLanguage);
    updateLanguage();
};

function loadSaga() {
    console.log("Загружаем сохраненную сагу...");
    const saved = localStorage.getItem("saga");
    if (saved) {
        Object.assign(state, JSON.parse(saved));
        document.getElementById("title").textContent = state.title;
        document.getElementById("title").style.display = state.isActive ? "block" : "none";
        document.getElementById("prompt").style.display = state.isActive ? "none" : "block";
        document.getElementById("genre").value = state.genre;
        renderStory();
        updateTheme();
    }
}

function saveSaga() {
    console.log("Сохраняем сагу...");
    localStorage.setItem("saga", JSON.stringify(state));
}

function resetSaga() {
    console.log("Сбрасываем сагу...");
    state.chapters = [];
    state.title = "Saga Weaver";
    state.isActive = false;
    state.createdAt = null;
    state.lastPromptHash = null;
    document.getElementById("title").textContent = state.title;
    document.getElementById("title").style.display = "none";
    document.getElementById("prompt").style.display = "block";
    document.getElementById("prompt").value = "";
    document.getElementById("story-container").innerHTML = "";
    clearContainers();
    localStorage.clear();
    updateTheme();
    updateLanguage();
}

function clearContainers() {
    console.log("Очищаем контейнеры...");
    document.getElementById("options-container").innerHTML = "";
    document.getElementById("progress").textContent = "";
    const progressBar = document.getElementById("progress-bar");
    if (progressBar) {
        progressBar.style.display = "none";
        progressBar.style.width = "0%";
    } else {
        console.warn("Элемент progress-bar не найден в DOM");
    }
}

function updateTheme() {
    console.log("Обновляем тему для жанра:", document.getElementById("genre").value);
    const genre = document.getElementById("genre").value;
    const body = document.body;
    const containers = document.querySelectorAll(".container");
    const effectsDiv = document.querySelector(".background-effects") || document.createElement("div");

    effectsDiv.className = "background-effects";
    effectsDiv.innerHTML = "";
    let accent, accentLight, accentDark, accentSecondary;

    if (genre === "fantasy") {
        body.style.background = "var(--fantasy-bg)";
        containers.forEach(c => c.style.background = "var(--fantasy-container)");
        accent = "#8a9a5b"; accentLight = "#b8c68b"; accentDark = "#6a7a3b"; accentSecondary = "#d4e4bc";
        for (let i = 0; i < 12; i++) {
            const spark = document.createElement("div");
            spark.className = "fantasy-spark";
            spark.style.left = `${Math.random() * 100}vw`;
            spark.style.top = `${Math.random() * 100}vh`;
            spark.style.animationDelay = `${Math.random() * 4}s`;
            effectsDiv.appendChild(spark);
        }
    } else if (genre === "scifi") {
        body.style.background = "var(--scifi-bg)";
        containers.forEach(c => c.style.background = "var(--scifi-container)");
        accent = "#00d4ff"; accentLight = "#66e6ff"; accentDark = "#0099cc"; accentSecondary = "#1b263b";
        for (let i = 0; i < 25; i++) {
            const particle = document.createElement("div");
            particle.className = "scifi-particle";
            particle.style.left = `${Math.random() * 100}vw`;
            particle.style.top = `${Math.random() * 100}vh`;
            particle.style.animationDelay = `${Math.random() * 3}s`;
            effectsDiv.appendChild(particle);
        }
    } else if (genre === "horror") {
        body.style.background = "var(--horror-bg)";
        containers.forEach(c => c.style.background = "var(--horror-container)");
        accent = "#a82424"; accentLight = "#d85454"; accentDark = "#781818"; accentSecondary = "#4a1c1c";
        for (let i = 0; i < 6; i++) {
            const shadow = document.createElement("div");
            shadow.className = "horror-shadow";
            shadow.style.left = `${Math.random() * 100}vw`;
            shadow.style.top = `${Math.random() * 100}vh`;
            shadow.style.animationDelay = `${Math.random() * 5}s`;
            effectsDiv.appendChild(shadow);
        }
    } else if (genre === "fairytale") {
        body.style.background = "var(--fairytale-bg)";
        containers.forEach(c => c.style.background = "var(--fairytale-container)");
        accent = "#ff80ab"; accentLight = "#ffb3cb"; accentDark = "#cc6688"; accentSecondary = "#fce4ec";
        for (let i = 0; i < 15; i++) {
            const star = document.createElement("div");
            star.className = "fairytale-star";
            star.style.left = `${Math.random() * 100}vw`;
            star.style.top = `${Math.random() * 100}vh`;
            star.style.animationDelay = `${Math.random() * 3}s`;
            effectsDiv.appendChild(star);
        }
    } else if (genre === "adventure") {
        body.style.background = "var(--adventure-bg)";
        containers.forEach(c => c.style.background = "var(--adventure-container)");
        accent = "#c68e17"; accentLight = "#e6b047"; accentDark = "#966b12"; accentSecondary = "#c9a86b";
        for (let i = 0; i < 8; i++) {
            const cloud = document.createElement("div");
            cloud.className = "adventure-cloud";
            cloud.style.left = `${Math.random() * 100}vw`;
            cloud.style.top = `${Math.random() * 100}vh`;
            cloud.style.animationDelay = `${Math.random() * 5}s`;
            effectsDiv.appendChild(cloud);
        }
    }

    document.documentElement.style.setProperty('--genre-accent', accent);
    document.documentElement.style.setProperty('--genre-accent-light', accentLight);
    document.documentElement.style.setProperty('--genre-accent-dark', accentDark);
    document.documentElement.style.setProperty('--genre-accent-secondary', accentSecondary);
    containers.forEach(c => c.style.color = (genre === "horror" || genre === "scifi") ? "var(--text-light)" : "var(--text-dark)"); // Точка с запятой добавлена
    document.getElementById("title").style.color = (genre === "horror" || genre === "scifi") ? "var(--text-light)" : "var(--text-dark)"; // Точка с запятой добавлена

    if (!document.querySelector(".background-effects")) body.appendChild(effectsDiv);
}

async function startSaga() {
    const prompt = document.getElementById("prompt").value.trim();
    state.genre = document.getElementById("genre").value;
    console.log("Запуск startSaga с вводом:", prompt);
    if (!prompt || prompt.length < 20) {
        console.log("Ввод слишком короткий или пустой");
        alert(translations[state.language].errorShortPrompt);
        return;
    }
    
    state.title = generateTitle(prompt, state.genre);
    state.chapters = [];
    state.isActive = true;
    state.createdAt = new Date().toISOString();
    state.lastPromptHash = hashString(prompt);
    document.getElementById("title").textContent = state.title;
    document.getElementById("title").style.display = "block";
    document.getElementById("prompt").style.display = "none";
    clearContainers();
    console.log("Начинаем генерацию первой главы...");
    await generateChapter(prompt, "", true);
    saveSaga();
}

async function endSaga() {
    if (!state.isActive) return alert(translations[state.language].errorStartFirst);
    const lastChapter = state.chapters[state.chapters.length - 1].text;
    console.log("Завершаем сагу...");
    await generateChapter(lastChapter, state.language === "uk" ? "Завершити сагу" : "End the saga", false, true);
    state.isActive = false;
    saveSaga();
}

function generateTitle(input, genre) {
    const prefixes = {
        fantasy: state.language === "uk" ? ["Сказання", "Хроніки", "Легенди", "Пісня"] : ["Tales", "Chronicles", "Legends", "Song"],
        scifi: state.language === "uk" ? ["Проєкт", "Космос", "Сигнал", "Горизонт"] : ["Project", "Cosmos", "Signal", "Horizon"],
        horror: state.language === "uk" ? ["Темрява", "Прокляття", "Шепіт", "Відлуння"] : ["Darkness", "Curse", "Whisper", "Echo"],
        fairytale: state.language === "uk" ? ["Казка", "Диво", "Історія", "Легенда"] : ["Tale", "Wonder", "Story", "Legend"],
        adventure: state.language === "uk" ? ["Подорож", "Експедиція", "Пошук", "Пригода"] : ["Journey", "Expedition", "Quest", "Adventure"]
    };
    const words = input.split(" ").slice(0, 2).join(" ");
    return `${prefixes[genre][Math.floor(Math.random() * 4)]} ${words}`;
}

async function generateChapter(context, choice, isFirst = false, isEnd = false) {
    const progressDiv = document.getElementById("progress");
    const progressBar = document.getElementById("progress-bar");
    const optionsDiv = document.getElementById("options-container");
    const chapterNumber = state.chapters.length + 1;
    const lang = state.language;
    const lastChapterText = isFirst ? "" : state.chapters[state.chapters.length - 1].text;

    if (chapterNumber > state.maxChapters && !isEnd) {
        progressDiv.textContent = translations[lang].limitReached;
        optionsDiv.innerHTML = `<p>${translations[lang].limitMessage.replace("{max}", state.maxChapters)}</p>`;
        console.log("Достигнут лимит глав:", state.maxChapters);
        return;
    }

    const prompt = translations[lang].promptTemplate
        .replace("{title}", state.title)
        .replace("{genre}", state.genre)
        .replace("{isFirst}", isFirst)
        .replace("{context}", context)
        .replace("{lastChapterText}", lastChapterText)
        .replace("{choice}", choice)
        .replace("{isEnd}", isEnd)
        .replace("{chapterNumber}", chapterNumber)
        .replace("{!isFirst}", !isFirst)
        .replace("{genreElement}", translations[lang].genreElements[state.genre]);

    const promptHash = hashString(prompt);
    if (promptHash === state.lastPromptHash) {
        console.log("Повторный запрос, пробуем снова...");
        throw new Error("Повторный запрос.");
    }
    state.lastPromptHash = promptHash;

    let attempts = 0;
    const maxAttempts = 5;

    while (attempts < maxAttempts) {
        const seed = Math.floor(Math.random() * 1000);
        const url = `https://text.pollinations.ai/${encodeURIComponent(prompt)}?model=mistral&seed=${seed}`;
        console.log(`Глава ${chapterNumber}, Попытка ${attempts + 1}. URL:`, url);

        try {
            optionsDiv.innerHTML = "";
            progressDiv.textContent = `Глава ${chapterNumber} создаётся... (Попытка ${attempts + 1})`;
            console.log("Запрос API...");

            let progressInterval;
            if (progressBar) {
                progressBar.style.display = "block";
                let progress = 0;
                progressInterval = setInterval(() => {
                    progress += 10;
                    progressBar.style.width = `${Math.min(progress, 90)}%`;
                }, 300);
            }

            const response = await fetchWithRetry(url);
            console.log("Запрос выполнен.");

            if (progressBar && progressInterval) {
                clearInterval(progressInterval);
                progressBar.style.width = "100%";
                await new Promise(resolve => setTimeout(resolve, 500));
                progressBar.style.display = "none";
            }

            const text = await response.text();
            console.log(`Глава ${chapterNumber}, Сырой ответ API:`, text);

            const lines = text.split(/\n+/).filter(line => line.trim().length > 0);
            console.log(`Глава ${chapterNumber}, Разделённые строки:`, lines);

            const titleMatch = lines[0]?.match(/^\[(Глава|Chapter) \d+: (.+)\]$/);
            const title = titleMatch ? titleMatch[2].trim() : `Глава ${chapterNumber}: Без названия`;
            let chapterText = "";
            let options = [];
            let textStarted = false;

            for (let i = 1; i < lines.length; i++) {
                if (!textStarted && !lines[i].match(/^\d\.\s*(\[.*\]|.*)$/)) {
                    chapterText += (chapterText ? "\n" : "") + lines[i];
                } else if (lines[i].match(/^\d\.\s*(\[.*\]|.*)$/)) {
                    textStarted = true;
                    options.push(lines[i].replace(/^\d\.\s*(\[|\])?/g, "").replace(/\]$/, "").trim());
                }
            }

            chapterText = chapterText.trim() || "Ошибка генерации текста.";
            console.log(`Глава ${chapterNumber}, Извлечённый текст:`, chapterText);
            console.log(`Глава ${chapterNumber}, Извлечённые варианты:`, options);

            const sentenceCount = (chapterText.match(/[.!?]+/g) || []).length;
            if (sentenceCount < 5) {
                console.log(`Глава ${chapterNumber}, Текст слишком короткий (${sentenceCount} предложений), пробуем снова...`);
                throw new Error("Текст обрезан.");
            }

            if (!isEnd && options.length < 3) {
                console.log(`Глава ${chapterNumber}, Недостаточно вариантов (${options.length}):`, options);
                const fallbackOptions = lang === "uk" ? ["Шукати далі.", "Сховатися тихо.", "Покликати на допомогу."] : ["Search further.", "Hide quietly.", "Call for help."];
                while (options.length < 3) {
                    options.push(fallbackOptions[options.length]);
                }
                console.log(`Глава ${chapterNumber}, Дополнены запасными вариантами:`, options);
            }

            if (!isFirst && state.chapters.some(ch => ch.text === chapterText)) {
                console.log(`Глава ${chapterNumber}, Повтор главы, пробуем снова...`);
                throw new Error("Повтор главы.");
            }

            state.chapters.push({ title: `Глава ${chapterNumber}: ${title}`, text: chapterText, timestamp: new Date().toISOString() });
            renderStory();
            progressDiv.textContent = `Глава ${chapterNumber}: ${title}`;
            console.log(`Глава ${chapterNumber} создана:`, chapterText, "Варианты:", options);

            optionsDiv.innerHTML = "";
            if (!isEnd) {
                options.forEach(opt => {
                    const btn = document.createElement("button");
                    btn.textContent = opt;
                    btn.className = "control-btn";
                    btn.onclick = () => continueSaga(opt);
                    optionsDiv.appendChild(btn);
                });
            } else {
                optionsDiv.innerHTML = `<p>${translations[lang].sagaCompleted} ${new Date(state.createdAt).toLocaleString()}</p>`;
            }
            updateTheme();
            return;
        } catch (error) {
            if (progressBar && progressInterval) {
                clearInterval(progressInterval);
                progressBar.style.display = "none";
            }
            console.error(`Глава ${chapterNumber}, Ошибка на попытке ${attempts + 1}:`, error.message);
            attempts++;
            if (attempts === maxAttempts) {
                console.error(`Глава ${chapterNumber}, Исчерпаны все попытки.`);
                optionsDiv.innerHTML = `<p>${translations[lang].errorChapter.replace("{num}", chapterNumber)}</p>`;
                progressDiv.textContent = translations[lang].errorGeneration;
                return;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }
    }
}

async function continueSaga(choice) {
    const lastChapter = state.chapters[state.chapters.length - 1].text;
    console.log("Продолжаем с выбором:", choice);
    await generateChapter(lastChapter, choice);
    saveSaga();
}

function shareToTwitter(chapterIndex) {
    const chapter = state.chapters[chapterIndex];
    const shareText = `${chapter.title}\n${chapter.text.slice(0, 200)}...\n${translations[state.language].shareLabel} ${window.location.href}`;
    const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, "_blank");
}

function shareToFacebook(chapterIndex) {
    const chapter = state.chapters[chapterIndex];
    const shareText = `${chapter.title}\n${chapter.text.slice(0, 200)}...\n${translations[state.language].shareLabel}`;
    const shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}&quote=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, "_blank");
}

function shareToTelegram(chapterIndex) {
    const chapter = state.chapters[chapterIndex];
    const shareText = `${chapter.title}\n${chapter.text.slice(0, 200)}...\n${translations[state.language].shareLabel} ${window.location.href}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(shareText)}`;
    window.open(shareUrl, "_blank");
}

function exportToPDF() {
    console.log("Экспорт в PDF...");
    const doc = new jsPDF();
    // Добавляем шрифт Roboto для поддержки кириллицы
    doc.addFileToVFS("Roboto-Regular.ttf", robotoFont);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto");

    doc.setFontSize(20);
    doc.text(state.title, 20, 20);
    let y = 30;
    state.chapters.forEach((chapter, index) => {
        doc.setFontSize(16);
        doc.text(chapter.title, 20, y);
        y += 10;
        doc.setFontSize(12);
        const splitText = doc.splitTextToSize(chapter.text, 170);
        splitText.forEach(line => {
            if (y > 280) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, 20, y);
            y += 7;
        });
        y += 5;
        doc.text(`${translations[state.language].chapterCreated} ${new Date(chapter.timestamp).toLocaleString()}`, 20, y);
        y += 15;
    });
    doc.save(`${state.title}.pdf`);
}

function renderStory() {
    console.log("Рендерим историю, главы:", state.chapters.length);
    const storyDiv = document.getElementById("story-container");
    const lang = state.language;
    storyDiv.innerHTML = state.chapters.map((ch, index) => `
        <div class="chapter">
            <h2>${ch.title}</h2>
            <p>${ch.text}</p>
            <small>${translations[lang].chapterCreated} ${new Date(ch.timestamp).toLocaleString()}</small>
            <div class="chapter-actions">
                <div class="share-container">
                    <span class="share-label">${translations[lang].shareLabel}</span>
                    <button class="share-btn twitter" onclick="shareToTwitter(${index})" title="Twitter"></button>
                    <button class="share-btn facebook" onclick="shareToFacebook(${index})" title="Facebook"></button>
                    <button class="share-btn telegram" onclick="shareToTelegram(${index})" title="Telegram"></button>
                </div>
                ${state.isActive && index === state.chapters.length - 1 ? `<button class="secondary-btn final-btn" onclick="endSaga()">${translations[lang].final}</button>` : ""}
                ${!state.isActive && index === state.chapters.length - 1 ? `<button class="control-btn" onclick="exportToPDF()">${translations[lang].savePDF}</button>` : ""}
            </div>
        </div>
    `).join("");
    storyDiv.scrollTop = storyDiv.scrollHeight;
}

async function fetchWithRetry(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            console.log(`Попытка ${i + 1} из ${retries} для URL:`, url);
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ошибка: ${response.status}`);
            console.log("Успешный ответ от API!");
            return response;
        } catch (error) {
            console.error(`Попытка ${i + 1} не удалась:`, error);
            if (i === retries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 3000));
        }
    }
}

function hashString(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = (hash << 5) - hash + str.charCodeAt(i);
        hash |= 0;
    }
    return hash;
}

function showInfo() {
    document.getElementById("info-modal").style.display = "block";
}

function hideInfo() {
    document.getElementById("info-modal").style.display = "none";
}

function toggleLanguage() {
    state.language = state.language === "uk" ? "en" : "uk";
    document.getElementById("translate-btn").textContent = state.language === "uk" ? "🇺🇦" : "🇬🇧";
    updateLanguage();
    renderStory();
}

function updateLanguage() {
    const lang = state.language;
    document.getElementById("prompt").placeholder = translations[lang].placeholder;
    document.querySelector(".primary-btn").textContent = translations[lang].start;
    document.querySelector(".secondary-btn").textContent = translations[lang].reset;
    document.querySelectorAll("#genre option").forEach((option, index) => {
        const titles = {
            uk: ["Світ магії та пригод", "Космос і технології майбутнього", "Темрява та моторошні таємниці", "Добрі історії та дива", "Дослідження та небезпека"],
            en: ["A world of magic and adventure", "Space and future technologies", "Darkness and eerie mysteries", "Kind stories and wonders", "Exploration and danger"]
        };
        option.textContent = lang === "uk" ? ["Фентезі", "Наукова фантастика", "Жахи", "Казка", "Пригоди"][index] : ["Fantasy", "Sci-Fi", "Horror", "Fairytale", "Adventure"][index];
        option.title = titles[lang][index];
    });
}
