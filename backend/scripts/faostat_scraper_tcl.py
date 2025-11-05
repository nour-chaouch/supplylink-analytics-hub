import json
import sys
from datetime import datetime

# Reuse the generic scraper utilities
from faostat_scraper_generic import (
    scrape_faostat_bulk_generic,
    get_country_codes_all,
    get_all_years,
)


def chunk_list(values_str: str, batch_size: int):
    values = [v.strip() for v in values_str.split(',') if v.strip()]
    for i in range(0, len(values), batch_size):
        yield ",".join(values[i:i+batch_size])


def run_tcl_scrape(
    areas: str | None = None,
    elements: str = "2910,2610",
    items: str | None = None,
    year_start: int = 1961,
    year_end: int = 2023,
    csv_delimiter: str = ",",
    csv_quoting: str = "none",
    csv_sanitize_commas: bool = True,
    csv_sanitize_replacement: str = " ",
    # robustness controls
    page_size: int = 50,
    request_timeout: int = 180,
    retries: int = 5,
    retry_backoff_seconds: int = 3,
    items_batch_size: int = 60,
    areas_batch_size: int = 60,
    years_batch_size: int = 10,
    inter_batch_sleep_seconds: int = 2,
    max_pages: int | None = None,
):
    # Areas: default to all FAOSTAT countries
    if not areas:
        areas = ",".join(map(str, get_country_codes_all()))

    # Items: default to the provided (long) TCL item list
    if not items:
        items = (
            "809,800,221,231,1168,1274,711,518,519,515,526,527,226,366,367,572,170,839,203,486,"
            "44,48,46,176,51,86,1181,1183,169,647,552,872,47,91,112,96,59,81,105,77,213,35,73,"
            "85,17,216,229,20,41,654,181,420,89,21,983,886,264,893,899,358,335,238,253,332,245,"
            "338,314,61,294,259,272,37,282,291,269,341,101,163,630,451,568,426,217,230,591,128,"
            "125,265,869,871,393,113,635,108,1021,984,904,901,531,220,191,459,689,401,666,517,"
            "828,829,693,514,640,698,1031,661,664,663,662,665,252,250,249,659,660,658,657,656,"
            "813,110,845,251,767,770,329,769,768,331,195,554,885,1293,397,550,909,577,1222,843,"
            "450,868,1018,1036,978,1059,1075,1074,1098,151,149,399,1091,1064,1063,753,873,672,"
            "1129,1037,1065,1243,1060,854,855,850,840,842,841,1259,852,569,570,1218,773,771,774,"
            "90,126,111,95,624,58,80,104,295,212,38,150,72,84,117,343,94,1232,115,653,641,636,"
            "623,625,1163,57,19,953,887,720,172,846,549,562,509,510,560,566,446,406,244,242,243,"
            "1008,1219,1030,1100,858,859,857,225,233,336,1062,1215,1136,922,921,959,1104,1105,"
            "1103,1214,958,1134,920,626,877,476,677,1097,28,631,910,1276,109,175,278,513,622,498,"
            "583,580,538,539,496,780,778,311,312,263,782,592,224,173,1221,1217,407,499,497,201,"
            "372,333,1241,878,461,862,210,56,50,49,584,571,1242,671,1173,1108,947,1127,870,867,"
            "1058,1069,1073,1017,1038,1035,1089,1141,977,1080,1172,299,79,103,114,165,449,563,"
            "292,293,1182,837,836,702,75,76,1167,266,737,313,334,60,274,258,297,36,290,276,430,"
            "261,273,260,262,403,402,491,492,490,414,558,512,821,651,166,620,619,639,643,831,1164,"
            "1166,633,234,340,339,211,1213,1216,723,541,161,604,603,466,465,474,463,256,257,600,"
            "391,22,534,247,521,187,417,687,748,587,1043,1042,1039,1040,197,576,574,575,223,489,"
            "536,537,507,296,45,120,116,118,1066,1061,246,235,907,628,394,755,754,523,92,561,788,"
            "270,271,547,162,957,919,1025,995,999,882,982,1186,908,160,164,1277,27,32,31,29,30,"
            "39,71,280,281,874,1041,289,979,987,1187,1185,789,898,888,896,895,930,929,997,1195,"
            "1028,1027,1002,1047,1046,1045,1146,998,928,1026,996,83,530,237,236,241,240,239,1295,"
            "373,129,544,423,167,157,156,168,267,268,649,447,448,122,1225,495,127,121,136,667,"
            "390,388,392,97,777,275,646,18,634,826,692,652,460,306,1296,655,473,475,472,469,471,"
            "565,205,853,222,232,567,15,16,905,890,900,903,897,889,894,564,994,988,1009,1007,137,"
            "135,891,892,875,1275"
        )

    # Build full lists
    all_years = list(map(str, get_all_years(year_start, year_end)))
    if not areas:
        areas_list = list(map(str, get_country_codes_all()))
        areas = ",".join(areas_list)

    # Simple manifest to avoid re-scraping completed batches
    import os as os_module
    manifest_dir = os_module.path.join(os_module.path.dirname(__file__), 'bulk_csv_output')
    os_module.makedirs(manifest_dir, exist_ok=True)
    manifest_path = os_module.path.join(manifest_dir, 'tcl_manifest.json')
    try:
        with open(manifest_path, 'r', encoding='utf-8') as mf:
            manifest = json.load(mf)
    except Exception:
        manifest = {"completed": []}
    completed = set(manifest.get("completed", []))

    def batch_key(years_chunk: str, areas_chunk: str, items_chunk: str) -> str:
        # Compact deterministic key
        return f"y:{years_chunk}|a:{areas_chunk}|i:{items_chunk}"

    def record_completed(key: str):
        manifest.setdefault("completed", [])
        if key not in manifest["completed"]:
            manifest["completed"].append(key)
            try:
                with open(manifest_path, 'w', encoding='utf-8') as mf:
                    json.dump(manifest, mf, indent=2, ensure_ascii=False)
            except Exception:
                pass

    # Batch over items, areas, and years to avoid 504
    import time
    import csv as csv_module
    batch_index = 0
    total_records = 0
    outputs = []
    all_accumulated_data = []  # Accumulate all data from all batches
    
    # Load existing TCL CSV files if they exist (to combine with new data)
    print("Loading existing TCL CSV files...", file=sys.stderr)
    existing_csv_files = [f for f in os_module.listdir(manifest_dir) if f.startswith('TCL_bulk_data_') and f.endswith('.csv')]
    for csv_file in existing_csv_files:
        csv_path = os_module.path.join(manifest_dir, csv_file)
        try:
            with open(csv_path, 'r', encoding='utf-8', newline='') as f:
                reader = csv_module.DictReader(f)
                file_data = list(reader)
                if file_data:
                    all_accumulated_data.extend(file_data)
                    print(f"Loaded {len(file_data)} records from {csv_file}", file=sys.stderr)
        except Exception as e:
            print(f"Warning: Could not load {csv_file}: {e}", file=sys.stderr)
    
    if all_accumulated_data:
        print(f"Total records loaded from existing files: {len(all_accumulated_data)}", file=sys.stderr)
    
    # Pre-split years and areas
    for y_start in range(0, len(all_years), max(1, years_batch_size)):
        years_chunk = ",".join(all_years[y_start:y_start + max(1, years_batch_size)])
        for areas_chunk in chunk_list(areas, max(1, areas_batch_size)):
            for items_chunk in chunk_list(items, max(1, items_batch_size)):
                batch_index += 1
                print(
                    f"Running TCL batch {batch_index} | years={years_chunk} | areas={len(areas_chunk.split(','))} | items={len(items_chunk.split(','))}",
                    file=sys.stderr,
                )
                key = batch_key(years_chunk, areas_chunk, items_chunk)
                if key in completed:
                    print(f"Skipping completed batch: {key}", file=sys.stderr)
                    time.sleep(0.1)
                    continue
                try:
                    # Don't save CSV per batch, just get the data
                    result = scrape_faostat_bulk_generic(
                        dataset="TCL",
                        areas=areas_chunk,
                        items=items_chunk,
                        elements=elements,
                        years=years_chunk,
                        output_format="json",  # Get JSON to accumulate
                        max_pages=max_pages,
                        csv_delimiter=csv_delimiter,
                        csv_quoting=csv_quoting,
                        csv_sanitize_commas=csv_sanitize_commas,
                        csv_sanitize_replacement=csv_sanitize_replacement,
                        request_timeout=request_timeout,
                        page_size=page_size,
                        retries=retries,
                        retry_backoff_seconds=retry_backoff_seconds,
                    )
                    # Accumulate data from this batch
                    batch_data = result.get("data", [])
                    if batch_data:
                        all_accumulated_data.extend(batch_data)
                    
                    meta = result.get("metadata", {})
                    total_records += int(meta.get("total_records", 0))
                    outputs.append(meta)
                    record_completed(key)
                    print(f"Batch {batch_index} completed: {len(batch_data)} records (Total accumulated: {len(all_accumulated_data)})", file=sys.stderr)
                except Exception as exc:
                    print(f"Batch failed and will retry on next run: {key} | error={exc}", file=sys.stderr)
                time.sleep(max(0, inter_batch_sleep_seconds))

    # Write all accumulated data to a single CSV file
    final_csv_path = None
    deduplicated_data = []
    if all_accumulated_data:
        # Map quoting string to csv module constants
        quoting_map = {
            'minimal': csv_module.QUOTE_MINIMAL,
            'all': csv_module.QUOTE_ALL,
            'none': csv_module.QUOTE_NONE,
            'nonnumeric': csv_module.QUOTE_NONNUMERIC,
        }
        quoting_value = quoting_map.get(str(csv_quoting).lower(), csv_module.QUOTE_MINIMAL)
        
        # Deduplicate data based on unique keys (area, item, element, year)
        print(f"Deduplicating {len(all_accumulated_data)} records...", file=sys.stderr)
        seen_keys = set()
        for row in all_accumulated_data:
            # Create a unique key from area, item, element, year
            area_code = str(row.get('Area Code', row.get('area_code', row.get('AreaCode', ''))))
            item_code = str(row.get('Item Code', row.get('item_code', row.get('ItemCode', ''))))
            element_code = str(row.get('Element Code', row.get('element_code', row.get('ElementCode', ''))))
            year = str(row.get('Year', row.get('year', row.get('YearCode', ''))))
            unique_key = f"{area_code}|{item_code}|{element_code}|{year}"
            if unique_key not in seen_keys:
                seen_keys.add(unique_key)
                deduplicated_data.append(row)
        
        print(f"After deduplication: {len(deduplicated_data)} unique records", file=sys.stderr)
        
        # Sanitize commas if needed
        data_points = deduplicated_data
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
        
        # Generate final CSV filename
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        final_csv_path = os_module.path.join(manifest_dir, f'TCL_complete_data_{timestamp}.csv')
        
        # Write CSV file
        with open(final_csv_path, 'w', newline='', encoding='utf-8') as f:
            if data_points:
                # Get fieldnames from first item
                fieldnames = list(data_points[0].keys())
                kwargs = {
                    'fieldnames': fieldnames,
                    'delimiter': csv_delimiter,
                    'quoting': quoting_value,
                }
                if quoting_value == csv_module.QUOTE_NONE:
                    kwargs['escapechar'] = '\\'
                writer = csv_module.DictWriter(f, **kwargs)
                writer.writeheader()
                
                for item in data_points:
                    writer.writerow(item)
        
        print(f"Final CSV file saved: {final_csv_path} with {len(deduplicated_data)} unique records", file=sys.stderr)

    print(json.dumps({
        "status": "ok",
        "batches": batch_index,
        "total_records": total_records,
        "accumulated_records": len(all_accumulated_data),
        "deduplicated_records": len(deduplicated_data) if all_accumulated_data else 0,
        "final_csv": final_csv_path,
        "outputs": outputs,
        "generated_at": datetime.utcnow().isoformat() + "Z",
    }))


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description='Scrape FAOSTAT TCL dataset with batching')
    parser.add_argument('--areas', type=str, help='Comma-separated area codes (default: all countries)')
    parser.add_argument('--elements', type=str, default='2910,2610', help='Element codes (default: 2910,2610)')
    parser.add_argument('--items', type=str, help='Comma-separated item codes (default: built-in long list)')
    parser.add_argument('--year-start', type=int, default=1961)
    parser.add_argument('--year-end', type=int, default=2023)
    parser.add_argument('--csv-delimiter', type=str, default=',')
    parser.add_argument('--csv-quoting', type=str, default='none', choices=['minimal','all','none','nonnumeric'])
    parser.add_argument('--csv-sanitize-commas', action='store_true', default=True)
    parser.add_argument('--csv-sanitize-replacement', type=str, default=' ')
    parser.add_argument('--page-size', type=int, default=50)
    parser.add_argument('--request-timeout', type=int, default=180)
    parser.add_argument('--retries', type=int, default=5)
    parser.add_argument('--retry-backoff-seconds', type=int, default=3)
    parser.add_argument('--items-batch-size', type=int, default=60)
    parser.add_argument('--areas-batch-size', type=int, default=60)
    parser.add_argument('--years-batch-size', type=int, default=10)
    parser.add_argument('--inter-batch-sleep-seconds', type=int, default=2)
    parser.add_argument('--max-pages', type=int, default=None)

    args = parser.parse_args()

    try:
        run_tcl_scrape(
            areas=args.areas,
            elements=args.elements,
            items=args.items,
            year_start=args.year_start,
            year_end=args.year_end,
            csv_delimiter=args.csv_delimiter,
            csv_quoting=args.csv_quoting,
            csv_sanitize_commas=args.csv_sanitize_commas,
            csv_sanitize_replacement=args.csv_sanitize_replacement,
            page_size=args.page_size,
            request_timeout=args.request_timeout,
            retries=args.retries,
            retry_backoff_seconds=args.retry_backoff_seconds,
            items_batch_size=args.items_batch_size,
            areas_batch_size=args.areas_batch_size,
            years_batch_size=args.years_batch_size,
            inter_batch_sleep_seconds=args.inter_batch_sleep_seconds,
            max_pages=args.max_pages,
        )
    except Exception as e:
        print(json.dumps({"error": str(e)}), file=sys.stderr)
        sys.exit(1)
