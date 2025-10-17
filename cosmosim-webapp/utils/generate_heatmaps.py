import pandas as pd
import pydeck as pdk
import os
import numpy as np

# This data is needed for setting the map's initial view (latitude, longitude, zoom)
COUNTRY_CONFIGS = {
    'Britain': {'latitude': 55.3781, 'longitude': -3.4360, 'zoom': 5},
    'Ghana': {'latitude': 7.9465, 'longitude': -1.0232, 'zoom': 6},
    'South Africa': {'latitude': -30.5595, 'longitude': 22.9375, 'zoom': 5},
    'Tonga': {'latitude': -21.1789, 'longitude': -175.1982, 'zoom': 6},
    'Lithuania': {'latitude': 55.1694, 'longitude': 23.8813, 'zoom': 6},
    'Haiti': {'latitude': 18.9712, 'longitude': -72.2852, 'zoom': 7}
}

# --- Function signature still accepts 'scale_min' ---
def create_heatmap_map(nation_cells_df, heatmap_cells_df, country_display_name, config_name, scale_min):
    """
    Generates and saves a pydeck map visualization for capacity degradation.
    """
    # 1. Layer for nation cells (blue)
    nation_layer = pdk.Layer(
        "H3HexagonLayer",
        data=nation_cells_df,
        pickable=False,
        stroked=False,
        filled=True,
        extruded=False,
        get_hexagon="hex",
        get_fill_color=[0, 0, 255, 200]
    )

    scale_max = 1.0
    
    if (scale_max - scale_min) == 0:
        norm_expr = "1.0" # If min=max, just use a single color (e.g., green)
    else:
        min_str = f"{scale_min:.10f}"
        range_str = f"{(scale_max - scale_min):.10f}"
        
        # This is the raw normalization: (value - min) / (max - min)
        raw_norm_expr = f"((value - {min_str}) / {range_str})"
        norm_expr = f"({raw_norm_expr} < 0.0 ? 0.0 : ({raw_norm_expr} > 1.0 ? 1.0 : {raw_norm_expr}))"

    color_expr = f"[{norm_expr} <= 0.5 ? 255 : 255 * 2 * (1 - {norm_expr}), {norm_expr} <= 0.5 ? 255 * 2 * {norm_expr} : 255, 0, 185]"


    # 2. Layer for non-nation heatmap cells (gradient)
    heatmap_layer = pdk.Layer(
        "H3HexagonLayer",
        data=heatmap_cells_df,
        pickable=True,
        stroked=True,
        filled=True,
        extruded=False,
        get_hexagon="hex",
        get_fill_color=color_expr,
        get_line_color=[255, 255, 255],
        line_width_min_pixels=2,
    )

    # Set the initial viewport based on the selected country
    view_state = pdk.ViewState(
        latitude=COUNTRY_CONFIGS[country_display_name]['latitude'],
        longitude=COUNTRY_CONFIGS[country_display_name]['longitude'],
        zoom=COUNTRY_CONFIGS[country_display_name]['zoom'],
        bearing=0, pitch=0
    )

    # Create the pydeck map object with both layers
    r = pdk.Deck(
        layers=[nation_layer, heatmap_layer],
        initial_view_state=view_state,
        tooltip={"text": "Available capacity:\n {truncated_value}"},
        map_style="light",
    )

    # Save the map to an HTML file
    viz_dir = os.path.join('static', 'visualizations', 'cell_heatmaps')
    os.makedirs(viz_dir, exist_ok=True)
    
    html_filename = f"{config_name}_cell_heatmap.html"
    html_path = os.path.join(viz_dir, html_filename)
    
    html_content = r.to_html(as_string=True, notebook_display=False)
    
    # Add the custom color scale legend to the HTML
    color_scale_path = os.path.join('templates', 'color_scales', 'heatmap_color_scale.html')
    if os.path.exists(color_scale_path):
        with open(color_scale_path, 'r') as f:
            color_scale_html = f.read()
        
        # --- Dynamically update legend labels (this part is unchanged) ---
        scale_mid = (scale_min + scale_max) / 2
        # Format to one decimal place for the label
        min_label = f"{scale_min:.1f}"
        mid_label = f"{scale_mid:.1f}"
        max_label = f"{scale_max:.1f}"
        
        # Replace the static labels in the HTML string
        color_scale_html = color_scale_html.replace('<span>0.0</span>', f'<span>{min_label}</span>')
        color_scale_html = color_scale_html.replace('<span>0.5</span>', f'<span>{mid_label}</span>')
        color_scale_html = color_scale_html.replace('<span>1.0</span>', f'<span>{max_label}</span>')
        
        # Inject the *modified* HTML into the body
        html_content = html_content.replace('</body>', f'{color_scale_html}</body>')
    
    with open(html_path, 'w') as f:
        f.write(html_content)

    return html_path


def generate_all_visualizations():
    """
    Iterates through all possible configurations and generates a map for each.
    """
    print("Starting pre-generation of all Capacity Degradation Heatmaps...")
    
    countries_map = {
        'South Africa': 'southafrica', 'Ghana': 'ghana', 'Tonga': 'tonga',
        'Lithuania': 'lithuania', 'Britain': 'britain', 'Haiti': 'haiti'
    }
    terminal_configs = {'200000 / 10K': '200000_10000'}
    demand_map = {
        '8400 Mbps': '0.7', '9600 Mbps': '0.8', 
        '10800 Mbps': '0.9', '12000 Mbps': '1.0'
    }

    generated_count = 0
    skipped_count = 0

    # Loop through every combination of parameters
    for country_display, country_fn in countries_map.items():
        print(f"\nProcessing Country: {country_display}")
        for term_cap_fn in terminal_configs.values():
            for demand_fn in demand_map.values():
                
                # Construct expected filenames
                config_name = f"{country_fn}_{term_cap_fn}_{demand_fn}"
                heatmap_data_filename = f"{config_name}_cell_values.txt"
                nation_data_filename = f"cells_{country_fn}_{term_cap_fn}.txt"
                
                heatmap_path = os.path.join('static', 'cell_heatmap_data', heatmap_data_filename)
                nation_path = os.path.join('static', 'cell_heatmap_data', nation_data_filename)

                if os.path.exists(heatmap_path) and os.path.exists(nation_path):
                    print(f"  - Generating for: {config_name}...")
                    try:
                        # Read heatmap data (non-nation cells)
                        heatmap_df = pd.read_csv(heatmap_path, header=None, names=['hex', 'value'])

                        # Create a new column with the truncated value
                        heatmap_df['truncated_value'] = np.floor(heatmap_df['value'] * 1000) / 1000
                        
                        # Read nation cell data and filter for those with > 0 terminals
                        nation_df = pd.read_csv(nation_path, header=None, names=['hex', 'terminals'])
                        nation_df_filtered = nation_df[nation_df['terminals'] > 0]

                        if not heatmap_df.empty and not nation_df_filtered.empty:
                            
                            min_val = heatmap_df['value'].min()
                            scale_min = np.floor(min_val * 10) / 10
                            
                            create_heatmap_map(nation_df_filtered, heatmap_df, country_display, config_name, scale_min)
                            generated_count += 1
                        else:
                            print(f"    - SKIPPED (one or more data files are empty): {config_name}")
                            skipped_count += 1
                    except Exception as e:
                        print(f"    - FAILED to process {config_name}: {e}")
                        skipped_count += 1
                else:
                    skipped_count += 1
    
    print("\n--------------------------------------------------")
    print("                Generation Complete                ")
    print(f"    Total HTML files generated: {generated_count}")
    print(f"    Total configurations skipped: {skipped_count}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    generate_all_visualizations()