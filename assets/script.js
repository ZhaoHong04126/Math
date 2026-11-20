/* ==========================================================================
   高中數學課後複習班｜共用互動腳本 (assets/script.js)
   無模組依賴，直接支援本機 file:// 開啟與 GitHub Pages
   ========================================================================== */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    // 1. Render KaTeX formulas safely
    if (typeof renderMathInElement === 'function') {
      renderMathInElement(document.body, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false },
          { left: '\\(', right: '\\)', display: false },
          { left: '\\[', right: '\\]', display: true }
        ],
        throwOnError: false
      });
    }

    // 2. Mobile TOC drawer & Sidebar scroll-spy
    var sidebar = document.querySelector('.chapter-sidebar');
    var mobileTocToggle = document.querySelector('.mobile-toc-toggle');
    var tocLinks = Array.prototype.slice.call(
      document.querySelectorAll('.toc-link[href^="#"]')
    );

    if (sidebar && mobileTocToggle) {
      mobileTocToggle.addEventListener('click', function () {
        var isOpen = sidebar.classList.toggle('is-open');
        mobileTocToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
    }

    var trackedSections = tocLinks
      .map(function (link) {
        var id = link.getAttribute('href').slice(1);
        var section = document.getElementById(id);
        return section ? { id: id, link: link, section: section } : null;
      })
      .filter(Boolean);

    function setActiveTocLink(targetId) {
      trackedSections.forEach(function (item) {
        if (item.id === targetId) {
          item.link.classList.add('active');
        } else {
          item.link.classList.remove('active');
        }
      });
    }

    if (trackedSections.length > 0) {
      tocLinks.forEach(function (link) {
        link.addEventListener('click', function () {
          var targetId = link.getAttribute('href').slice(1);
          setActiveTocLink(targetId);

          if (sidebar && mobileTocToggle && window.innerWidth <= 960) {
            sidebar.classList.remove('is-open');
            mobileTocToggle.setAttribute('aria-expanded', 'false');
          }
        });
      });

      var scrollSpyTicking = false;

      function updateActiveOnScroll() {
        scrollSpyTicking = false;
        var activeId = trackedSections[0].id;
        var threshold = 130;

        for (var i = 0; i < trackedSections.length; i++) {
          var rect = trackedSections[i].section.getBoundingClientRect();
          if (rect.top <= threshold) {
            activeId = trackedSections[i].id;
          } else {
            break;
          }
        }

        // Select last item when scrolled to the bottom of the page
        if (
          window.innerHeight + window.scrollY >=
          document.documentElement.scrollHeight - 10
        ) {
          activeId = trackedSections[trackedSections.length - 1].id;
        }

        setActiveTocLink(activeId);
      }

      window.addEventListener(
        'scroll',
        function () {
          if (!scrollSpyTicking) {
            scrollSpyTicking = true;
            window.requestAnimationFrame(updateActiveOnScroll);
          }
        },
        { passive: true }
      );

      // Respect initial URL hash if present
      var initialHash = window.location.hash
        ? window.location.hash.slice(1)
        : '';
      var hasInitialMatch = trackedSections.some(function (item) {
        return item.id === initialHash;
      });
      if (hasInitialMatch) {
        setActiveTocLink(initialHash);
      } else {
        updateActiveOnScroll();
      }
    }

    // 3. Back-to-top button
    var backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
      var toggleBackToTop = function () {
        if (window.scrollY > 300) {
          backToTopBtn.classList.add('visible');
        } else {
          backToTopBtn.classList.remove('visible');
        }
      };

      window.addEventListener('scroll', toggleBackToTop, { passive: true });
      toggleBackToTop();

      backToTopBtn.addEventListener('click', function () {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      });
    }

    // 4. Homepage live formula search & track filter
    var searchInput = document.getElementById('formula-search');
    var clearSearchBtn = document.getElementById('clear-search');
    var searchStatus = document.getElementById('search-status');
    var emptySearchState = document.getElementById('empty-search-state');
    var trackButtons = Array.prototype.slice.call(
      document.querySelectorAll('.track-filter-btn[data-track]')
    );

    if (searchInput) {
      var formulaRows = Array.prototype.slice.call(
        document.querySelectorAll('.formula-row')
      );
      var chapterGroups = Array.prototype.slice.call(
        document.querySelectorAll('.chapter-group')
      );
      var bookSections = Array.prototype.slice.call(
        document.querySelectorAll('.book-section')
      );
      var trackDividers = Array.prototype.slice.call(
        document.querySelectorAll('.track-divider[data-track]')
      );
      var jumpButtons = Array.prototype.slice.call(
        document.querySelectorAll('.jump-btn[data-track]')
      );
      var activeTrack = 'all';

      var syncTrackControls = function () {
        trackButtons.forEach(function (btn) {
          var isSelected = btn.getAttribute('data-track') === activeTrack;
          btn.classList.toggle('is-active', isSelected);
          btn.setAttribute('aria-pressed', isSelected ? 'true' : 'false');
        });

        jumpButtons.forEach(function (btn) {
          var btnTrack = btn.getAttribute('data-track');
          var visible =
            activeTrack === 'all' ||
            btnTrack === 'common' ||
            btnTrack === activeTrack;
          btn.classList.toggle('is-hidden', !visible);
        });
      };

      var filterFormulas = function () {
        var rawQuery = searchInput.value.trim();
        var query = rawQuery.toLowerCase();
        var visibleCount = 0;

        if (clearSearchBtn) {
          clearSearchBtn.classList.toggle('is-hidden', rawQuery.length === 0);
        }

        formulaRows.forEach(function (row) {
          var parentBook = row.closest('.book-section');
          var bookTrack = parentBook
            ? parentBook.getAttribute('data-track') || 'common'
            : 'common';
          var trackEligible =
            activeTrack === 'all' ||
            bookTrack === 'common' ||
            bookTrack === activeTrack;

          var haystack = (
            row.getAttribute('data-search') || row.textContent || ''
          ).toLowerCase();
          var matched =
            trackEligible && (query === '' || haystack.indexOf(query) !== -1);
          row.classList.toggle('is-hidden', !matched);
          if (matched) {
            visibleCount += 1;
          }
        });

        chapterGroups.forEach(function (group) {
          var hasVisibleRow =
            group.querySelector('.formula-row:not(.is-hidden)') !== null;
          group.classList.toggle('is-hidden', !hasVisibleRow);
        });

        bookSections.forEach(function (book) {
          var hasVisibleGroup =
            book.querySelector('.chapter-group:not(.is-hidden)') !== null;
          book.classList.toggle('is-hidden', !hasVisibleGroup);
        });

        trackDividers.forEach(function (divider) {
          var divTrack = divider.getAttribute('data-track');
          var hasVisibleBook =
            document.querySelector(
              '.book-section[data-track="' + divTrack + '"]:not(.is-hidden)'
            ) !== null;
          divider.classList.toggle('is-hidden', !hasVisibleBook);
        });

        if (searchStatus) {
          if (query === '') {
            if (activeTrack === 'a') {
              searchStatus.textContent =
                '目前顯示：自然組（共同 1–61 ＋ 數A A1–A75，共 ' +
                visibleCount +
                ' 個公式）';
            } else if (activeTrack === 'b') {
              searchStatus.textContent =
                '目前顯示：社會組（共同 1–61 ＋ 數B B1–B45，共 ' +
                visibleCount +
                ' 個公式）';
            } else {
              searchStatus.textContent =
                '共收錄 ' +
                visibleCount +
                ' 個核心公式（共同 1–61｜自然組 數A A1–A75｜社會組 數B B1–B45）';
            }
          } else {
            searchStatus.textContent =
              '找到 ' + visibleCount + ' 個符合「' + rawQuery + '」的公式';
          }
        }

        if (emptySearchState) {
          emptySearchState.classList.toggle('is-hidden', visibleCount > 0);
        }
      };

      trackButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          activeTrack = btn.getAttribute('data-track') || 'all';
          syncTrackControls();
          filterFormulas();
        });
      });

      searchInput.addEventListener('input', filterFormulas);

      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', function () {
          searchInput.value = '';
          filterFormulas();
          searchInput.focus();
        });
      }

      syncTrackControls();
      filterFormulas();
    }
  });
})();
