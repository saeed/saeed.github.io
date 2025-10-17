import pandas as pd
import pydeck as pdk
import os

def create_gs_utilization_map(gs_data_df, config_name):
    """
    Generates and saves a pydeck map visualization for GS utilization.

    Args:
        gs_data_df (pd.DataFrame): DataFrame containing merged GS data including 
                                   'latitude', 'longitude', 'name', and 'utilization'.
        config_name (str): The original filename of the utilization data.
    """
    
    # Ensure utilization column is numeric for color calculations
    gs_data_df['utilization'] = pd.to_numeric(gs_data_df['utilization'])

    # 1. CREATE A NEW COLUMN FOR DISPLAY, FORMATTED TO 3 DECIMAL PLACES
    gs_data_df['utilization_display'] = gs_data_df['utilization'].map('{:.3f}'.format)

    # Define the Scatterplot layer to display ground stations as circles
    layer = pdk.Layer(
        "ScatterplotLayer",
        gs_data_df,
        pickable=True,
        opacity=0.8,
        stroked=True,
        filled=True,
        radius_min_pixels=5,
        radius_max_pixels=100,
        line_width_min_pixels=1,
        get_position='[longitude, latitude]',
        get_radius=15000,  # Radius of circles in meters
        # Color gradient logic still uses the ORIGINAL numeric 'utilization' column
        get_fill_color="[utilization <= 0.5 ? 255 * 2 * utilization : 255, utilization <= 0.5 ? 255 : 255 * 2 * (1 - utilization), 0, 185]",
        get_line_color=[0, 0, 0],
    )

    # Set a global initial viewport to show all stations
    view_state = pdk.ViewState(
        latitude=30,
        longitude=0,
        zoom=1.5,
        bearing=0,
        pitch=0
    )

    # Create the pydeck map object
    r = pdk.Deck(
        layers=[layer],
        initial_view_state=view_state,
        tooltip={"html": "<b>Name:</b> {name}<br/><b>Utilization:</b> {utilization_display}"},
        map_style="light",
    )

    # Define the output directory and create it if it doesn't exist
    viz_dir = os.path.join('static', 'visualizations', 'gs_utilizations')
    os.makedirs(viz_dir, exist_ok=True)
    
    # Construct the output filename (e.g., 'config_a.txt' -> 'config_a.html')
    html_filename = f"{os.path.splitext(config_name)[0]}.html"
    html_path = os.path.join(viz_dir, html_filename)
    
    # 1. Render the map to an in-memory string
    html_content = r.to_html(as_string=True, notebook_display=False)
    
    # 2. Load the content of the color scale legend
    color_scale_path = os.path.join('templates', 'color_scales', 'gs_utilizations_color_scale.html')
    if os.path.exists(color_scale_path):
        with open(color_scale_path, 'r') as f:
            color_scale_html = f.read()
        # 3. Inject the legend's HTML just before the closing </body> tag
        html_content = html_content.replace('</body>', f'{color_scale_html}</body>')
    
    # 4. Save the combined HTML content to the file
    with open(html_path, 'w') as f:
        f.write(html_content)
    
    return html_path

def generate_all_visualizations():
    """
    Iterates through all GS utilization data files in the specified directory
    and generates a map for each one.
    """
    print("Starting pre-generation of all Ground Station Utilization visualizations...")
    
    # 1. Load ground station location data from the CSV file
    gs_locations_path = os.path.join('static', 'ground_stations_starlink.csv')
    try:
        gs_locations_df = pd.read_csv(
            gs_locations_path, 
            header=None, 
            names=['id', 'name', 'latitude', 'longitude', 'extra']
        )
    except FileNotFoundError:
        print(f"ERROR: Ground station locations file not found at '{gs_locations_path}'")
        return

    # 2. Locate and process each utilization data file
    data_dir = os.path.join('static', 'gs_utilizations_data')
    if not os.path.isdir(data_dir):
        print(f"ERROR: Data directory not found at '{data_dir}'")
        return

    utilization_files = [f for f in os.listdir(data_dir) if os.path.isfile(os.path.join(data_dir, f))]
    
    if not utilization_files:
        print(f"No utilization data files found in '{data_dir}'.")
        return

    generated_count = 0
    skipped_count = 0

    # 3. Loop through each data file, generate and save the map
    for filename in utilization_files:
        print(f"  - Processing: {filename}...")
        data_path = os.path.join(data_dir, filename)
        
        try:
            # Assume a headerless CSV format: gs_id,utilization
            util_df = pd.read_csv(data_path, header=None, names=['id', 'utilization'])
            
            util_df['id'] = util_df['id'] - 6364
            
            if util_df.empty:
                print(f"    - SKIPPED (empty data file): {filename}")
                skipped_count += 1
                continue

            # Merge utilization data with GS location and name data
            merged_df = pd.merge(gs_locations_df, util_df, on='id')
            
            if merged_df.empty:
                 print(f"    - SKIPPED (no matching GS IDs found after offset): {filename}")
                 skipped_count += 1
                 continue
            
            # Call the function to create and save the map visualization
            create_gs_utilization_map(merged_df, filename)
            generated_count += 1

        except Exception as e:
            print(f"    - FAILED to process {filename}: {e}")
            skipped_count += 1
            
    print("\n--------------------------------------------------")
    print("          Generation Complete                     ")
    print(f"   Total HTML files generated: {generated_count}")
    print(f"   Total configurations skipped: {skipped_count}")
    print("--------------------------------------------------")

if __name__ == "__main__":
    generate_all_visualizations()