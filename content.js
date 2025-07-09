let isLogged = false;

async function main() {
  const lectureName = getLectureName();
  if (!lectureName) {
    return;
  }

  const res = await bAxios({
    url: "/api/auth/me",
  });
  if (res.data && res.data.user) {
    isLogged = true;
  }

  const videoContainers = getVideoContainers();
  if (videoContainers.length === 0) {
    return;
  }

  for (const container of videoContainers) {
    if (container.querySelector(".cosmonote-btn-group")) {
      // 이미 코스모노트 버튼이 있는 경우
      continue;
    }

    if (!container.querySelector("a")) {
      // 재생 가능한 영상이 아닌 경우
      continue;
    }

    addCosmoNoteButtons(container);
  }
}

function getLectureName() {
  const courseNameLink = document.querySelector(
    "#page-header > nav > div > div.coursename > h1 > a"
  );
  if (courseNameLink) {
    return courseNameLink.textContent.trim();
  }

  return null;
}

function getVideoContainers() {
  const videoContainers = Array.from(
    document.querySelectorAll(".activityinstance")
  );

  const filteredContainers = videoContainers.filter((container) => {
    const img = container.querySelector("img");
    return img && img.getAttribute("alt") === "동영상";
  });

  return filteredContainers;
}

function addCosmoNoteButtons(container) {
  const btnGroup = document.createElement("div");
  btnGroup.className = "cosmonote-btn-group";

  function createButton(text, className, icon, pathname) {
    const btn = document.createElement("button");
    btn.className = `cosmonote-btn ${className}`;
    btn.onclick = () => btnClickListener(container, pathname);

    const img = document.createElement("img");
    img.src = chrome.runtime.getURL("icons/" + icon);
    img.alt = "";
    img.className = "cosmonote-btn-icon";

    if (
      !isLogged &&
      (className === "cosmonote-btn-subtitle" ||
        className === "cosmonote-btn-summary")
    ) {
      btn.setAttribute("data-tooltip", "로그인 후 이용 가능합니다.");
      btn.onclick = () => window.open("http://localhost:3000/auth/signin");
    }

    btn.appendChild(img);
    btn.appendChild(document.createTextNode(text));
    return btn;
  }

  // 각 버튼 생성
  const btnDownload = createButton(
    "다운로드",
    "cosmonote-btn-download",
    "archive.svg",
    "video-download"
  );
  const btnSubtitle = createButton(
    "자막생성",
    "cosmonote-btn-subtitle",
    "subtitles.svg",
    "subtitles"
  );
  const btnSummary = createButton(
    "AI 노트로 요약",
    "cosmonote-btn-summary",
    "wand-shine.svg",
    "ai-note"
  );

  btnGroup.appendChild(btnDownload);
  btnGroup.appendChild(btnSubtitle);
  btnGroup.appendChild(btnSummary);

  container.insertAdjacentElement("afterend", btnGroup);
}

function btnClickListener(container, pathname) {
  const a = container.querySelector("a");
  if (!a) {
    alert("재생이 불가능한 영상입니다.");
    return;
  }

  const str = a.getAttribute("onclick");
  const regex = /window\.open\(['"]([^'"]+)['"]/;
  const match = str.match(regex);
  if (match.length !== 2) {
    alert("강좌 URL을 찾지 못했습니다.");
    return;
  }

  const instanceName = container.querySelector(".instancename");
  const videoName = Array.from(instanceName.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent.trim())
    .join("");

  const videoUrl = match[1];
  const moodleSession = getCookieValue("MoodleSession");
  window.open(
    `http://localhost:3000/${pathname}?videoUrl=${encodeURIComponent(
      videoUrl
    )}&moodleSession=${encodeURIComponent(
      moodleSession
    )}&videoName=${encodeURIComponent(videoName)}`,
    "_blank"
  );
}

function getCookieValue(name) {
  const cookies = document.cookie.split(";");
  for (const cookie of cookies) {
    const [key, value] = cookie.trim().split("=");
    if (key === name) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

function bAxios(options) {
  return sendMessage({
    type: "FETCH_DATA",
    options,
  });
}

main().then();
