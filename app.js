(() => {
  "use strict";

  const SITE_CONFIG = Object.freeze({
    previewMode: true,
    inquiryUrl: "https://lin.ee/6kQiLaY"
  });
  const courseContainer = document.getElementById("course-list");
  const courseData = Array.isArray(window.NEIPIA_COURSES) ? window.NEIPIA_COURSES : [];
  const toneNames = new Set(["blue", "apricot", "mint", "lavender", "rose"]);

  function safeHttpsUrl(value) {
    if (typeof value !== "string" || value.trim() === "") return "";
    try {
      const parsed = new URL(value.trim());
      return parsed.protocol === "https:" ? parsed.href : "";
    } catch {
      return "";
    }
  }

  function safeCourseImagePath(value) {
    if (typeof value !== "string" || !value.startsWith("assets/courses/")) return "";
    if (value.includes("..") || value.includes("\\") || /[\u0000-\u001f]/.test(value)) return "";
    return value;
  }

  function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function addCourseLabel(parent, label) {
    parent.append(element("span", "course-label", label));
  }

  function renderCourse(course) {
    if (!course || typeof course !== "object") return null;
    const card = element("article", "course-card");
    card.dataset.courseId = typeof course.id === "string" ? course.id : "";

    const tone = toneNames.has(course.tone) ? course.tone : "blue";
    const thumb = element("div", "course-thumb");
    thumb.dataset.tone = tone;
    const imagePath = safeCourseImagePath(course.thumbnail);
    if (imagePath) {
      const image = document.createElement("img");
      image.src = imagePath;
      image.alt = typeof course.thumbnailAlt === "string" && course.thumbnailAlt.trim()
        ? course.thumbnailAlt.trim()
        : `${course.title}の講座サムネイル`;
      image.loading = "lazy";
      image.decoding = "async";
      thumb.append(image);
    } else {
      const placeholder = element("div", "thumb-placeholder");
      placeholder.dataset.tone = tone;
      const symbol = element("span", "thumb-symbol");
      symbol.setAttribute("aria-hidden", "true");
      placeholder.append(symbol, element("span", "thumb-status", "画像準備中"));
      thumb.append(placeholder);
    }
    if (SITE_CONFIG.previewMode && course.isSample === true) {
      thumb.append(element("span", "thumb-sample", "サンプル講座"));
    }
    card.append(thumb);

    const body = element("div", "course-body");
    const labels = element("div", "course-labels");
    if (Number.isInteger(course.sessions) && course.sessions >= 1 && course.sessions <= 4) {
      addCourseLabel(labels, `${course.sessions}回コース`);
    }
    if (course.minutesPerSession === 30) addCourseLabel(labels, "1回30分");
    else if (Number.isInteger(course.minutesPerSession) && course.minutesPerSession > 0) {
      addCourseLabel(labels, `1回${course.minutesPerSession}分`);
    }
    if (typeof course.audience === "string" && course.audience.trim()) {
      addCourseLabel(labels, `対象：${course.audience.trim()}`);
    }
    if (course.usesAimAt === true) addCourseLabel(labels, "aim@利用あり");
    else if (course.usesAimAt === false) addCourseLabel(labels, "aim@利用なし");
    body.append(labels);

    if (SITE_CONFIG.previewMode && course.isSample === true) {
      body.append(element("p", "course-sample-warning", "サンプル講座／公開前に要差し替え"));
    }
    body.append(element("h3", "", typeof course.title === "string" ? course.title : "講座名未設定"));
    body.append(element("p", "course-description", typeof course.description === "string" ? course.description : ""));

    const meta = element("ul", "course-meta");
    if (Number.isInteger(course.sessions) && course.sessions >= 1 && course.sessions <= 4) {
      const sessionsItem = element("li");
      sessionsItem.append(element("strong", "", "受講回数"), document.createTextNode(`${course.sessions}回`));
      meta.append(sessionsItem);
    }
    if (Number.isInteger(course.minutesPerSession) && course.minutesPerSession > 0) {
      const minutesItem = element("li");
      minutesItem.append(element("strong", "", "1回"), document.createTextNode(`${course.minutesPerSession}分`));
      meta.append(minutesItem);
    }
    if (meta.childElementCount) body.append(meta);

    const reservationUrl = safeHttpsUrl(course.bookingUrl);
    const inquiryUrl = safeHttpsUrl(SITE_CONFIG.inquiryUrl);
    const action = document.createElement("a");
    action.className = "button course-button";
    action.dataset.courseId = typeof course.id === "string" ? course.id : "";
    action.target = "_blank";
    action.rel = "noopener noreferrer";
    if (course.available === false) {
      action.href = inquiryUrl || "mailto:info@neipiaed.com";
      action.textContent = "開講予定を問い合わせる";
    } else if (reservationUrl) {
      action.href = reservationUrl;
      action.textContent = "この講座を予約する";
    } else {
      action.href = inquiryUrl || "mailto:info@neipiaed.com";
      action.textContent = "講座について問い合わせる";
    }
    body.append(action);
    card.append(body);
    return card;
  }

  function renderCourses() {
    if (!courseContainer) return;
    document.querySelectorAll("[data-preview-only]").forEach((node) => {
      node.hidden = !SITE_CONFIG.previewMode;
    });
    const visibleCourses = courseData.filter((course) => {
      if (!course || typeof course !== "object") return false;
      return SITE_CONFIG.previewMode || (course.isSample !== true && course.publishReady === true);
    });
    if (visibleCourses.length === 0) {
      const empty = element("div", "empty-courses");
      empty.append(element("p", "", "現在ご案内できる講座はありません。講座の最新情報はお問い合わせください。"));
      const contact = document.createElement("a");
      contact.className = "button";
      contact.href = safeHttpsUrl(SITE_CONFIG.inquiryUrl) || "mailto:info@neipiaed.com";
      contact.target = "_blank";
      contact.rel = "noopener noreferrer";
      contact.textContent = "お問い合わせ";
      empty.append(contact);
      courseContainer.append(empty);
      return;
    }
    visibleCourses.forEach((course) => {
      const card = renderCourse(course);
      if (card) courseContainer.append(card);
    });
  }

  function setupPricingTabs() {
    const tabList = document.querySelector('[role="tablist"]');
    if (!tabList) return;
    const tabs = Array.from(tabList.querySelectorAll('[role="tab"]'));

    function selectTab(selectedTab, moveFocus = false) {
      tabs.forEach((tab) => {
        const selected = tab === selectedTab;
        tab.setAttribute("aria-selected", String(selected));
        tab.tabIndex = selected ? 0 : -1;
        const panel = document.getElementById(tab.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (moveFocus) selectedTab.focus();
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener("click", () => selectTab(tab));
      tab.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % tabs.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        selectTab(tabs[nextIndex], true);
      });
    });
  }

  renderCourses();
  setupPricingTabs();
})();
