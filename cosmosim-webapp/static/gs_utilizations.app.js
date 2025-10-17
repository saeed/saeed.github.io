/**
 * Page-specific JavaScript for gs_utilizations.html
 * Assumes viz_logic.js is already loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENT SELECTORS ---
    const countrySelect = document.getElementById('Country');
    const terminalsSelect = document.getElementById('Number_of_terminals');
    const generateBtn = document.getElementById('generate-btn');
    const mapFrame = document.getElementById('map-frame');
    const resultContainer = document.getElementById('result-container');
    const errorContainer = document.getElementById('error-container');

    // --- DYNAMIC DROPDOWN LOGIC ---
    countrySelect.addEventListener('change', function() {
        updateTerminals(countrySelect, terminalsSelect, null);
    });

    // Initialize terminals for the default selected country
    updateTerminals(countrySelect, terminalsSelect, '20000');
    
    // --- VISUALIZATION LOGIC ---
    generateBtn.addEventListener('click', function() {
        // 1. Get current values from all dropdowns
        const countryVal = countrySelect.value;
        const terminalsVal = terminalsSelect.value;
        const utAlgoVal = document.getElementById('User_terminal_distribution_algorithm').value;
        const beamAllocVal = document.getElementById('Beam_allocation').value;

        // 2. Map values to filename components
        const countryFn = countryVal.toLowerCase().replace(' ', '');
        const utAlgoFn = utAlgoMap[utAlgoVal];
        const beamAllocFn = beamAllocMap[beamAllocVal];

        if (!terminalsVal) {
            errorContainer.textContent = 'Please select a valid number of terminals.';
            errorContainer.style.display = 'block';
            resultContainer.style.display = 'none';
            return;
        }
        
        // 3. Construct the filename.
        const filename = `${countryFn}_0_${terminalsVal}_${utAlgoFn}_${beamAllocFn}_gs_utilizations.html`;
        
        // 4. Construct the path for the iframe
        const vizPath = `../static/visualizations/gs_utilizations/${filename.toLowerCase()}`;
        console.log('Loading visualization from:', vizPath);
        
        // 5. Update the iframe and UI
        mapFrame.src = vizPath;
        resultContainer.style.display = 'block';
        errorContainer.style.display = 'none';
    });
    
    // Load default visualization on page load
    generateBtn.click();
});