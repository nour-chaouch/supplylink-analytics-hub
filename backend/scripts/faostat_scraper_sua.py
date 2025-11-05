import sys
import json
import requests
import csv
import os
from datetime import datetime
from urllib.parse import urlparse, parse_qs, urlencode


def get_country_codes_all():
    """
    Get list of all FAOSTAT country codes
    """
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
        210, 211, 212, 208, 216, 176, 219, 220, 222, 213, 227, 223, 228, 226, 230, 225, 229, 215, 231, 234, 235, 155, 236, 237, 249, 248, 251, 181
    ]
    return country_codes


def get_all_years(start=1961, end=2023):
    """
    Get list of all years from start to end
    """
    return list(range(start, end + 1))


def build_sua_url_with_all_countries_and_years():
    """
    Build SUA API URL with all countries and all years
    """
    # Get all countries
    countries = get_country_codes_all()
    area_param = ','.join(map(str, countries))
    
    # Get all years
    years = get_all_years(1961, 2023)
    year_param = ','.join(map(str, years))
    
    # Food groups from the original URL
    foodgroups = 'FG14,FG1,FG18,FG5,FG11,FG6,FG17,FG16,FG15,FG10,FG8,FG7,FG4,FG20,FG3,FG2,FG19,FG13,FG12,FG9'
    
    # Indicators from the original URL
    indicators = '4040>,4009,4006,4016,4007,4037,4038,4003,4005,4010,4011,4012,4013,4004,4022,4032,4021,4035,4036,4034,4018,4017,4033,4024,4029,4015'
    
    # Build parameters
    params = {
        'area': area_param,
        'area_cs': 'M49',
        'foodgroup': foodgroups,
        'indicator': indicators,
        'year': year_param,
        'element': '6120',
        'show_codes': 'true',
        'show_unit': 'true',
        'show_flags': 'true',
        'show_notes': 'true',
        'null_values': 'false',
        'item': '',
        'output_type': 'objects',
        'caching': 'false'
    }
    
    # Build URL
    base_url = "https://faostatservices.fao.org/api/v1/en/data/SUA"
    url = f"{base_url}?{urlencode(params)}"
    
    return url


def scrape_single_country_all_years(country_code, base_params_template, api_url, headers, page_size=100):
    """
    Scrape data for a single country with all years
    Returns all data for that country
    """
    all_data = []
    page_number = 1
    total_records = 0
    
    # Get all years
    years = get_all_years(1961, 2023)
    year_param = ','.join(map(str, years))
    
    while True:
        # Build parameters for this country
        params = base_params_template.copy()
        params['area'] = str(country_code)
        params['year'] = year_param
        params.update({
            'page_number': page_number,
            'page_size': page_size,
            'output_type': 'objects',
            'caching': 'false'
        })
        
        try:
            if page_number == 1:
                print(f"  → Fetching data for country {country_code} (page {page_number})...", file=sys.stderr)
                sys.stderr.flush()
            
            response = requests.get(api_url, params=params, headers=headers, timeout=120)
            
            if response.status_code != 200:
                print(f"  ✗ Error for country {country_code}: {response.status_code}", file=sys.stderr)
                sys.stderr.flush()
                break
            
            data = response.json()
            
            # Extract data points
            if 'data' in data and data['data']:
                if len(data['data']) == 1 and 'NoRecords' in data['data'][0]:
                    break
                
                all_data.extend(data['data'])
                total_records += len(data['data'])
                if page_number == 1 and len(data['data']) > 0:
                    print(f"  ✓ Got {len(data['data'])} records on page {page_number}...", file=sys.stderr)
                    sys.stderr.flush()
            else:
                if page_number == 1:
                    print(f"  ℹ No data for country {country_code}", file=sys.stderr)
                    sys.stderr.flush()
                break
            
            # Check if there are more pages
            if 'metadata' in data and 'page_meta' in data['metadata']:
                page_meta = data['metadata']['page_meta']
                current_page = page_meta.get('page_number', 1)
                total_pages = page_meta.get('total_pages', 1)
                
                if current_page >= total_pages:
                    break
                
                page_number = current_page + 1
            else:
                if 'data' not in data or not data['data'] or len(data['data']) < page_size:
                    break
                page_number += 1
            
            if page_number > 1000:
                break
        
        except Exception as e:
            print(f"Error processing country {country_code}: {str(e)}", file=sys.stderr)
            break
    
    return all_data


