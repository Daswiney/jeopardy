
let categories = [];

/** Get NUM_CATEGORIES random category from API.
 *
 * Returns array of category ids
 */

async function getCategoryIds(count) {
    try {
      const offset = Math.floor(Math.random() * 18000); // Random offset to get different categories
      const response = await axios.get(`http://jservice.io/api/categories?count=${count}&offset=${offset}`);
      const data = response.data;
      const categoryIds = data.map(category => category.id);
      return categoryIds;
    } catch (error) {
      console.error('Error fetching category IDs:', error);
      return []; // Return an empty array in case of an error
    }
  };
  
/** Return object with data about a category:
 */

async function getCategory(catId) {
    try {
      const response = await axios.get(`http://jservice.io/api/category?id=${catId}`);
      const data = response.data;
  
      // Check if the category has at least 5 clues, if not, skip this category
      if (data.clues.length < 5) {
        console.log(`Skipping category "${data.title}" - Not enough clues`);
        return null;
      }
  
      const clues = data.clues.slice(0, 5).map(clue => ({
        question: stripHtmlTags(clue.question),
        answer: stripHtmlTags(clue.answer),
        showing: null,
      }));
  
      return {
        title: data.title,
        clues: clues,
      };
    } catch (error) {
      console.error('Error fetching category data:', error);
      return null;
    }
  }
  
  function stripHtmlTags(htmlString) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, 'text/html');
    return doc.documentElement.textContent;
  }
  
/** Fill the HTML table#jeopardy with the categories & cells for questions.
 */

async function fillTable() {
    const table = document.getElementById('jeopardy');
    table.innerHTML = ''; // Clear the table content
  
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');
    const NUM_QUESTIONS_PER_CAT = 5; 
  
    // Create table header with category titles
    const headerRow = document.createElement('tr');
    for (const category of categories) {
      const th = document.createElement('th');
      th.textContent = category.title;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
  
    // Create table body with clue cells
    for (let i = 0; i < NUM_QUESTIONS_PER_CAT; i++) {
      const row = document.createElement('tr');
      for (const category of categories) {
        const td = document.createElement('td');
        const clue = category.clues[i];
        td.textContent = '?';
        td.classList.add('question-cell');
        td.dataset.categoryIndex = categories.indexOf(category);
        td.dataset.clueIndex = i;
        row.appendChild(td);
      }
      tbody.appendChild(row);
    }
  
    table.appendChild(thead);
    table.appendChild(tbody);

    const questionCells = document.querySelectorAll('.question-cell');
    questionCells.forEach(cell => {
      cell.addEventListener('click', handleClick);
    });
  }
  

/** Handle clicking on a clue: show the question or answer.
 * */

function handleClick(evt) {
    if (evt.target.classList.contains('question-cell')) {
      const categoryIndex = parseInt(evt.target.dataset.categoryIndex);
      const clueIndex = parseInt(evt.target.dataset.clueIndex);
      const clue = categories[categoryIndex].clues[clueIndex];
  
      if (clue.showing === null) {
        evt.target.textContent = clue.question;
        clue.showing = 'question';
      } else if (clue.showing === 'question') {
        evt.target.textContent = clue.answer;
        clue.showing = 'answer';
        evt.target.classList.add('answer-shown'); // Add the 'answer-shown' class
      }
    }
  }
  
  // Adjust the table cell size
  const NUM_CATEGORIES = 6; // Number of categories
  const NUM_QUESTIONS_PER_CAT = 5; // Number of questions per category
  const table = document.getElementById('jeopardy');
  table.style.width = `${NUM_CATEGORIES * 200}px`; // Adjust the width of the table
  table.style.height = `${NUM_CATEGORIES * 180}px`; // Adjust the width of the table
  const thElements = document.getElementsByTagName('th');
  const tdElements = document.getElementsByTagName('td');

// Attach the event listener to the tbody element for event delegation
const tbody = document.querySelector('tbody');
tbody.addEventListener('click', handleClick);
  
/** Wipe the current Jeopardy board, show the loading spinner,
 * and update the button used to fetch data.
 */

function showLoadingView() {
    // Show the loading spinner
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.style.display = 'block';
  
    // Disable the start button while loading
    const startButton = document.getElementById('start-btn');
    startButton.disabled = true;
  }
  
  /** Remove the loading spinner and update the button used to fetch data. */
  function hideLoadingView() {
    // Hide the loading spinner
    const loadingSpinner = document.getElementById('loading-spinner');
    loadingSpinner.style.display = 'none';
  
    // Enable the start button after loading
    const startButton = document.getElementById('start-btn');
    startButton.disabled = false;
  }

/** Start game:
 * */

async function setupAndStart() {
    try {
      showLoadingView();
      const NUM_CATEGORIES = 6; // Change this to the desired number of random categories
      const categoryIds = await getCategoryIds(NUM_CATEGORIES);
  
      // Fetch data for each category and populate categories array
      categories = await Promise.all(categoryIds.map(getCategory));
  
      // Fill the table with categories and clues
      fillTable();
  
      hideLoadingView();
  
      console.log(categories); // Check the updated categories array
    } catch (error) {
        console.error('Error setting up the game:', error);
        hideLoadingView();
      }
    }
    
    // On page load, set up the game and create modals for clues
    document.addEventListener('DOMContentLoaded', function () {
      setupAndStart();
    
      const startButton = document.getElementById('start-btn');
      startButton.addEventListener('click', () => {
        setupAndStart();
      });
    });