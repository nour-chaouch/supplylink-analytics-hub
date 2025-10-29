import sys
import json
import requests
import csv
import os
from datetime import datetime

def scrape_faostat_bulk(areas, items, elements, years, output_format='json'):
    """
    Scrape FAOSTAT data in bulk with custom parameters and pagination support
    
    Args:
        areas: List or comma-separated string of area codes
        items: List or comma-separated string of item codes
        elements: List or comma-separated string of element codes
        years: List or comma-separated string of years
        output_format: 'json' or 'csv'
    
    Returns:
        Dictionary with all scraped data from all pages
    """
    try:
        # Convert lists to comma-separated strings if needed
        if isinstance(areas, list):
            area_param = ','.join(map(str, areas))
        else:
            area_param = str(areas)
            
        if isinstance(items, list):
            item_param = ','.join(map(str, items))
        else:
            item_param = str(items)
            
        if isinstance(elements, list):
            element_param = ','.join(map(str, elements))
        else:
            element_param = str(elements)
            
        if isinstance(years, list):
            year_param = ','.join(map(str, years))
        else:
            year_param = str(years)
        
        # Build the API URL
        api_url = "https://faostatservices.fao.org/api/v1/en/data/QCL"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
        
        print(f"Fetching data from FAOSTAT API...", file=sys.stderr)
        
        # Collect all data from all pages
        all_data = []
        page_number = 1
        total_records = 0
        page_size = 100
        
        while True:
            # Parameters matching the user's request
            params = {
                'area': area_param,
                'area_cs': 'M49',  # Country classification system
                'element': element_param,
                'item': item_param,
                'item_cs': 'CPC',  # Item classification system
                'year': year_param,
                'show_codes': 'true',
                'show_unit': 'true',
                'show_flags': 'true',
                'show_notes': 'true',
                'null_values': 'false',
                'page_number': page_number,
                'page_size': page_size,
                'output_type': 'objects',
                'caching': 'false'
            }
            
            print(f"Fetching page {page_number}...", file=sys.stderr)
            
            # Make the API request
            response = requests.get(api_url, params=params, headers=headers, timeout=60)
            
            if response.status_code != 200:
                raise Exception(f"API returned status code {response.status_code}: {response.text}")
            
            data = response.json()
            
            # Extract data points
            if 'data' in data and data['data']:
                all_data.extend(data['data'])
                total_records += len(data['data'])
                print(f"Page {page_number}: Retrieved {len(data['data'])} records (Total: {total_records})", file=sys.stderr)
            else:
                print(f"No data in page {page_number}", file=sys.stderr)
            
            # Check if there are more pages
            if 'metadata' in data and 'page_meta' in data['metadata']:
                page_meta = data['metadata']['page_meta']
                current_page = page_meta.get('page_number', 1)
                total_pages = page_meta.get('total_pages', 1)
                
                if current_page >= total_pages:
                    print(f"All pages retrieved. Total: {total_records} records", file=sys.stderr)
                    break
                    
                page_number = current_page + 1
            else:
                # If no pagination metadata, try to continue if we got data
                if 'data' not in data or not data['data'] or len(data['data']) < page_size:
                    break
                page_number += 1
            
            # Safety limit to prevent infinite loops
            if page_number > 1000:
                print("Reached safety limit of 1000 pages", file=sys.stderr)
                break
        
        # Prepare final response
        final_response = {
            'metadata': {
                'total_records': total_records,
                'total_pages': page_number - 1
            },
            'data': all_data
        }
        
        # Save to CSV if requested
        if output_format == 'csv':
            save_to_csv_file(final_response, areas, items, elements, years)
        
        return final_response
        
    except Exception as e:
        print(f"Error in scrape_faostat_bulk: {str(e)}", file=sys.stderr)
        raise


def save_to_csv_file(data, areas, items, elements, years):
    """
    Save the bulk scraped data to CSV files
    """
    try:
        # Create output directory
        output_dir = os.path.join(os.path.dirname(__file__), 'bulk_csv_output')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Create summary filename
        summary_filename = os.path.join(output_dir, f'bulk_data_{timestamp}.csv')
        
        # Extract data points
        if 'data' in data and data['data']:
            data_points = data['data']
            
            # Write CSV file
            with open(summary_filename, 'w', newline='', encoding='utf-8') as f:
                if data_points:
                    # Get fieldnames from first item
                    fieldnames = list(data_points[0].keys())
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for item in data_points:
                        writer.writerow(item)
            
            print(f"CSV file saved: {summary_filename}", file=sys.stderr)
            print(f"Total records: {len(data_points)}", file=sys.stderr)
        else:
            print("No data points found in API response", file=sys.stderr)
        
        # Also save the full JSON response
        json_filename = os.path.join(output_dir, f'bulk_data_{timestamp}.json')
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"JSON file saved: {json_filename}", file=sys.stderr)
        
        return output_dir
        
    except Exception as e:
        print(f"Error saving to CSV: {str(e)}", file=sys.stderr)


