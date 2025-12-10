document.addEventListener('DOMContentLoaded', function() {
    
  const globalSpinnerWrapper = document.getElementById('global-spinner-wrapper');
  const mainContentWrapper = document.getElementById('main-content-wrapper');
  let capacityMapLoaded = false;
  let gsMapLoaded = false;
  
  function checkGlobalLoad() {
    if (capacityMapLoaded && gsMapLoaded) {
      globalSpinnerWrapper.style.display = 'none';
      mainContentWrapper.style.display = 'block';
    }
  }

  // --- SECTION 1: Capacity & GS Utilization ---
  
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

  countrySelectMerged.addEventListener('change', function() {
    updateTerminals(countrySelectMerged, terminalsSelectMerged, null);
  });

  updateTerminals(countrySelectMerged, terminalsSelectMerged, '20000');
  
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
    
    const wrapperCapacity = mapFrameCapacity.parentElement;
    const wrapperGs = mapFrameGs.parentElement;

    mapFrameCapacity.onload = () => {
      wrapperCapacity.classList.remove('loading');
      if (!capacityMapLoaded) {
          capacityMapLoaded = true;
          checkGlobalLoad();
      }
    };
    mapFrameGs.onload = () => {
      wrapperGs.classList.remove('loading');
      if (!gsMapLoaded) {
          gsMapLoaded = true;
          checkGlobalLoad();
      }
    };

    wrapperCapacity.classList.add('loading');
    wrapperGs.classList.add('loading');
    
    mapFrameCapacity.src = vizPathCapacity;
    mapFrameGs.src = vizPathGs;
    
    resultContainerCapacity.style.display = 'block';
    resultContainerGs.style.display = 'block';
    errorContainerMerged.style.display = 'none';
  });
  
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
          
          optionElement.value = optionValue; 
          
          optionElement.textContent = optionText; 
          terminalsSelectHeatmap.appendChild(optionElement);
      });
  }

  countrySelectHeatmap.addEventListener('change', updateHeatmapTerminalOptions);


  const generateBtnHeatmap = document.getElementById('generate-btn-heatmap');
  const mapFrameHeatmap = document.getElementById('map-frame-heatmap');
  const resultContainerHeatmap = document.getElementById('result-container-heatmap');
  const errorContainerHeatmap = document.getElementById('error-container-heatmap');

  generateBtnHeatmap.addEventListener('click', function() {
    const countryVal = document.getElementById('country-select-heatmap').value;
    
    const terminalsCapFn = document.getElementById('terminals-cap-select-heatmap').value;
    
    const demandVal = document.getElementById('demand-select-heatmap').value;

    const countryFn = countryMapHeatmap[countryVal];
    
    const demandFn = demandMapHeatmap[demandVal];
    
    const filename = `${countryFn}_${terminalsCapFn}_${demandFn}_cell_heatmap.html`;
    
    const vizPath = `static/visualizations/cell_heatmaps/${filename.toLowerCase()}`;
    console.log('Loading heatmap from:', vizPath);
    
    const wrapperHeatmap = mapFrameHeatmap.parentElement;

    mapFrameHeatmap.onload = () => {
      wrapperHeatmap.classList.remove('loading');
    };

    wrapperHeatmap.classList.add('loading');
    
    mapFrameHeatmap.src = vizPath;

    resultContainerHeatmap.style.display = 'block';
    errorContainerHeatmap.style.display = 'none';
  });

  updateHeatmapTerminalOptions();
  
});