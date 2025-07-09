chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "FETCH_DATA") {
    const { url, method = "GET", headers = {}, data } = message.options;

    fetch("http://localhost:3000" + url, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      credentials: "include",
      body: data ? JSON.stringify(data) : undefined,
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((responseData) => sendResponse({ data: responseData }))
      .catch((error) => sendResponse({ error: error.message }));

    return true;
  }
});
