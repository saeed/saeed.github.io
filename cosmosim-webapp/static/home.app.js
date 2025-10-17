/**
 * Page-specific JavaScript for home.html
 * Assumes viz_logic.js is already loaded.
 */
document.addEventListener('DOMContentLoaded', function() {
    
  // --- SECTION 1: Capacity & GS Utilization ---
  
  const countrySelect = document.getElementById('Country');
  const terminalsSelect = document.getElementById('Number_of_terminals');
  const utAlgoSelect = document.getElementById('User_terminal_distribution_algorithm');
  const beamAllocSelect = document.getElementById('Beam_allocation');
  const generateBtnMerged = document.getElementById('generate-btn-merged');
  
  const mapFrameCapacity = document.getElementById('map-frame-capacity');
  const resultContainerCapacity = document.getElementById('result-container-capacity');
  const mapFrameGs = document.getElementById('map-frame-gs');
  const resultContainerGs = document.getElementById('result-container-gs');
  
  const errorContainerMerged = document.getElementById('error-container-merged');

  // Attach listener to country select
  countrySelect.addEventListener('change', function() {
    updateTerminals(countrySelect, terminalsSelect, null);
  });

  // Initial population of terminals dropdown
  updateTerminals(countrySelect, terminalsSelect, '20000');
  
  // Attach listener to the generate button
  generateBtnMerged.addEventListener('click', function() {
    const countryVal = countrySelect.value;
    const terminalsVal = terminalsSelect.value;
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
  
  const generateBtnHeatmap = document.getElementById('generate-btn-heatmap');
  const mapFrameHeatmap = document.getElementById('map-frame-heatmap');
  const resultContainerHeatmap = document.getElementById('result-container-heatmap');
  const errorContainerHeatmap = document.getElementById('error-container-heatmap');

  generateBtnHeatmap.addEventListener('click', function() {
    const countryVal = document.getElementById('country-select-heatmap').value;
    const terminalsCapVal = document.getElementById('terminals-cap-select-heatmap').value;
    const demandVal = document.getElementById('demand-select-heatmap').value;

    const countryFn = countryMapHeatmap[countryVal];
    const terminalsCapFn = terminalsCapMapHeatmap[terminalsCapVal];
    const demandFn = demandMapHeatmap[demandVal];
    
    const filename = `${countryFn}_${terminalsCapFn}_${demandFn}_cell_heatmap.html`;
    
    const vizPath = `static/visualizations/cell_heatmaps/${filename.toLowerCase()}`;
    console.log('Loading heatmap from:', vizPath);
    
    mapFrameHeatmap.src = vizPath;
    resultContainerHeatmap.style.display = 'block';
    errorContainerHeatmap.style.display = 'none';
  });
  
  // Load default visualization on page load
  generateBtnHeatmap.click();
});