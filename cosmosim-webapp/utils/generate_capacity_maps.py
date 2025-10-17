import pandas as pd
import pydeck as pdk
import os

# This data is needed for setting the map's initial view (latitude, longitude, zoom)
COUNTRY_CONFIGS = {
    'Britain': {'latitude': 55.3781, 'longitude': -3.4360, 'zoom': 5},
    'Ghana': {'latitude': 7.9465, 'longitude': -1.0232, 'zoom': 6},
    'South Africa': {'latitude': -30.5595, 'longitude': 22.9375, 'zoom': 5},
    'Tonga': {'latitude': -21.1789, 'longitude': -175.1982, 'zoom': 6},
    'Lithuania': {'latitude': 55.1694, 'longitude': 23.8813, 'zoom': 6},
    'Haiti': {'latitude': 18.9712, 'longitude': -72.2852, 'zoom': 7}
}

# Terminal numbers specific to each country
COUNTRY_TERMINALS = {
    "southafrica": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000],
    "ghana": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000],
    "tonga": [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000],
    "lithuania": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000],
    "britain": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000],
    "haiti": [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000]
}

def create_country_capacity_map(h3_data, country_display_name, config_name):
    """
    Generates and saves a pydeck map visualization for per-cell capacity.
    """
    # Convert input data to a DataFrame
    df = pd.DataFrame(h3_data, columns=['hex', 'capacity'])
    df['capacity'] = pd.to_numeric(df['capacity'])

    # Normalize capacity to a 0-1 range for coloring
    min_cap, max_cap = df['capacity'].min(), df['capacity'].max()
    df['normalized_capacity'] = (df['capacity'] - min_cap) / (max_cap - min_cap) if max_cap > min_cap else 0.5

    # Define the H3 hexagon layer for the map
    layer = pdk.Layer(
        "H3HexagonLayer", df, pickable=True, stroked=True, filled=True, extruded=False,
        get_hexagon="hex",
        get_fill_color="[normalized_capacity <= 0.5 ? 255 : 255 * 2 * (1 - normalized_capacity), normalized_capacity <= 0.5 ? 255 * 2 * normalized_capacity : 255, 0, 185]",
        get_line_color=[255, 255, 255], line_width_min_pixels=2,
    )

    # Set the initial viewport based on the selected country
    view_state = pdk.ViewState(
        latitude=COUNTRY_CONFIGS[country_display_name]['latitude'],
        longitude=COUNTRY_CONFIGS[country_display_name]['longitude'],
        zoom=COUNTRY_CONFIGS[country_display_name]['zoom'],
        bearing=0, pitch=0
    )

    # Create the pydeck map object
    r = pdk.Deck(
        layers=[layer], initial_view_state=view_state,
        tooltip={"text": "Capacity: {capacity} Mb"}, map_style="light",
    )

    # Save the map to an HTML file
    viz_dir = os.path.join('static', 'visualizations', 'country_capacity')
    os.makedirs(viz_dir, exist_ok=True)
    
    # Construct filename for the output HTML, removing original extension
    html_filename = f"{config_name.split('.')[0]}.html"
    html_path = os.path.join(viz_dir, html_filename)
    
    html_content = r.to_html(as_string=True, notebook_display=False)
    
    # Add the custom color scale legend to the HTML
    color_scale_path = os.path.join('templates', 'color_scales', 'country_capacity_color_scale.html')
    if os.path.exists(color_scale_path):
        with open(color_scale_path, 'r') as f:
            color_scale_html = f.read()
        html_content = html_content.replace('</body>', f'{color_scale_html}</body>')
    
    with open(html_path, 'w') as f:
        f.write(html_content)

    return html_path


def generate_all_visualizations():
    """
    Iterates through all possible configurations and generates a map for each.
    """
    print("Starting pre-generation of all Country Per Cell Capacity visualizations...")
    
    # Define all possible configuration options
    countries_map = {
        'South Africa': 'southafrica', 
        'Ghana': 'ghana', 
        'Tonga': 'tonga',
        'Lithuania': 'lithuania', 
        'Britain': 'britain', 
        'Haiti': 'haiti'
    }
    ut_algo_map = {
        'Population density': 'population', 'GCB No Cap': 'waterfill',
        'GCB 1K': 'waterfill_variant_1000', 'GCB 10K': 'waterfill_variant_10000',
        'GCB 100K': 'waterfill_variant_100000'
    }
    beam_alloc_map = {
        'Priority': 'priority', 'Population waterfill': 'popwaterfill'
    }

    generated_count = 0
    skipped_count = 0

    # Loop through every combination of parameters
    for country_display, country_fn in countries_map.items():
        # Get the list of terminals for the current country
        terminals_list = COUNTRY_TERMINALS.get(country_fn, [])
        if not terminals_list:
            print(f"\nWARNING: No terminal configurations found for {country_display}. Skipping.")
            continue

        print(f"\nProcessing Country: {country_display}")
        for terminals in terminals_list:
            for ut_algo_display, ut_algo_fn in ut_algo_map.items():
                for beam_alloc_display, beam_alloc_fn in beam_alloc_map.items():
                    
                    # Construct the expected data filename from the configuration
                    data_filename = f"{country_fn}_0_{terminals}_{ut_algo_fn}_{beam_alloc_fn}_cell_capacities.txt"
                    data_path = os.path.join('static', 'country_capacity_data', data_filename)

                    if os.path.exists(data_path):
                        # If the data file exists, proceed with generation
                        print(f"  - Generating for: {terminals} terminals, {ut_algo_display}, {beam_alloc_display}...")
                        
                        # Read the capacity data from the file
                        h3_data = []
                        with open(data_path, 'r') as f:
                            for line in f:
                                parts = line.strip().split(',')
                                if len(parts) == 2:
                                    h3_data.append(parts)
                        
                        if h3_data:
                            # Generate the visualization HTML file
                            create_country_capacity_map(h3_data, country_display, data_filename)
                            generated_count += 1
                        else:
                            print(f"    - SKIPPED (empty data file): {data_filename}")
                            skipped_count += 1
                    else:
                        # If data file does not exist, skip and note it
                        # print(f"  - SKIPPED (no data file): {data_filename}") # Uncomment for verbose debugging
                        skipped_count += 1
    
    print("\n--------------------------------------------------")
    print("                 Generation Complete                ")
    print(f"      Total HTML files generated: {generated_count}")
    print(f"    Total configurations skipped: {skipped_count}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    generate_all_visualizations()
