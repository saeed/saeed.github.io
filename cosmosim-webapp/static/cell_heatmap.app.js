document.addEventListener('DOMContentLoaded', function() {
    // --- ELEMENT SELECTORS ---
    const generateBtn = document.getElementById('generate-btn');
    const mapFrame = document.getElementById('map-frame');
    const resultContainer = document.getElementById('result-container');
    const errorContainer = document.getElementById('error-container');

    // --- VISUALIZATION LOGIC ---
    generateBtn.addEventListener('click', function() {
        // 1. Get current values from all dropdowns
        const countryVal = document.getElementById('country-select').value;
        const terminalsCapVal = document.getElementById('terminals-cap-select').value;
        const demandVal = document.getElementById('demand-select').value;

        // 2. Map values to filename components
        const countryFn = countryMap[countryVal]; // Note: using 'countryMap' from viz_logic.js
        const terminalsCapFn = terminalsCapMap[terminalsCapVal]; // Note: using 'terminalsCapMap'
        const demandFn = demandMap[demandVal]; // Note: using 'demandMap'
        
        // 3. Construct the filename
        const filename = `${countryFn}_${terminalsCapFn}_${demandFn}_cell_heatmap.html`;
        
        // 4. Construct the path for the iframe
        const vizPath = `../static/visualizations/cell_heatmaps/${filename.toLowerCase()}`;
        console.log('Loading visualization from:', vizPath);
        
        // 5. Update the iframe and UI
        mapFrame.src = vizPath;
        resultContainer.style.display = 'block';
        errorContainer.style.display = 'none';
    });
    
    // Load default visualization on page load
    generateBtn.click();
});