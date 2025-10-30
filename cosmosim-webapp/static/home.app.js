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
  const loadingCapacity = document.getElementById('loading-capacity');
  const loadingGs = document.getElementById('loading-gs');
  
  const errorContainerMerged = document.getElementById('error-container-merged');

  const MIN_ZOOM = 3;
  const MAX_ZOOM = 15;

  function clampDeckZoom(iframe, attempts = 0) {
    const MAX_ATTEMPTS = 12;
    if (!iframe) {
      return;
    }

    const scheduleRetry = () => {
      if (attempts < MAX_ATTEMPTS) {
        setTimeout(() => clampDeckZoom(iframe, attempts + 1), 200);
      }
    };

    try {
      const deckWindow = iframe.contentWindow;

      if (!deckWindow) {
        scheduleRetry();
        return;
      }

      let deckInstance = deckWindow.deckInstance;

      if (!deckInstance && typeof deckWindow.eval === 'function') {
        deckInstance = deckWindow.eval('typeof deckInstance !== "undefined" ? deckInstance : null');
      }

      if (!deckInstance || typeof deckInstance.setProps !== 'function') {
        scheduleRetry();
        return;
      }

      deckWindow.deckInstance = deckInstance;

      const props = deckInstance.props || {};
      const controllerProp = props.controller;
      const controller =
        controllerProp && controllerProp !== true
          ? { ...controllerProp }
          : {};

      controller.minZoom = MIN_ZOOM;
      controller.maxZoom = MAX_ZOOM;

      const updates = { controller };

      if (props.initialViewState && typeof props.initialViewState === 'object') {
        updates.initialViewState = {
          ...props.initialViewState,
          minZoom: MIN_ZOOM,
          maxZoom: MAX_ZOOM
        };
      }

      if (Array.isArray(props.views)) {
        updates.views = props.views.map(view => {
          if (!view) {
            return view;
          }
          const viewClone = { ...view };
          if (viewClone.controller === true) {
            viewClone.controller = { minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM };
          } else if (viewClone.controller && typeof viewClone.controller === 'object') {
            viewClone.controller = {
              ...viewClone.controller,
              minZoom: MIN_ZOOM,
              maxZoom: MAX_ZOOM
            };
          }
          return viewClone;
        });
      }

      deckInstance.setProps(updates);

      const currentViewState =
        (typeof deckInstance.getViewState === 'function' && deckInstance.getViewState()) ||
        deckInstance.viewState ||
        props.initialViewState ||
        {};

      if (typeof currentViewState === 'object') {
        const adjustedZoom =
          typeof currentViewState.zoom === 'number'
            ? Math.min(Math.max(currentViewState.zoom, MIN_ZOOM), MAX_ZOOM)
            : MIN_ZOOM;

        deckInstance.setProps({
          viewState: {
            ...currentViewState,
            zoom: adjustedZoom,
            minZoom: MIN_ZOOM,
            maxZoom: MAX_ZOOM
          }
        });
      }
    } catch (err) {
      console.warn('Unable to enforce zoom bounds for iframe visualization.', err);
    }
  }

  function loadVisualization(iframe, loader, src, options = {}) {
    if (!iframe || !loader) {
      return;
    }

    const { clampZoom = true } = options;

    loader.classList.add('active');
    iframe.classList.add('is-loading');

    const handleLoad = () => {
      setTimeout(() => {
        loader.classList.remove('active');
        iframe.classList.remove('is-loading');
        iframe.removeEventListener('load', handleLoad);
        if (clampZoom) {
          clampDeckZoom(iframe);
        }
      }, 1000);
    };

    iframe.addEventListener('load', handleLoad);
    iframe.src = src;
  }

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
      loadingCapacity.classList.remove('active');
      loadingGs.classList.remove('active');
      mapFrameCapacity.classList.remove('is-loading');
      mapFrameGs.classList.remove('is-loading');
      return;
    }
    
    const baseFilename = `${countryFn}_0_${terminalsVal}_${utAlgoFn}_${beamAllocFn}`;
    
    const vizPathCapacity = `static/visualizations/country_capacity/${baseFilename}_cell_capacities.html`.toLowerCase();
    const vizPathGs = `static/visualizations/gs_utilizations/${baseFilename}_gs_utilizations.html`.toLowerCase();
    
    console.log('Loading Capacity map from:', vizPathCapacity);
    console.log('Loading GS map from:', vizPathGs);
    
    resultContainerCapacity.style.display = 'block';
    resultContainerGs.style.display = 'block';
    errorContainerMerged.style.display = 'none';

    loadVisualization(mapFrameCapacity, loadingCapacity, vizPathCapacity);
    loadVisualization(mapFrameGs, loadingGs, vizPathGs, { clampZoom: false });
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
  const loadingHeatmap = document.getElementById('loading-heatmap');

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
    
    loadVisualization(mapFrameHeatmap, loadingHeatmap, vizPath);
    resultContainerHeatmap.style.display = 'block';
    errorContainerHeatmap.style.display = 'none';
  });

  updateHeatmapTerminalOptions();
  
  generateBtnHeatmap.click();

});
