console.log("[GitHub Real Name Resolver] Script loaded");

const cache = {};

const observer = new MutationObserver(mutations => {
  for (const mutation of mutations) {
    if (mutation.type === 'childList' && mutation.addedNodes) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1) {
          processLinks(node);
        }
      }
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });

processLinks(document.body);

function processLinks(root) {
  const userLinks = root.querySelectorAll('a[data-hovercard-type="user"], a[data-hovercard-url][href*="/commits?author="]');
  userLinks.forEach(link => {
    const hovercardUrl = link.getAttribute('data-hovercard-url');
    const username = link.textContent.trim();
    if (hovercardUrl) {
      if (cache[username]) {
        updateLink(link, cache[username]);
      } else {
        fetchHovercardAndUpdate(link, hovercardUrl, username);
      }
    }
  });
}

async function fetchHovercardAndUpdate(link, hovercardUrl, username) {
  try {
    const absoluteUrl = `https://github.com${hovercardUrl}`;
    const response = await fetch(absoluteUrl, {
      headers: {
        "X-Requested-With": "XMLHttpRequest"
      }
    });
    const html = await response.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const realNameElement = doc.querySelector('.Truncate-text a');
    if (realNameElement) {
      const realName = realNameElement.textContent.trim();
      if (realName) {
        cache[username] = realName;
        updateLink(link, realName);
      }
    } else {
      console.warn('No real name found in hovercard:', hovercardUrl);
    }
  } catch (error) {
    console.error('Error fetching hovercard:', error);
  }
}

function updateLink(link, realName) {
  link.textContent = `${realName} (${link.textContent.trim()})`;
}

