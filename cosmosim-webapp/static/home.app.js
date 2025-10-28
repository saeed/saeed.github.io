/**
 * Page-specific JavaScript for home.html
 * Assumes viz_logic.js is already loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    
  // --- SECTION 1: Capacity & GS Utilization ---
  
  // Renamed to avoid variable conflicts
  const countrySelectMerged = document.getElementById('Country');
  const terminalsSelectMerged = document.getElementById('Number_of_terminals');
  const utAlgoSelect = document.getElementById('User_terminal_distribution_algorithm');
  const beamAllocSelect = document.getElementById('Beam_allocation');
  const generateBtnMerged = document.getElementById('generate-btn-merged');
  
  const mapFrameCapacity = document.getElementById('map-frame-capacity');
  const resultContainerCapacity = document.getElementById('result-container-capacity');
  const mapFrameGs = document.getElementById('map-frame-gs');
  const resultContainerGs = document.getElementById('result-container-gs');
  
  const errorContainerMerged = document.getElementById('error-container-merged');

  // Attach listener to country select
  countrySelectMerged.addEventListener('change', function() {
    // Use the shared updateTerminals function from viz_logic.js
    updateTerminals(countrySelectMerged, terminalsSelectMerged, null);
  });

  // Initial population of terminals dropdown
  updateTerminals(countrySelectMerged, terminalsSelectMerged, '20000');
  
  // Attach listener to the generate button
  generateBtnMerged.addEventListener('click', function() {
    const countryVal = countrySelectMerged.value;
    const terminalsVal = terminalsSelectMerged.value;
    const utAlgoVal = utAlgoSelect.value;
    const beamAllocVal = beamAllocSelect.value;

    const countryFn = countryVal.toLowerCase().replace(' ', '');
    const utAlgoFn = utAlgoMap[utAlgoVal];
    const beamAllocFn = beamAllocMap[beamAllocVal];

    if (!terminalsVal) {
      errorContainerMerged.textContent = 'Please select a valid number of terminals.';
      errorContainerMerged.style.display = 'block';
      resultContainerCapacity.style.display = 'none';
      resultContainerGs.style.display = 'none';
      return;
    }
    
    const baseFilename = `${countryFn}_0_${terminalsVal}_${utAlgoFn}_${beamAllocFn}`;
    
    const vizPathCapacity = `static/visualizations/country_capacity/${baseFilename}_cell_capacities.html`.toLowerCase();
    const vizPathGs = `static/visualizations/gs_utilizations/${baseFilename}_gs_utilizations.html`.toLowerCase();
    
    console.log('Loading Capacity map from:', vizPathCapacity);
    console.log('Loading GS map from:', vizPathGs);
    
    mapFrameCapacity.src = vizPathCapacity;
    mapFrameGs.src = vizPathGs;
    
    resultContainerCapacity.style.display = 'block';
    resultContainerGs.style.display = 'block';
    errorContainerMerged.style.display = 'none';
  });
  
  // Load default visualization on page load
  generateBtnMerged.click();

  // --- SECTION 2: Capacity Degradation Heatmap ---
  
  const heatmapTerminalOptions = {
      'Britain': ['200000 / 10K', '50000 / 100K'],
      'Ghana': ['10000 / 100K', '100000 / 10K'],
      'Haiti': ['5000 / 100K', '100000 / 10K'],
      'Lithuania': ['1000 / 100K', '10000 / 10K'],
      'South Africa': ['20000 / 100K', '200000 / 10K'],
      'Tonga': ['500 / 10K', '1000 / 1K']
  };

  const countrySelectHeatmap = document.getElementById('country-select-heatmap');
  const terminalsSelectHeatmap = document.getElementById('terminals-cap-select-heatmap');

  function updateHeatmapTerminalOptions() {
      const selectedCountry = countrySelectHeatmap.value;
      const options = heatmapTerminalOptions[selectedCountry] || [];

      terminalsSelectHeatmap.innerHTML = '';

      options.forEach(optionText => {
          const optionElement = document.createElement('option');
          
          const optionValue = terminalsCapMapHeatmap[optionText];
          
          optionElement.value = optionValue; // Set the value to the filename part
          
          optionElement.textContent = optionText; // Keep the text as the display string
          terminalsSelectHeatmap.appendChild(optionElement);
      });
  }

  countrySelectHeatmap.addEventListener('change', updateHeatmapTerminalOptions);
  // --- (END OF MOVED LOGIC) ---


  // --- (Original Section 2 Logic) ---
  const generateBtnHeatmap = document.getElementById('generate-btn-heatmap');
  const mapFrameHeatmap = document.getElementById('map-frame-heatmap');
  const resultContainerHeatmap = document.getElementById('result-container-heatmap');
  const errorContainerHeatmap = document.getElementById('error-container-heatmap');

  generateBtnHeatmap.addEventListener('click', function() {
    const countryVal = document.getElementById('country-select-heatmap').value;
    
    const terminalsCapFn = document.getElementById('terminals-cap-select-heatmap').value;
    // --- END MODIFICATION ---
    
    const demandVal = document.getElementById('demand-select-heatmap').value;

    const countryFn = countryMapHeatmap[countryVal];
    
    const demandFn = demandMapHeatmap[demandVal];
    
    // This will now correctly construct the filename
    const filename = `${countryFn}_${terminalsCapFn}_${demandFn}_cell_heatmap.html`;
    
    const vizPath = `static/visualizations/cell_heatmaps/${filename.toLowerCase()}`;
    console.log('Loading heatmap from:', vizPath);
    
    mapFrameHeatmap.src = vizPath;
    resultContainerHeatmap.style.display = 'block';
    errorContainerHeatmap.style.display = 'none';
  });

  updateHeatmapTerminalOptions();
  
  generateBtnHeatmap.click();

});