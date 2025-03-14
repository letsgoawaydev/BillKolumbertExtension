const links = document.querySelectorAll('a');

links.forEach((a) => {
  a.addEventListener('click', () => {
    chrome.tabs.create({ url: a.href });
  });
});