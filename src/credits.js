const links = document.querySelectorAll('a');

links.forEach((a) => {
  if (a.href != '') {
    a.addEventListener('click', () => {
      chrome.tabs.create({ url: a.href });
    });
  }
});