def scrape_faostat_sua_all_countries(output_format='csv', page_size=100):
    """
    Scrape FAOSTAT SUA data country by country (each country with all years)
    Then combine all results into a single CSV file
    """
    try:
        # Build the API URL
        api_url = "https://faostatservices.fao.org/api/v1/en/data/SUA"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
        
        # Build base parameters template (without area and year - we'll set those per country)
        # Food groups from the original URL
        foodgroups = 'FG14,FG1,FG18,FG5,FG11,FG6,FG17,FG16,FG15,FG10,FG8,FG7,FG4,FG20,FG3,FG2,FG19,FG13,FG12,FG9'
        
        # Indicators from the original URL
        indicators = '4040>,4009,4006,4016,4007,4037,4038,4003,4005,4010,4011,4012,4013,4004,4022,4032,4021,4035,4036,4034,4018,4017,4033,4024,4029,4015'
        
        base_params_template = {
            'area_cs': 'M49',
            'foodgroup': foodgroups,
            'indicator': indicators,
            'element': '6120',
            'show_codes': 'true',
            'show_unit': 'true',
            'show_flags': 'true',
            'show_notes': 'true',
            'null_values': 'false',
            'item': ''
        }
        
        # Get all countries
        countries = get_country_codes_all()
        total_countries = len(countries)
        
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"Starting scraping for {total_countries} countries...", file=sys.stderr)
        print(f"Each country will be processed with all years (1961-2023)...", file=sys.stderr)
        print(f"{'='*60}\n", file=sys.stderr)
        sys.stderr.flush()
        
        # Collect all data from all countries
        all_data = []
        country_index = 0
        
        for country_code in countries:
            country_index += 1
            print(f"\n[{country_index}/{total_countries}] Processing country {country_code}...", file=sys.stderr)
            sys.stderr.flush()
            
            try:
                country_data = scrape_single_country_all_years(
                    country_code, 
                    base_params_template, 
                    api_url, 
                    headers, 
                    page_size
                )
                
                all_data.extend(country_data)
                print(f"  ✓ Country {country_code}: Retrieved {len(country_data)} records (Total so far: {len(all_data)})", file=sys.stderr)
                sys.stderr.flush()
                
            except Exception as e:
                print(f"  ✗ Error processing country {country_code}: {str(e)}", file=sys.stderr)
                sys.stderr.flush()
                continue
        
        print(f"\n{'='*60}", file=sys.stderr)
        print(f"=== Scraping Complete ===", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        print(f"Total countries processed: {country_index}/{total_countries}", file=sys.stderr)
        print(f"Total records collected: {len(all_data)}", file=sys.stderr)
        print(f"{'='*60}", file=sys.stderr)
        sys.stderr.flush()
        
        # Prepare final response
        final_response = {
            'metadata': {
                'dataset': 'SUA',
                'total_records': len(all_data),
                'total_countries': country_index
            },
            'data': all_data
        }
        
        # Save to CSV if requested
        if output_format == 'csv':
            save_to_csv_file_sua(final_response)
        
        return final_response
        
    except Exception as e:
        print(f"Error in scrape_faostat_sua_all_countries: {str(e)}", file=sys.stderr)
        raise


def scrape_faostat_sua(url=None, output_format='csv', page_size=100, chunk_countries=20, chunk_years=10):
    """
    Scrape FAOSTAT SUA data from a URL or with parameters
    Based on faostat_scraper_bulk.py pattern
    
    Args:
        url: Full FAOSTAT API URL with parameters (optional)
        output_format: 'json' or 'csv'
        page_size: Number of records per page
        chunk_countries: Number of countries per request (default: 20)
        chunk_years: Number of years per request (default: 10)
    
    Returns:
        Dictionary with all scraped data from all pages
    """
    try:
        # Build the API URL
        api_url = "https://faostatservices.fao.org/api/v1/en/data/SUA"
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }
        
        # Parse URL if provided
        if url:
            parsed_url = urlparse(url)
            params_dict = parse_qs(parsed_url.query)
            
            # Convert parsed params to simple dict (handle list values)
            base_params = {}
            for key, value_list in params_dict.items():
                if isinstance(value_list, list) and len(value_list) > 0:
                    base_params[key] = value_list[0] if len(value_list) == 1 else ','.join(value_list)
                else:
                    base_params[key] = value_list[0] if value_list else ''
            
            # Remove no_records if present (we want actual data)
            if 'no_records' in base_params:
                del base_params['no_records']
            
            # Remove pagination params (we'll set them ourselves)
            if 'page_number' in base_params:
                del base_params['page_number']
            if 'page_size' in base_params:
                del base_params['page_size']
        else:
            base_params = {}
        
        print(f"Fetching data from FAOSTAT API SUA dataset...", file=sys.stderr)
        
        # Collect all data from all pages
        all_data = []
        page_number = 1
        total_records = 0
        
        while True:
            # Parameters for current page
            params = base_params.copy()
            params.update({
                'page_number': page_number,
                'page_size': page_size,
                'output_type': 'objects',
                'caching': 'false'
            })
            
            if page_number == 1:
                print(f"Fetching page {page_number}... (This may take several minutes for the first request with all countries and years. Please wait...)", file=sys.stderr)
            else:
                print(f"Fetching page {page_number}...", file=sys.stderr)
            sys.stderr.flush()
            
            # Make the API request with longer timeout for large requests
            # First request may take much longer to process
            request_timeout = 600 if page_number == 1 else 180  # 10 minutes for first page, 3 minutes for others
            
            try:
                response = requests.get(api_url, params=params, headers=headers, timeout=request_timeout)
            except requests.exceptions.Timeout:
                print(f"Request timeout on page {page_number}. The query may be too large. Retrying with longer timeout...", file=sys.stderr)
                sys.stderr.flush()
                # Retry with even longer timeout
                response = requests.get(api_url, params=params, headers=headers, timeout=900)  # 15 minutes
            
            if response.status_code != 200:
                raise Exception(f"API returned status code {response.status_code}: {response.text}")
            
            data = response.json()
            
            # Extract data points
            if 'data' in data and data['data']:
                # Check if response contains only NoRecords count
                if len(data['data']) == 1 and 'NoRecords' in data['data'][0]:
                    num_records = data['data'][0]['NoRecords']
                    print(f"API indicates {num_records} total records available. Continuing with pagination...", file=sys.stderr)
                    # Continue to next page if we only got count
                    page_number += 1
                    continue
                
                all_data.extend(data['data'])
                total_records += len(data['data'])
                print(f"Page {page_number}: Retrieved {len(data['data'])} records (Total: {total_records})", file=sys.stderr)
                sys.stderr.flush()
            else:
                print(f"No data in page {page_number}", file=sys.stderr)
            
            # Check if there are more pages
            if 'metadata' in data and 'page_meta' in data['metadata']:
                page_meta = data['metadata']['page_meta']
                current_page = page_meta.get('page_number', 1)
                total_pages = page_meta.get('total_pages', 1)
                
                print(f"Page {current_page} of {total_pages} (Progress: {round(current_page/total_pages*100, 1)}%)", file=sys.stderr)
                sys.stderr.flush()
                
                if current_page >= total_pages:
                    print(f"All pages retrieved. Total: {total_records} records", file=sys.stderr)
                    break
                
                page_number = current_page + 1
            else:
                # If no pagination metadata, try to continue if we got data
                if 'data' not in data or not data['data'] or len(data['data']) < page_size:
                    print(f"No more data available", file=sys.stderr)
                    break
                page_number += 1
            
            # Safety limit to prevent infinite loops
            if page_number > 1000:
                print("Reached safety limit of 1000 pages", file=sys.stderr)
                break
        
        # Prepare final response
        final_response = {
            'metadata': {
                'dataset': 'SUA',
                'total_records': total_records,
                'total_pages': page_number - 1
            },
            'data': all_data
        }
        
        # Save to CSV if requested
        if output_format == 'csv':
            save_to_csv_file_sua(final_response)
        
        return final_response
        
    except Exception as e:
        print(f"Error in scrape_faostat_sua: {str(e)}", file=sys.stderr)
        raise


