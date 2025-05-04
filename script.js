// Check if the browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log("Voice recognition started.");
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('homeSearch').value = transcript;
        console.log("Recognized text:", transcript);
      };

      recognition.onerror = (event) => {
        console.error('Error occurred in recognition:', event.error);
      };

      recognition.onend = () => {
        console.log("Voice recognition ended.");
      };
    } else {
      console.log("Speech recognition not supported in this browser.");
    }

    function startVoiceRecognition() {
      if (recognition) {
        recognition.start();
      } else {
        alert("Voice recognition is not supported on your browser.");
      }
    }

    function handleHomeSearch() {
      const query = document.getElementById('homeSearch').value.trim();
      if (!query) return;
      switchToResults(query);
    }

    function handleResultsSearch() {
      const query = document.getElementById('resultsSearch').value.trim();
      if (!query) return;
      switchToResults(query);
    }

    function switchToResults(query) {
      document.getElementById('homeView').style.display = 'none';
      document.getElementById('resultsView').style.display = 'block';
      document.getElementById('resultsSearch').value = query;
      searchResults(query);
    }

    function isMathProblem(query) {
      const mathRegex = /[\+\-\*\/\^()0-9]/;
      return mathRegex.test(query);
    }

    function evaluateMathExpression(expression) {
      try {
        return eval(expression);
      } catch (error) {
        return 'Invalid expression';
      }
    }

    function searchResults(query) {
      const resultsContainer = document.getElementById('results');
      resultsContainer.innerHTML = '';

      if (isMathProblem(query)) {
        const calculatorDiv = document.createElement('div');
        calculatorDiv.className = 'calculator';
        calculatorDiv.innerHTML = `
          <input type="text" id="calculatorInput" value="${query}" />
          <div>
            <button onclick="calculateResult()">=</button>
            <button onclick="clearCalculator()">C</button>
          </div>
        `;
        resultsContainer.appendChild(calculatorDiv);
      }

      searchWikipedia(query);
    }

    function calculateResult() {
      const input = document.getElementById('calculatorInput').value;
      const result = evaluateMathExpression(input);
      document.getElementById('calculatorInput').value = result;
    }

    function clearCalculator() {
      document.getElementById('calculatorInput').value = '';
    }

    function isSingleWord(query) {
      return /^[a-zA-Z]+$/.test(query.trim());
    }

    async function searchWikipedia(query) {
      const resultsContainer = document.getElementById('results');
      
      if (isSingleWord(query)) {
        try {
          const dictResponse = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
          const dictData = await dictResponse.json();

          if (Array.isArray(dictData)) {
            const wordData = dictData[0];
            const meanings = wordData.meanings.map(meaning => {
              const defs = meaning.definitions.map(d => `<li>${d.definition}</li>`).join('');
              return `<p><strong>${meaning.partOfSpeech}</strong></p><ul>${defs}</ul>`;
            }).join('');

            const dictDiv = document.createElement('div');
            dictDiv.className = 'result';
            dictDiv.innerHTML = `
              <div class="definition-label">Definition</div>
              <a href="https://www.google.com/search?q=define+${encodeURIComponent(query)}" target="_blank">${wordData.word}</a>
              ${meanings}
            `;
            resultsContainer.appendChild(dictDiv);
          }
        } catch (err) {
          console.warn('No dictionary definition found.');
        }
      }

      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;

      try {
        const response = await fetch(url);
        const data = await response.json();
        const results = data.query.search;

        if (!results.length) {
          resultsContainer.innerHTML += '<p>No Wikipedia results found.</p>';
          return;
        }

        for (const result of results) {
          const title = result.title;
          const snippet = result.snippet.replace(/<\/?[^>]+(>|$)/g, '');

          const extLinksUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=extlinks&format=json&origin=*`;
          const extRes = await fetch(extLinksUrl);
          const extData = await extRes.json();
          const extLinks = extData.query.pages[Object.keys(extData.query.pages)[0]].extlinks || [];

          const div = document.createElement('div');
          div.className = 'result';
          div.innerHTML = `
            <a href="https://en.wikipedia.org/wiki/${encodeURIComponent(title)}" target="_blank">${title}</a>
            <p>${snippet}...</p>
            <div class="external-links">
              <ul>
                ${extLinks.map(link => `<li><a href="${link['*']}" target="_blank">${link['*']}</a></li>`).join('')}
              </ul>
            </div>
          `;
          resultsContainer.appendChild(div);
        }
      } catch (err) {
        resultsContainer.innerHTML += '<p>Error fetching Wikipedia results.</p>';
        console.error(err);
      }
    }

    window.addEventListener('DOMContentLoaded', () => {
      const params = new URLSearchParams(window.location.search);
      const q = params.get('q');
      if (q) {
        switchToResults(q);
      }
    });