def get_country_codes_all():
    """
    Get list of all FAOSTAT country codes based on official mapping
    Returns list of country codes from the official FAOSTAT list
    """
    # Official FAOSTAT country codes from the user's mapping
    country_codes = [
        2, 3, 4, 7, 8, 9, 1, 10, 11, 52, 12, 13, 16, 14, 57, 255, 15, 23, 53, 18, 19, 
        80, 20, 21, 26, 27, 233, 29, 35, 115, 32, 33, 37, 39, 40, 351, 96, 128, 214, 41, 
        44, 45, 46, 47, 48, 98, 49, 50, 167, 51, 107, 116, 250, 54, 72, 55, 56, 58, 59, 
        60, 61, 178, 63, 209, 238, 62, 64, 66, 67, 68, 69, 70, 74, 75, 73, 79, 81, 84, 
        86, 87, 89, 90, 175, 91, 93, 95, 97, 99, 100, 101, 102, 103, 104, 105, 106, 109, 
        110, 112, 108, 114, 83, 118, 113, 120, 119, 121, 122, 123, 124, 126, 256, 129, 130, 
        131, 132, 133, 134, 127, 135, 136, 137, 138, 145, 141, 273, 143, 144, 28, 147, 148, 
        149, 150, 153, 156, 157, 158, 159, 160, 154, 162, 221, 165, 299, 166, 168, 169, 170, 
        171, 173, 174, 177, 179, 117, 146, 183, 185, 184, 182, 188, 189, 191, 244, 193, 194, 
        195, 272, 186, 196, 197, 200, 199, 198, 25, 201, 202, 277, 203, 38, 276, 206, 207, 
        210, 211, 212, 208, 216, 176, 217, 218, 219, 220, 222, 213, 227, 223, 228, 226, 230, 
        225, 229, 215, 231, 234, 235, 155, 236, 237, 249, 248, 251, 181
    ]
    return country_codes


def get_country_name_dict():
    """
    Get dictionary mapping country codes to names
    """
    return {
        2: 'Afghanistan', 4: 'Algeria', 7: 'Angola', 8: 'Albania', 9: 'Argentina',
        10: 'Australia', 11: 'Austria', 16: 'Bangladesh', 18: 'Bhutan', 19: 'Bolivia',
        20: 'Botswana', 21: 'Brazil', 27: 'Bulgaria', 28: 'Myanmar', 29: 'Burundi',
        32: 'Cameroon', 33: 'Canada', 35: 'Central African Republic', 37: 'Chad', 38: 'Chile',
        39: 'Chad', 40: 'Chile', 41: 'China mainland', 44: 'Colombia', 45: 'Congo',
        46: 'Congo', 47: 'Costa Rica', 48: 'Cuba', 49: 'Cyprus', 50: 'Cyprus',
        51: 'Czech Republic', 52: 'Azerbaijan', 53: 'Belarus', 54: 'Denmark',
        55: 'Dominican Republic', 56: 'Ecuador', 57: 'Egypt', 58: 'El Salvador',
        59: 'Egypt', 60: 'Eritrea', 61: 'Estonia', 62: 'Ethiopia', 63: 'Finland',
        64: 'France', 66: 'Gabon', 67: 'Gambia', 68: 'Georgia', 69: 'Germany',
        70: 'Ghana', 72: 'Guatemala', 73: 'Guinea', 74: 'Guinea-Bissau',
        75: 'Guyana', 79: 'Haiti', 80: 'Bosnia and Herzegovina', 81: 'Honduras',
        83: 'India', 84: 'Indonesia', 86: 'Iran', 87: 'Iraq', 89: 'Ireland',
        90: 'Israel', 91: 'Italy', 93: 'Jamaica', 95: 'Japan', 96: 'Jordan',
        97: 'Kazakhstan', 98: 'Kenya', 99: 'Korea DPR', 100: 'Korea Republic',
        101: 'Kuwait', 102: 'Kyrgyzstan', 103: 'Lao', 104: 'Latvia', 105: 'Lebanon',
        106: 'Lesotho', 107: 'Liberia', 108: 'Libya', 109: 'Lithuania', 110: 'Luxembourg',
        112: 'Madagascar', 113: 'Malawi', 114: 'Malaysia', 115: 'Mali', 116: 'Malta',
        117: 'Mauritania', 118: 'Mauritius', 119: 'Mexico', 120: 'Mongolia',
        121: 'Morocco', 122: 'Mozambique', 123: 'Myanmar', 124: 'Namibia',
        126: 'Nepal', 127: 'Netherlands', 128: 'New Caledonia', 129: 'New Zealand',
        130: 'Nicaragua', 131: 'Niger', 132: 'Nigeria', 133: 'Norway',
        134: 'Oman', 135: 'Pakistan', 136: 'Panama', 137: 'Papua New Guinea',
        138: 'Paraguay', 141: 'Peru', 143: 'Philippines', 144: 'Poland', 145: 'Portugal',
        146: 'Qatar', 147: 'Romania', 148: 'Russian Federation', 149: 'Rwanda',
        150: 'Saudi Arabia', 153: 'Senegal', 154: 'Serbia', 155: 'Sierra Leone',
        156: 'Slovakia', 157: 'Slovenia', 158: 'South Africa', 159: 'Spain', 160: 'Sri Lanka',
        162: 'Sudan', 165: 'Sweden', 166: 'Switzerland', 167: 'Syrian Arab Republic',
        168: 'Tajikistan', 169: 'Thailand', 170: 'Togo', 171: 'Tunisia', 173: 'Turkey',
        174: 'Turkmenistan', 175: 'Uganda', 176: 'Ukraine', 177: 'United Kingdom',
        178: 'Tanzania', 179: 'United States', 182: 'Uruguay', 183: 'Uzbekistan',
        184: 'Venezuela', 185: 'Viet Nam', 186: 'Yemen', 188: 'Zambia',
        189: 'Zimbabwe', 191: 'Morocco', 193: 'Algeria', 194: 'Egypt', 195: 'Libya',
        196: 'Morocco', 197: 'Sudan', 198: 'Tunisia', 199: 'Western Sahara',
        200: 'Burkina Faso', 201: 'Burundi', 202: 'Cameroon', 203: 'Central African Republic',
        206: 'Chad', 207: 'Congo', 208: 'Côte d Ivoire', 209: 'Djibouti', 210: 'Eritrea',
        211: 'Ethiopia', 212: 'Gambia', 213: 'Ghana', 214: 'Guinea', 215: 'Guinea-Bissau',
        216: 'Kenya', 217: 'Lesotho', 218: 'Liberia', 219: 'Madagascar', 220: 'Malawi',
        222: 'Mali', 223: 'Mauritania', 225: 'Mozambique', 226: 'Namibia', 227: 'Niger',
        228: 'Nigeria', 229: 'Rwanda', 230: 'Sierra Leone', 231: 'Somalia',
        233: 'South Sudan', 234: 'Sudan', 235: 'Tanzania', 236: 'Togo', 237: 'Uganda',
        238: 'Zambia', 249: 'Zimbabwe', 250: 'Congo Democratic Republic', 251: 'Angola',
        255: 'Serbia and Montenegro', 256: 'Czechia', 273: 'Montenegro', 276: 'South Sudan',
        277: 'Eritrea', 299: 'Palestine', 351: 'China'
    }