def save_to_csv_file_sua(data):
    """
    Save the SUA scraped data to CSV and JSON files
    """
    try:
        # Create output directory
        output_dir = os.path.join(os.path.dirname(__file__), 'bulk_csv_output')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        csv_filename = os.path.join(output_dir, f'SUA_bulk_data_{timestamp}.csv')
        
        # Extract data points
        if 'data' in data and data['data']:
            data_points = data['data']
            
            # Write CSV file
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                if data_points:
                    # Get fieldnames from first item
                    fieldnames = list(data_points[0].keys())
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for item in data_points:
                        writer.writerow(item)
            
            print(f"CSV file saved: {csv_filename}", file=sys.stderr)
            print(f"Total records: {len(data_points)}", file=sys.stderr)
        else:
            print("No data points found in API response", file=sys.stderr)
        
        # Also save the full JSON response
        json_filename = os.path.join(output_dir, f'SUA_bulk_data_{timestamp}.json')
        with open(json_filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
        
        print(f"JSON file saved: {json_filename}", file=sys.stderr)
        
        return output_dir
        
    except Exception as e:
        print(f"Error saving to CSV: {str(e)}", file=sys.stderr)
        raise


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Scrape FAOSTAT SUA data from URL')
    parser.add_argument('--url', type=str, default=None, help='Full FAOSTAT API URL with parameters')
    parser.add_argument('--all-countries', action='store_true', default=True, help='Process all countries one by one (default: True)')
    parser.add_argument('--output', type=str, choices=['json', 'csv'], default='csv', help='Output format (default: csv)')
    parser.add_argument('--page-size', type=int, default=100, help='API page size (default: 100)')
    
    args = parser.parse_args()
    
    # Print startup message immediately
    print("=" * 60, file=sys.stderr)
    print("FAOSTAT SUA Data Scraper - Starting...", file=sys.stderr)
    print("=" * 60, file=sys.stderr)
    sys.stderr.flush()
    
    # Scrape the data country by country
    try:
        if args.url:
            print(f"Using provided URL...", file=sys.stderr)
            sys.stderr.flush()
            # If URL provided, use the old method
            result = scrape_faostat_sua(
                url=args.url,
                output_format=args.output,
                page_size=args.page_size
            )
        else:
            print(f"Processing all countries one by one...", file=sys.stderr)
            sys.stderr.flush()
            # Default: process all countries one by one
            result = scrape_faostat_sua_all_countries(
                output_format=args.output,
                page_size=args.page_size
            )
        
        # Print JSON to stdout for Node.js to capture (if needed)
        print(json.dumps(result))
        
    except Exception as e:
        error_response = {"error": str(e)}
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)
