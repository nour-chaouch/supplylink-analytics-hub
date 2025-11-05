import sys
import json
import requests
import csv
import os
from datetime import datetime


def scrape_faostat_bulk_generic(
    dataset,
    areas,
    items,
    elements,
    years,
    output_format='json',
    max_pages=None,
    csv_delimiter=',',
    csv_quoting='minimal',
    csv_sanitize_commas=False,
    csv_sanitize_replacement=' - ',
    request_timeout=60,
    page_size=100,
    retries=3,
    retry_backoff_seconds=2,
):
    """
    Scrape FAOSTAT data in bulk for a given dataset with custom parameters and pagination support

    Args:
        dataset: FAOSTAT dataset code (e.g., 'QCL', 'Crops', etc.)
        areas: List or comma-separated string of area codes
        items: List or comma-separated string of item codes
        elements: List or comma-separated string of element codes
        years: List or comma-separated string of years
        output_format: 'json' or 'csv'
        max_pages: Maximum number of pages to scrape (int or None)
        csv_delimiter: Delimiter character to use when writing CSV
        csv_quoting: Quoting strategy: 'minimal', 'all', 'none', 'nonnumeric'
        request_timeout: HTTP request timeout in seconds
        page_size: Number of records per page (API page_size)
        retries: Number of retries per page on network/API failure
        retry_backoff_seconds: Base backoff seconds for retries

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

        # Build the API URL (dataset configurable)
        api_url = f"https://faostatservices.fao.org/api/v1/en/data/{dataset}"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'application/json'
        }

        print(f"Fetching data from FAOSTAT API dataset '{dataset}'...", file=sys.stderr)

        # Collect all data from all pages
        all_data = []
        page_number = 1
        total_records = 0
        page_size = int(page_size) if page_size else 100
        pages_fetched = 0

        while True:
            # Parameters matching the request
            params = {
                'area': area_param,
                'area_cs': 'M49',
                'element': element_param,
                'item': item_param,
                'item_cs': 'CPC',
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
            # Simple retry loop per page
            last_exc = None
            for attempt in range(1, int(retries) + 2):
                try:
                    response = requests.get(api_url, params=params, headers=headers, timeout=request_timeout)
                    if response.status_code != 200:
                        raise Exception(f"API returned status code {response.status_code}: {response.text}")
                    data = response.json()
                    last_exc = None
                    break
                except Exception as exc:
                    last_exc = exc
                    if attempt <= int(retries):
                        wait_seconds = retry_backoff_seconds * attempt
                        print(f"Request failed (attempt {attempt}/{int(retries)+1}): {exc}. Retrying in {wait_seconds}s...", file=sys.stderr)
                        try:
                            import time
                            time.sleep(wait_seconds)
                        except Exception:
                            pass
                    else:
                        break

            if last_exc is not None:
                raise last_exc

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

            pages_fetched += 1
            # Stop if reached max_pages
            if max_pages is not None and pages_fetched >= max_pages:
                print(f"Reached max_pages limit: {max_pages}. Stopping.", file=sys.stderr)
                break

        # Prepare final response
        final_response = {
            'metadata': {
                'dataset': dataset,
                'total_records': total_records,
                'total_pages': page_number - 1
            },
            'data': all_data
        }

        # Save to CSV if requested
        if output_format == 'csv':
            save_to_csv_file_generic(
                dataset,
                final_response,
                csv_delimiter=csv_delimiter,
                csv_quoting=csv_quoting,
                csv_sanitize_commas=csv_sanitize_commas,
                csv_sanitize_replacement=csv_sanitize_replacement,
            )

        return final_response

    except Exception as e:
        print(f"Error in scrape_faostat_bulk_generic: {str(e)}", file=sys.stderr)
        raise


def save_to_csv_file_generic(dataset, data, csv_delimiter=',', csv_quoting='minimal', csv_sanitize_commas=False, csv_sanitize_replacement=' - '):
    """
    Save the bulk scraped data to CSV and JSON files (generic)
    """
    try:
        # Map quoting string to csv module constants
        quoting_map = {
            'minimal': csv.QUOTE_MINIMAL,
            'all': csv.QUOTE_ALL,
            'none': csv.QUOTE_NONE,
            'nonnumeric': csv.QUOTE_NONNUMERIC,
        }
        quoting_value = quoting_map.get(str(csv_quoting).lower(), csv.QUOTE_MINIMAL)

        # Create output directory
        output_dir = os.path.join(os.path.dirname(__file__), 'bulk_csv_output')
        if not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # Generate filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        csv_filename = os.path.join(output_dir, f'{dataset}_bulk_data_{timestamp}.csv')

        # Extract data points
        if 'data' in data and data['data']:
            data_points = data['data']
            # Optionally sanitize commas to avoid quoting when delimiter is comma
            if csv_delimiter == ',' and csv_sanitize_commas:
                sanitized = []
                for row in data_points:
                    new_row = {}
                    for k, v in row.items():
                        if isinstance(v, str):
                            new_row[k] = v.replace(',', csv_sanitize_replacement)
                        else:
                            new_row[k] = v
                    sanitized.append(new_row)
                data_points = sanitized

            # Write CSV file
            with open(csv_filename, 'w', newline='', encoding='utf-8') as f:
                if data_points:
                    # Get fieldnames from first item
                    fieldnames = list(data_points[0].keys())
                    # Use escapechar when quoting is none
                    kwargs = {
                        'fieldnames': fieldnames,
                        'delimiter': csv_delimiter,
                        'quoting': quoting_value,
                    }
                    if quoting_value == csv.QUOTE_NONE:
                        kwargs['escapechar'] = '\\'
                    writer = csv.DictWriter(f, **kwargs)
                    writer.writeheader()

                    for item in data_points:
                        writer.writerow(item)

            print(f"CSV file saved: {csv_filename}", file=sys.stderr)
            print(f"Total records: {len(data_points)}", file=sys.stderr)
        else:
            print("No data points found in API response", file=sys.stderr)

        # Also save the full JSON response
        json_filename = os.path.join(output_dir, f'{dataset}_bulk_data_{timestamp}.json')
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


def get_all_years(start=1961, end=2023):
    """
    Get list of all years from start to end
    """
    return list(range(start, end + 1))


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description='Scrape FAOSTAT data in bulk (generic dataset)')
    parser.add_argument('--dataset', type=str, default='QCL', help='FAOSTAT dataset code (default: QCL)')
    parser.add_argument('--areas', type=str, help='Comma-separated area codes (default: all countries)')
    parser.add_argument('--items', type=str, default='44,108,15', help='Comma-separated item codes (default: 44,108,15)')
    parser.add_argument('--elements', type=str, default='2510', help='Comma-separated element codes (default: 2510)')
    parser.add_argument('--years', type=str, help='Comma-separated years or range like 1961-2023')
    parser.add_argument('--year-start', type=int, default=1961, help='Start year (default: 1961)')
    parser.add_argument('--year-end', type=int, default=2023, help='End year (default: 2023)')
    parser.add_argument('--output', type=str, choices=['json', 'csv'], default='csv', help='Output format')
    parser.add_argument('--max-pages', type=int, default=None, help='Maximum number of pages to scrape (default: unlimited)')
    parser.add_argument('--csv-delimiter', type=str, default=',', help='CSV delimiter character (default: ,)')
    parser.add_argument('--csv-quoting', type=str, choices=['minimal','all','none','nonnumeric'], default='minimal', help='CSV quoting strategy (default: minimal)')
    parser.add_argument('--csv-sanitize-commas', action='store_true', help='Replace commas in string fields to avoid quoting with comma delimiter')
    parser.add_argument('--csv-sanitize-replacement', type=str, default=' - ', help='Replacement text for commas when sanitizing')
    parser.add_argument('--request-timeout', type=int, default=60, help='HTTP request timeout in seconds (default: 60)')
    parser.add_argument('--page-size', type=int, default=100, help='API page size (default: 100)')
    parser.add_argument('--retries', type=int, default=3, help='Retries per page on failure (default: 3)')
    parser.add_argument('--retry-backoff-seconds', type=int, default=2, help='Base backoff seconds (default: 2)')

    args = parser.parse_args()

    # Process areas
    if args.areas:
        areas = args.areas
    else:
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
        result = scrape_faostat_bulk_generic(
            args.dataset,
            areas,
            items,
            elements,
            years,
            args.output,
            max_pages=args.max_pages,
            csv_delimiter=args.csv_delimiter,
            csv_quoting=args.csv_quoting,
            csv_sanitize_commas=args.csv_sanitize_commas,
            csv_sanitize_replacement=args.csv_sanitize_replacement,
            request_timeout=args.request_timeout,
            page_size=args.page_size,
            retries=args.retries,
            retry_backoff_seconds=args.retry_backoff_seconds,
        )

        # Print JSON to stdout for Node.js to capture
        print(json.dumps(result))

    except Exception as e:
        error_response = {"error": str(e)}
        print(json.dumps(error_response), file=sys.stderr)
        sys.exit(1)


