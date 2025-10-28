/**
 * Shared visualization logic and data mappings for the CosmoSim app.
 */

// --- SHARED DATA MAPPINGS ---

const countryTerminals = {
  "southafrica": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000],
  "ghana": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000],
  "tonga": [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000],
  "lithuania": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000],
  "britain": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000],
  "haiti": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000]
};

const utAlgoMap = {
  'Population density': 'population', 
  'GCB No Cap': 'waterfill', 
  'GCB 1K': 'waterfill_variant_1000',
  'GCB 10K': 'waterfill_variant_10000', 
  'GCB 100K': 'waterfill_variant_100000'
};

const beamAllocMap = { 
  'Priority': 'priority', 
  'Population waterfill': 'popwaterfill' 
};

const countryMapHeatmap = {
  'Britain': 'britain', 
  'Ghana': 'ghana', 
  'South Africa': 'southafrica',
  'Tonga': 'tonga', 
  'Lithuania': 'lithuania', 
  'Haiti': 'haiti'
};

const terminalsCapMapHeatmap = { 
    '200000 / 10K': '200000_10000',
    '50000 / 100K': '50000_100000',
    '10000 / 100K': '10000_100000',
    '100000 / 10K': '100000_10000',
    '5000 / 100K': '5000_100000',
    '1000 / 100K': '1000_100000',
    '10000 / 10K': '10000_10000',
    '20000 / 100K': '20000_100000',
    '500 / 10K': '500_10000',
    '1000 / 1K': '1000_1000'
};

const demandMapHeatmap = {
  '8400 Mbps': '0.7', 
  '9600 Mbps': '0.8', 
  '10800 Mbps': '0.9', 
  '12000 Mbps': '1.0'
};


// --- SHARED HELPER FUNCTIONS ---

/**
 * Populates the 'Number of terminals' select box based on the chosen country.
 * @param {HTMLSelectElement} countrySelectEl - The country dropdown element.
 * @param {HTMLSelectElement} terminalsSelectEl - The terminals dropdown element to populate.
 * @param {string | null} defaultTerminal - The default terminal value to select.
 */
function updateTerminals(countrySelectEl, terminalsSelectEl, defaultTerminal) {
  const selectedCountry = countrySelectEl.value;
  const countryKey = selectedCountry.toLowerCase().replace(' ', '');
  const data = countryTerminals[countryKey] || [];
  
  terminalsSelectEl.innerHTML = ''; // Clear existing options
  
  data.forEach(terminal => {
    const option = document.createElement('option');
    option.value = terminal;
    option.textContent = terminal;
    if (defaultTerminal && terminal == defaultTerminal) {
      option.selected = true;
    }
    terminalsSelectEl.appendChild(option);
  });
  
  terminalsSelectEl.disabled = data.length === 0;
}