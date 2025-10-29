# FAOSTAT Bulk Scraper

Ce script permet de scraper des données en masse depuis l'API FAOSTAT avec pagination automatique.

## Installation

```bash
pip install requests
```

## Utilisation

### Exemple de base (tous les pays, Barley, Wheat)

```bash
python faostat_scraper_bulk.py --output csv
```

Cela va scraper:
- Tous les pays de la liste FAOSTAT
- Items: 44 (Barley), 108 (Other Cereals), 15 (Wheat)
- Element: 2510 (Production)
- Années: 1961-2023

### Utilisation personnalisée

```bash
# Spécifier certains pays seulement
python faostat_scraper_bulk.py --areas "212,59,143" --items "44,15" --element "2510" --output csv

# Changer les années
python faostat_scraper_bulk.py --years "2020-2023" --output csv

# Utiliser des années spécifiques
python faostat_scraper_bulk.py --years "2020,2021,2022,2023" --output csv

# JSON output (par défaut)
python faostat_scraper_bulk.py --output json
```

## Paramètres

- `--areas`: Codes de pays séparés par virgule (ex: "212,59,143" pour Tunisia, Egypt, Morocco)
- `--items`: Codes d'items séparés par virgule (ex: "44,108,15" pour Barley, Other Cereals, Wheat)
- `--elements`: Codes d'éléments séparés par virgule (ex: "2510" pour Production)
- `--years`: Années séparées par virgule ou range comme "2020-2023"
- `--year-start`: Année de début (défaut: 1961)
- `--year-end`: Année de fin (défaut: 2023)
- `--output`: Format de sortie, 'json' ou 'csv' (défaut: csv)

## Codes de pays importants

Voici quelques codes de pays courants:

| Pays | Code |
|------|------|
| Tunisia | 222 |
| Egypt | 59 |
| Morocco | 121 |
| Algeria | 4 |
| Libya | 124 |
| Sudan | 162 |
| Saudi Arabia | 150 |
| United States | 179 |
| China | 351 |
| India | 100 |

## Format de sortie

Le script génère:
1. Un fichier CSV dans `bulk_csv_output/` avec tous les enregistrements
2. Un fichier JSON dans `bulk_csv_output/` avec toutes les données brutes

Le CSV contient des colonnes comme:
- Domain Code, Domain
- Area Code, Area
- Element Code, Element  
- Item Code, Item
- Year Code, Year
- Unit, Value, Flag, Flag Description, Note

## Notes

- Le script gère automatiquement la pagination pour récupérer toutes les données
- Les données sont sauvegardées avec un timestamp dans le nom du fichier
- Le script affiche le progrès dans stderr pour suivre la progression

