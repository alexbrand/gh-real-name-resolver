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
  // Select all user links with hovercard
  const userLinks = root.querySelectorAll('a[data-hovercard-type="user"], a[data-hovercard-url][href*="/commits?author="]');
  userLinks.forEach(link => {
    const hovercardUrl = link.getAttribute('data-hovercard-url');
    // Extract userId from hovercardUrl (e.g., /users/USER_ID/hovercard)
    const userId = hovercardUrl?.split('/')[2]; 

    if (hovercardUrl && userId) {
      // Use userId as cache key
      if (cache[userId]) {
        updateLink(link, cache[userId], userId);
      } else {
        fetchHovercardAndUpdate(link, hovercardUrl, userId);
      }
    }
  });
}

async function fetchHovercardAndUpdate(link, hovercardUrl, userId) { 
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
        // Use userId as cache key
        cache[userId] = realName; 
        updateLink(link, realName, userId);
      }
    } else {
      console.warn('No real name found in hovercard:', hovercardUrl);
    }
  } catch (error) {
    console.error('Error fetching hovercard:', error);
  }
}

function updateLink(link, realName, userId) { 
  // Format display text
  const displayText = userId ? `${realName} (${userId})` : realName;

  // Check if the link contains an image (likely an avatar)
  if (link.querySelector('img')) {
    // If it has an image, add the display text to the title attribute for tooltip
    link.setAttribute('title', displayText);
  } else {
    // If no image, update the text content
    link.textContent = displayText;
  }
}