def get_item_codes_cereals():
    """
    Get item codes for cereals (based on user's request: 44, 108, 15)
    """
    items = {
        15: 'Wheat',
        27: 'Rice',
        44: 'Barley',
        56: 'Maize',
        108: 'Other Cereals',
        236: 'Soybeans'
    }
    return items


def get_all_years(start=1961, end=2023):
    """
    Get list of all years from start to end
    """
    return list(range(start, end + 1))


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape FAOSTAT data in bulk')
    parser.add_argument('--areas', type=str, help='Comma-separated area codes (default: all countries)')
    parser.add_argument('--items', type=str, default='44,108,15', help='Comma-separated item codes (default: 44,108,15)')
    parser.add_argument('--elements', type=str, default='2510', help='Comma-separated element codes (default: 2510)')
    parser.add_argument('--years', type=str, help='Comma-separated years or range like 1961-2023')
    parser.add_argument('--year-start', type=int, default=1961, help='Start year (default: 1961)')
    parser.add_argument('--year-end', type=int, default=2023, help='End year (default: 2023)')
    parser.add_argument('--output', type=str, choices=['json', 'csv'], default='csv', help='Output format')
    
    args = parser.parse_args()
    
    # Process areas
    if args.areas:
        areas = args.areas
    else:
        # Use all countries
        area_list = get_country_codes_all()
        areas = ','.join(map(str, area_list))
    
    # Process items
    items = args.items
    
    # Process elements
    elements = args.elements
    
    # Process years
    if args.years:
        if '-' in args.years:
            start, end = map(int, args.years.split('-'))
            years_list = list(range(start, end + 1))
            years = ','.join(map(str, years_list))
        else:
            years = args.years
    else:
        years_list = get_all_years(args.year_start, args.year_end)
        years = ','.join(map(str, years_list))
    
    # Scrape the data
    try:
        result = scrape_faostat_bulk(areas, items, elements, years, args.output)
        
        # Print JSON to stdout for Node.js to capture
        print(json.dumps(result))
        
    except Exception as e:
        error_response = {"error": str(e)}
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)
