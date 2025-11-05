#!/usr/bin/env python3
"""
Script simple pour scraper les données TCL depuis l'API FAOSTAT
et créer un fichier CSV avec toutes les données
"""
import requests
import csv
import json
import os
from datetime import datetime

# Import des fonctions utilitaires
try:
    from faostat_scraper_generic import get_country_codes_all
except ImportError:
    # Fallback si l'import ne fonctionne pas
    def get_country_codes_all():
        """Get list of all FAOSTAT country codes"""
        return [
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

# Configuration de l'URL
API_BASE = "https://faostatservices.fao.org/api/v1/en/data/TCL"

# Obtenir tous les codes de pays
ALL_COUNTRIES = get_country_codes_all()
ALL_COUNTRIES_STR = ','.join(map(str, ALL_COUNTRIES))

# Années : 2000-2020 (20 ans)
YEARS = list(range(2000, 2021))
YEARS_STR = ','.join(map(str, YEARS))

# Paramètres de la requête
PARAMS = {
    'area': ALL_COUNTRIES_STR,  # Tous les pays
    'area_cs': 'M49',
    'element': '2910,2610',
    'item': '44,48,46,91,17,45,15,16',
    'item_cs': 'CPC',
    'year': YEARS_STR,  # 2000-2020 (20 ans)
    'show_codes': 'true',
    'show_unit': 'true',
    'show_flags': 'true',
    'show_notes': 'true',
    'null_values': 'false',
    'page_size': '100',
    'output_type': 'objects',
    'caching': 'false'
}

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'application/json'
}


def find_existing_csv(output_dir='bulk_csv_output'):
    """Trouve le fichier CSV TCL le plus récent"""
    if not os.path.exists(output_dir):
        return None
    
    csv_files = [f for f in os.listdir(output_dir) if f.startswith('TCL_complete_data_') and f.endswith('.csv')]
    if not csv_files:
        return None
    
    # Trouver le fichier le plus récent
    csv_files.sort()
    latest_file = os.path.join(output_dir, csv_files[-1])
    return latest_file


def count_existing_records(csv_file):
    """Compte le nombre d'enregistrements dans le fichier CSV existant"""
    try:
        with open(csv_file, 'r', encoding='utf-8', newline='') as f:
            reader = csv.DictReader(f)
            count = sum(1 for _ in reader)
        return count
    except Exception as e:
        print(f"[ERREUR] Impossible de lire le fichier existant: {e}")
        return 0


def load_existing_data(csv_file):
    """Charge les données existantes depuis le CSV"""
    try:
        with open(csv_file, 'r', encoding='utf-8', newline='') as f:
            reader = csv.DictReader(f)
            data = list(reader)
        return data
    except Exception as e:
        print(f"[ERREUR] Impossible de charger les donnees existantes: {e}")
        return []


def scrape_all_pages(start_page=1, existing_csv_file=None):
    """Scrape toutes les pages de données, en reprenant depuis start_page"""
    all_data = []
    page_number = start_page
    
    print("Demarrage du scraping TCL...")
    print(f"URL: {API_BASE}")
    print(f"Pays: {len(ALL_COUNTRIES)} pays")
    print(f"Annees: {YEARS[0]} - {YEARS[-1]} ({len(YEARS)} annees)")
    
    if existing_csv_file:
        print(f"[INFO] Reprise depuis la page {start_page}")
        print(f"[INFO] Fichier existant: {existing_csv_file}")
    
    while True:
        params = PARAMS.copy()
        params['page_number'] = str(page_number)
        
        print(f"\nRecuperation de la page {page_number}...", end=' ', flush=True)
        
        try:
            response = requests.get(API_BASE, params=params, headers=HEADERS, timeout=180)
            response.raise_for_status()
            
            data = response.json()
            
            if 'data' in data and data['data']:
                page_data = data['data']
                all_data.extend(page_data)
                print(f"[OK] {len(page_data)} enregistrements recuperes (Total: {len(all_data)})")
            else:
                print("Aucune donnee")
                break
            
            # Vérifier s'il y a d'autres pages
            has_more_pages = False
            
            if 'metadata' in data and 'page_meta' in data['metadata']:
                page_meta = data['metadata']['page_meta']
                total_pages = page_meta.get('total_pages', 1)
                current_page = page_meta.get('page_number', page_number)
                total_records = page_meta.get('total_records', 0)
                
                print(f" (Page {current_page}/{total_pages}, Total records: {total_records})")
                
                if current_page < total_pages:
                    has_more_pages = True
                    page_number = current_page + 1
                else:
                    print(f"\nToutes les pages recuperees! Total: {len(all_data)} enregistrements")
                    break
            else:
                # Si on obtient moins de records que la taille de page, c'est la dernière page
                if len(page_data) < int(PARAMS['page_size']):
                    print(" (Derniere page - moins de records que la taille de page)")
                    break
                else:
                    # Continuer à essayer la page suivante
                    has_more_pages = True
                    page_number += 1
                    print(f" (Poursuite avec la page suivante...)")
            
            # Si pas de métadonnées et on a obtenu exactement la taille de page, continuer
            if not has_more_pages and len(page_data) == int(PARAMS['page_size']):
                page_number += 1
                has_more_pages = True
                
            if not has_more_pages:
                break
                
        except requests.exceptions.RequestException as e:
            print(f"\n[ERREUR] Erreur lors de la requete (page {page_number}): {e}")
            # En cas d'erreur 504 ou timeout, sauvegarder ce qu'on a et continuer
            if "504" in str(e) or "timeout" in str(e).lower():
                print(f"[INFO] Timeout/504 detecte. Donnees accumulees jusqu'a la page {page_number-1}")
                if all_data:
                    print(f"[INFO] Sauvegarde des {len(all_data)} nouveaux enregistrements...")
                break
            break
        except Exception as e:
            print(f"\n[ERREUR] {e}")
            break
    
    return all_data


