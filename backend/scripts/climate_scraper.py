
import sys
import json
import requests
from bs4 import BeautifulSoup
import time
from datetime import datetime

def scrape_fao_climate_data(region_code, year_start, year_end):
    """
    Scrape climate data from FAO website
    """
    # FAO STAT domain for climate data
    url = "https://www.fao.org/faostat/en/#data/ET"
    
    # Make request to the FAO website
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
    response = requests.get(url, headers=headers)
    
    if response.status_code != 200:
        raise Exception(f"Failed to access FAO website: {response.status_code}")
    
    # Get the regions mapping
    regions = {
        "1": "Northern Africa",
        "2": "Eastern Africa",
        "3": "Middle Africa",
        "4": "Southern Africa",
        "5": "Western Africa"
    }
    
    region_name = regions.get(region_code, "Northern Africa")
    
    # Access the FAOSTAT API directly for temperature data
    api_url = "https://fenixservices.fao.org/faostat/api/v1/en/data/ET"
    params = {
        "area": region_code,
        "element": "7271", # Temperature change
        "year_start": year_start,
        "year_end": year_end
    }
    
    api_response = requests.get(api_url, params=params, headers=headers)
    
    if api_response.status_code != 200:
        raise Exception(f"Failed to access FAO API: {api_response.status_code}")
    
    data = api_response.json()
    
    # Process the API response
    temperature_data = []
    
    if 'data' in data:
        for item in data['data']:
            year = item.get('year')
            value = item.get('value')
            if year and value:
                temperature_data.append({
                    'year': int(year),
                    'value': float(value),
                    'unit': '°C'
                })
    
    # For rainfall, use the AQUASTAT API
    rainfall_api_url = "https://fenixservices.fao.org/faostat/api/v1/en/data/QCL"
    rainfall_params = {
        "area": region_code,
        "element": "7271",
        "year_start": year_start,
        "year_end": year_end
    }
    
    rainfall_response = requests.get(rainfall_api_url, params=rainfall_params, headers=headers)
    
    if rainfall_response.status_code != 200:
        raise Exception(f"Failed to access FAO rainfall API: {rainfall_response.status_code}")
    
    rainfall_data = []
    rainfall_json = rainfall_response.json()
    
    if 'data' in rainfall_json:
        for item in rainfall_json['data']:
            year = item.get('year')
            value = item.get('value')
            if year and value:
                rainfall_data.append({
                    'year': int(year),
                    'value': float(value),
                    'unit': 'mm'
                })
    
    # For monthly data, scrape from GIEWS Earth Observation
    monthly_url = "https://www.fao.org/giews/earthobservation/country/index.jsp?lang=en&code=" + region_code
    monthly_response = requests.get(monthly_url, headers=headers)
    
    monthly_data = []
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    
    if monthly_response.status_code == 200:
        monthly_soup = BeautifulSoup(monthly_response.content, 'html.parser')
        
        # Extract monthly data from tables
        tables = monthly_soup.select('table')
        for table in tables:
            headers = [th.text.strip() for th in table.select('th')]
            if 'Month' in headers and ('Temperature' in headers or 'Rainfall' in headers):
                rows = table.select('tr')[1:]  # Skip header row
                for i, row in enumerate(rows):
                    if i < len(months):
                        cells = row.select('td')
                        if len(cells) >= 3:
                            try:
                                temp_value = float(cells[1].text.strip())
                                rain_value = float(cells[2].text.strip())
                                
                                monthly_data.append({
                                    "month": months[i],
                                    "temperature": temp_value,
                                    "rainfall": rain_value
                                })
                            except (ValueError, IndexError):
                                pass
    
    # If we couldn't get proper monthly data, try another approach
    if len(monthly_data) < 12:
        # Try to scrape from Climate Change Knowledge Portal
        wb_url = f"https://climateknowledgeportal.worldbank.org/api/data/region/{region_code}"
        wb_response = requests.get(wb_url, headers=headers)
        
        if wb_response.status_code == 200:
            try:
                wb_data = wb_response.json()
                if 'monthlyData' in wb_data:
                    monthly_data = []
                    for month in months:
                        month_data = wb_data['monthlyData'].get(month, {})
                        monthly_data.append({
                            "month": month,
                            "temperature": month_data.get('temperature', 0),
                            "rainfall": month_data.get('precipitation', 0)
                        })
            except:
                pass
    
    # If we still don't have monthly data, try one more source
    if len(monthly_data) < 12:
        # Try FAO GIEWS Country Briefs
        giews_url = f"https://www.fao.org/giews/countrybrief/country.jsp?code={region_code}"
        giews_response = requests.get(giews_url, headers=headers)
        
        if giews_response.status_code == 200:
            giews_soup = BeautifulSoup(giews_response.content, 'html.parser')
            climate_tables = giews_soup.select('.climate-table')
            
            if climate_tables:
                rows = climate_tables[0].select('tr')
                for i, row in enumerate(rows[1:]):  # Skip header
                    if i < len(months):
                        cells = row.select('td')
                        if len(cells) >= 3:
                            try:
                                temp = float(cells[1].text.strip())
                                rain = float(cells[2].text.strip())
                                
                                monthly_data.append({
                                    "month": months[i],
                                    "temperature": temp,
                                    "rainfall": rain
                                })
                            except:
                                pass
    
    # Prepare the response data
    climate_data = {
        'region': region_name,
        'temperature_trend': temperature_data,
        'rainfall_trend': rainfall_data,
        'monthly_data': monthly_data,
        'data_source': 'FAOSTAT (Scraped)'
    }
    
    return climate_data

# Main execution
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python script.py region_code year_start year_end")
        sys.exit(1)
    
    region_code = sys.argv[1]
    year_start = sys.argv[2]
    year_end = sys.argv[3]
    
    try:
        result = scrape_fao_climate_data(region_code, year_start, year_end)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"error": str(e)}))
        sys.exit(1)
