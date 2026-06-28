(function () {
  var tocLinks = document.querySelectorAll(".legal-toc a, .legal-mobile-toc a");
  if (!tocLinks.length) return;

  var sections = [];
  tocLinks.forEach(function (link) {
    var id = link.getAttribute("href");
    if (id && id.charAt(0) === "#") {
      var el = document.getElementById(id.slice(1));
      if (el) sections.push({ el: el, link: link });
    }
  });

  if (!sections.length) return;

  function setActive(id) {
    tocLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("active", active);
    });
  }

  if ("IntersectionObserver" in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        var visible = entries
          .filter(function (e) {
            return e.isIntersecting;
          })
          .sort(function (a, b) {
            return a.boundingClientRect.top - b.boundingClientRect.top;
          });
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 }
    );
    sections.forEach(function (s) {
      observer.observe(s.el);
    });
  }

  tocLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      var mobileToc = document.querySelector(".legal-mobile-toc");
      if (mobileToc && mobileToc.open) mobileToc.open = false;
    });
  });
})();