def save_to_csv(data, output_dir='bulk_csv_output', existing_csv_file=None):
    """Sauvegarde les données dans un fichier CSV, ou ajoute au fichier existant"""
    if not data:
        print("Aucune donnée à sauvegarder!")
        return None
    
    # Créer le dossier de sortie
    os.makedirs(output_dir, exist_ok=True)
    
    # Si un fichier existant est fourni, ajouter les données
    if existing_csv_file and os.path.exists(existing_csv_file):
        print(f"\nAjout des nouvelles donnees au fichier existant: {existing_csv_file}")
        
        # Charger les données existantes
        existing_data = load_existing_data(existing_csv_file)
        combined_data = existing_data + data
        
        print(f"[INFO] Donnees existantes: {len(existing_data)} enregistrements")
        print(f"[INFO] Nouvelles donnees: {len(data)} enregistrements")
        print(f"[INFO] Total combine: {len(combined_data)} enregistrements")
        
        # Écrire le CSV mis à jour
        try:
            with open(existing_csv_file, 'w', newline='', encoding='utf-8') as f:
                if combined_data:
                    fieldnames = list(combined_data[0].keys())
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for record in combined_data:
                        writer.writerow(record)
            
            print(f"[OK] Fichier CSV mis a jour: {existing_csv_file}")
            print(f"  Total d'enregistrements: {len(combined_data)}")
            print(f"  Taille du fichier: {os.path.getsize(existing_csv_file) / 1024 / 1024:.2f} MB")
            
            return existing_csv_file
        except Exception as e:
            print(f"[ERREUR] Erreur lors de la mise a jour du CSV: {e}")
            return None
    else:
        # Créer un nouveau fichier
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = os.path.join(output_dir, f'TCL_complete_data_{timestamp}.csv')
        
        print(f"\nSauvegarde dans {filename}...")
        
        try:
            with open(filename, 'w', newline='', encoding='utf-8') as f:
                if data:
                    fieldnames = list(data[0].keys())
                    writer = csv.DictWriter(f, fieldnames=fieldnames)
                    writer.writeheader()
                    
                    for record in data:
                        writer.writerow(record)
            
            print(f"[OK] Fichier CSV cree: {filename}")
            print(f"  Total d'enregistrements: {len(data)}")
            print(f"  Taille du fichier: {os.path.getsize(filename) / 1024 / 1024:.2f} MB")
            
            return filename
        except Exception as e:
            print(f"[ERREUR] Erreur lors de l'ecriture du CSV: {e}")
            return None


def main():
    """Fonction principale"""
    print("=" * 60)
    print("SCRAPER TCL FAOSTAT")
    print("=" * 60)
    
    # Vérifier s'il existe déjà un fichier CSV
    existing_csv = find_existing_csv()
    start_page = 1
    
    if existing_csv:
        existing_count = count_existing_records(existing_csv)
        # Calculer la page de départ basée sur le nombre d'enregistrements (100 par page)
        # Si on a 18000 enregistrements (180 pages complètes), on reprend à la page 181
        # Mais comme l'erreur s'est produite à la page 181, on reprend à la page 182
        pages_completed = existing_count // 100
        start_page = pages_completed + 1
        
        # Si le nombre d'enregistrements est exactement divisible par 100,
        # cela signifie que la dernière page était complète, on reprend donc à la page suivante
        if existing_count % 100 == 0:
            start_page = pages_completed + 1
        else:
            # Sinon, on reprend à la page suivante après la dernière page complète
            start_page = pages_completed + 2
        
        print(f"\n[INFO] Fichier existant trouve: {existing_csv}")
        print(f"[INFO] Enregistrements existants: {existing_count}")
        print(f"[INFO] Pages completes: {pages_completed}")
        print(f"[INFO] Reprise depuis la page: {start_page}")
    
    # Scraper toutes les pages (en reprenant depuis start_page si nécessaire)
    all_data = scrape_all_pages(start_page=start_page, existing_csv_file=existing_csv)
    
    # Sauvegarder dans un CSV (ou ajouter au fichier existant)
    if all_data:
        csv_file = save_to_csv(all_data, existing_csv_file=existing_csv)
        if csv_file:
            print(f"\n[SUCCES] Fichier mis a jour: {csv_file}")
        else:
            print("\n[ERREUR] Erreur lors de la sauvegarde du fichier CSV")
    else:
        if existing_csv:
            print(f"\n[INFO] Aucune nouvelle donnee recuperee. Fichier existant intact: {existing_csv}")
        else:
            print("\n[ERREUR] Aucune donnee recuperee")


if __name__ == "__main__":
    main()

