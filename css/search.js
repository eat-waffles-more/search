async function performSearch() {
  const query = document.getElementById("search-input").value.trim().toLowerCase();
  const resultsDiv = document.getElementById("search-results");

  // Clear previous results
  resultsDiv.innerHTML = "";

  // Check if the input is a valid URL
  const urlPattern = /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,6}(\/[^\s]*)?$/i;
  if (urlPattern.test(query)) {
    // If it's a valid URL, open it in a new tab
    window.open(query, '_blank');
    return;  // Exit the function to avoid other actions
  }

  const mathPattern = /^[0-9+\-*/().\s^%]+$/;
  let isMath = mathPattern.test(query);
  let cleanQuery = query.replace(/\s+/g, '');

  const lowerQuery = query.toLowerCase();
  const intentLinks = [];

  // Math handling - perform calculation if the input is a valid math equation
  if (isMath) {
    try {
      // Replacing ^ with ** for exponentiation to match JavaScript syntax
      const result = Function(`"use strict"; return (${cleanQuery.replace('^', '**')})`)();

      const calcElement = document.createElement("div");
      calcElement.classList.add("result");
      calcElement.innerHTML = `
        <strong>Result:</strong> <code>${query}</code> = <strong>${result}</strong>
      `;
      // Append math result first
      resultsDiv.appendChild(calcElement);
    } catch (error) {
      const errorElement = document.createElement("div");
      errorElement.classList.add("result");
      errorElement.innerHTML = `<strong>Error:</strong> Invalid math expression.`;
      resultsDiv.appendChild(errorElement);
    }
  }

  // Fetch dictionary definition first and display it
  try {
    const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${query}`);
    if (!response.ok) {
      throw new Error("Definition not found");
    }
    const data = await response.json();
    const definition = data[0]?.meanings[0]?.definitions[0]?.definition || "No definition found.";

    // Create dictionary definition element
    const definitionElement = document.createElement("div");
    definitionElement.classList.add("result");
    definitionElement.innerHTML = `<strong>Definition of ${query}:</strong> ${definition}`;
    resultsDiv.appendChild(definitionElement);
  } catch (error) {
    const errorElement = document.createElement("div");
    errorElement.classList.add("result");
    errorElement.innerHTML = `<strong>Definition not available for "${query}".</strong>`;
    resultsDiv.appendChild(errorElement);
  }

  // Always include Wikipedia search link
  intentLinks.push({
    url: `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(query)}`
  });

  // Helpful resources if query includes keywords like "how", "tutorial", or "guide"
  if (lowerQuery.includes("how") || lowerQuery.includes("tutorial") || lowerQuery.includes("guide")) {
    intentLinks.push({
      url: `https://www.wikihow.com/wikiHowTo?search=${encodeURIComponent(query)}`
    });
    intentLinks.push({
      url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
    });
  }

  // Quora links for "why" queries
  if (lowerQuery.includes("why")) {
    intentLinks.push({
      url: `https://www.quora.com/search?q=${encodeURIComponent(query)}`
    });
  }

  // Determine the coding language and link to W3Schools
  const codingLanguages = {
    'html': 'html/',
    'css': 'css/',
    'javascript': 'javascript/',
    'python': 'python/',
    'java': 'java/',
    'php': 'php/',
    'c++': 'cpp/',
    'ruby': 'ruby/',
    'sql': 'sql/',
    'go': 'go/',
    'swift': 'swift/',
    'typescript': 'typescript/',
    'kotlin': 'kotlin/'
  };

  for (const [language, path] of Object.entries(codingLanguages)) {
    if (lowerQuery.includes(language)) {
      intentLinks.push({
        url: `https://www.w3schools.com/${path}`
      });
      break; // Exit loop once a match is found
    }
  }

  // Always show YouTube link for every search
  intentLinks.push({
    url: `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`
  });

  // Display intent-based links (without type labels)
  let resultIndex = 1;
  for (let link of intentLinks) {
    const linkElement = document.createElement("div");
    linkElement.classList.add("result");
    linkElement.innerHTML = `<a href="${link.url}" target="_blank">Result ${resultIndex}: ${link.url}</a>`;
    resultsDiv.appendChild(linkElement);
    resultIndex++;
  }

  // Generate potential URLs based on individual words
  const domainExtensions = ['.com', '.org']; // Only .com and .org extensions
  const wordsArray = query.split(/\s+/);

  // Display potential URLs for individual words first
  for (let word of wordsArray) {
    const cleanedWord = word.replace(/[^\w-]/g, '');  // Clean word (remove special characters)
    if (!cleanedWord) continue; // Skip if word is empty

    // Generate potential URLs for the cleaned word (with hyphen, and no underscores)
    for (let ext of domainExtensions) {
      const domain = `${cleanedWord}${ext}`;
      const domainElement = document.createElement("div");
      domainElement.classList.add("result");
      domainElement.innerHTML = `<a href="https://${domain}" target="_blank">Potential URL: ${domain}</a>`;
      resultsDiv.appendChild(domainElement);
      resultIndex++;
    }
  }

  // Generate combinations of words with hyphens, and no spaces (no underscores)
  const generateUrls = (words) => {
    const combinations = [];
    
    // Generate combinations with hyphen as space, and no spaces
    combinations.push(words.join('-'));   // Words joined with hyphen
    combinations.push(words.join(''));    // Words joined without spaces
    
    return combinations;
  };

  const urlCombinations = generateUrls(wordsArray);

  // Generate potential URLs for combinations of words
  for (let url of urlCombinations) {
    for (let ext of domainExtensions) {
      const domain = `${url}${ext}`;
      const domainElement = document.createElement("div");
      domainElement.classList.add("result");
      domainElement.innerHTML = `<a href="https://${domain}" target="_blank">Potential URL: ${domain}</a>`;
      resultsDiv.appendChild(domainElement);
      resultIndex++;
    }
  }

  // If no results found
  if (resultsDiv.innerHTML === "") {
    const noResultsElement = document.createElement("p");
    noResultsElement.innerHTML = "No relevant results found.";
    resultsDiv.appendChild(noResultsElement);
  }
}
